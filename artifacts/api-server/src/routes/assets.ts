import { db } from "@workspace/db";
import { assets, projects } from "@workspace/db/schema";
import { and, eq, desc } from "drizzle-orm";
import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";
import { regenAsset, type GameImageCtx } from "../lib/imageGen";

const router = Router();

// ── GET /assets — list all assets for the authenticated user ──────────────
router.get("/assets", requireAuth, async (req, res) => {
  const userAssets = await db
    .select({
      id: assets.id,
      projectId: assets.projectId,
      name: assets.name,
      type: assets.type,
      category: assets.category,
      url: assets.url,
      thumbnailUrl: assets.thumbnailUrl,
      fileSize: assets.fileSize,
      mimeType: assets.mimeType,
      tags: assets.tags,
      metadata: assets.metadata,
      isFavorite: assets.isFavorite,
      createdAt: assets.createdAt,
    })
    .from(assets)
    .where(eq(assets.ownerId, req.user!.sub))
    .orderBy(desc(assets.createdAt))
    .limit(100);

  res.json({ assets: userAssets });
});

// ── GET /projects/:id/assets — assets for a specific project ─────────────
router.get("/projects/:id/assets", requireAuth, async (req, res) => {
  const projectId = req.params["id"] as string;

  const projectAssets = await db
    .select({
      id: assets.id,
      projectId: assets.projectId,
      name: assets.name,
      type: assets.type,
      category: assets.category,
      url: assets.url,
      thumbnailUrl: assets.thumbnailUrl,
      fileSize: assets.fileSize,
      mimeType: assets.mimeType,
      tags: assets.tags,
      metadata: assets.metadata,
      isFavorite: assets.isFavorite,
      createdAt: assets.createdAt,
    })
    .from(assets)
    .where(and(eq(assets.projectId, projectId), eq(assets.ownerId, req.user!.sub)))
    .orderBy(desc(assets.createdAt));

  res.json({ assets: projectAssets });
});

// ── PATCH /assets/:id/favorite ─────────────────────────────────────────────
router.patch("/assets/:id/favorite", requireAuth, async (req, res) => {
  const id = req.params["id"] as string;
  const { isFavorite } = req.body as { isFavorite?: boolean };

  const [updated] = await db
    .update(assets)
    .set({ isFavorite: isFavorite ?? false, updatedAt: new Date() })
    .where(and(eq(assets.id, id), eq(assets.ownerId, req.user!.sub)))
    .returning({ id: assets.id, isFavorite: assets.isFavorite });

  if (!updated) {
    res.status(404).json({ error: "Asset not found" });
    return;
  }

  res.json({ asset: updated });
});

// ── POST /assets/:id/regenerate — re-generate the image for an asset ──────
router.post("/assets/:id/regenerate", requireAuth, async (req, res) => {
  const id = req.params["id"] as string;

  const [asset] = await db
    .select()
    .from(assets)
    .where(and(eq(assets.id, id), eq(assets.ownerId, req.user!.sub)))
    .limit(1);

  if (!asset) {
    res.status(404).json({ error: "Asset not found" });
    return;
  }

  const category = asset.category as "cover" | "character" | "boss" | "environment";
  if (!["cover", "character", "boss", "environment"].includes(category)) {
    res.status(400).json({ error: "Asset category does not support regeneration" });
    return;
  }

  const meta = (asset.metadata ?? {}) as Record<string, unknown>;
  let imgCtx = meta.imgCtx as GameImageCtx | undefined;

  // Fall back to reading from project if imgCtx wasn't stored in metadata
  if (!imgCtx && asset.projectId) {
    const [project] = await db
      .select()
      .from(projects)
      .where(eq(projects.id, asset.projectId))
      .limit(1);

    if (project) {
      const sd = (project.storyData ?? {}) as Record<string, unknown>;
      const wd = (project.worldData ?? {}) as Record<string, unknown>;
      const cd = (project.characterData ?? {}) as Record<string, unknown>;
      const protagonist = (cd.protagonist ?? {}) as Record<string, unknown>;
      const bosses = (cd.bosses ?? []) as Record<string, unknown>[];

      imgCtx = {
        title: project.title,
        genre: project.genre ?? "",
        artStyle: project.artStyle ?? "",
        prompt: project.description ?? "",
        tone: typeof sd.tone === "string" ? sd.tone : undefined,
        worldName: typeof wd.worldName === "string" ? wd.worldName : undefined,
        protagonistName: typeof protagonist.name === "string" ? protagonist.name : undefined,
        bossName: typeof bosses[0]?.name === "string" ? bosses[0].name : undefined,
      };
    }
  }

  if (!imgCtx) {
    res.status(422).json({ error: "Cannot determine generation context for this asset" });
    return;
  }

  const projectId = asset.projectId ?? req.user!.sub;

  try {
    const newUrl = await regenAsset(category, imgCtx, projectId);

    const [updated] = await db
      .update(assets)
      .set({ url: newUrl, thumbnailUrl: newUrl, updatedAt: new Date() })
      .where(eq(assets.id, id))
      .returning();

    res.json({ asset: updated });
  } catch (err) {
    req.log.error({ err, assetId: id }, "Asset regeneration failed");
    res.status(500).json({ error: "Image generation failed" });
  }
});

// ── DELETE /assets/:id ──────────────────────────────────────────────────────
router.delete("/assets/:id", requireAuth, async (req, res) => {
  const id = req.params["id"] as string;

  const [deleted] = await db
    .delete(assets)
    .where(and(eq(assets.id, id), eq(assets.ownerId, req.user!.sub)))
    .returning({ id: assets.id });

  if (!deleted) {
    res.status(404).json({ error: "Asset not found" });
    return;
  }

  res.json({ deleted: true });
});

export default router;
