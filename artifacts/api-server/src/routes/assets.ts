import { db } from "@workspace/db";
import { assets, projects } from "@workspace/db/schema";
import { and, eq, desc } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/requireAuth";
import { genCustomAsset, regenAsset, ASSET_CATEGORIES, type GameImageCtx } from "../lib/imageGen";
import { sliceSheet } from "../lib/spriteSheet";
import { getObjectStream, keyFromUrl, uploadBuffer, deleteObject } from "../lib/objectStorage";

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
    const gen = await regenAsset(category, imgCtx, projectId);

    const existingMeta = (asset.metadata ?? {}) as Record<string, unknown>;
    const [updated] = await db
      .update(assets)
      .set({
        url: gen.url,
        thumbnailUrl: gen.url,
        mimeType: gen.mimeType,
        metadata: { ...existingMeta, generatedBy: gen.model, provider: gen.provider },
        updatedAt: new Date(),
      })
      .where(eq(assets.id, id))
      .returning();

    res.json({ asset: updated });
  } catch (err) {
    req.log.error({ err, assetId: id }, "Asset regeneration failed");
    res.status(500).json({ error: "Image generation failed" });
  }
});

// ── POST /assets/generate — on-demand custom asset creation ────────────────
const GenerateAssetSchema = z.object({
  prompt:    z.string().min(3).max(500),
  style:     z.string().min(1),
  category:  z.enum(ASSET_CATEGORIES),
  quality:   z.enum(["fast", "high"]).optional(),
  name:      z.string().min(1).max(120).optional(),
  projectId: z.string().optional(),
});

router.post("/assets/generate", requireAuth, async (req, res) => {
  const parsed = GenerateAssetSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
    return;
  }

  const { prompt, style, category, projectId, name, quality } = parsed.data;

  // If a projectId was provided, verify it belongs to the authenticated user
  if (projectId) {
    const [proj] = await db
      .select({ id: projects.id })
      .from(projects)
      .where(and(eq(projects.id, projectId), eq(projects.ownerId, req.user!.sub)))
      .limit(1);
    if (!proj) {
      res.status(404).json({ error: "Project not found" });
      return;
    }
  }

  try {
    const gen = await genCustomAsset({ prompt, style, category, projectId, quality });

    const assetName = name ?? `${style} ${category.charAt(0).toUpperCase() + category.slice(1)}`;

    const [asset] = await db
      .insert(assets)
      .values({
        ownerId:      req.user!.sub,
        projectId:    projectId ?? null,
        name:         assetName,
        type:         "image",
        category,
        url:          gen.url,
        thumbnailUrl: gen.url,
        mimeType:     gen.mimeType,
        tags:         [style, category, "custom"],
        metadata:     { prompt, style, generated: true, generatedBy: gen.model, provider: gen.provider },
        isFavorite:   false,
      })
      .returning();

    res.status(201).json({ asset });
  } catch (err) {
    req.log.error({ err }, "Custom asset generation failed");
    res.status(500).json({ error: "Image generation failed. Please try again." });
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

// ── POST /assets/:id/slice — slice a sprite sheet into a grid of frames ──────
const SliceSchema = z
  .object({
    rows:    z.number().int().min(1).max(16),
    cols:    z.number().int().min(1).max(16),
    margin:  z.number().int().min(0).max(512).optional(),
    spacing: z.number().int().min(0).max(512).optional(),
  })
  .refine((d) => d.rows * d.cols <= 144, {
    message: "Grid too large: rows * cols must be at most 144 frames",
  });

/** Read a stored object fully into a Buffer. */
async function readObject(key: string): Promise<Buffer | null> {
  const obj = await getObjectStream(key);
  if (!obj) return null;
  const chunks: Buffer[] = [];
  for await (const chunk of obj.stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

router.post("/assets/:id/slice", requireAuth, async (req, res) => {
  const id = req.params["id"] as string;

  const parsed = SliceSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request", details: parsed.error.flatten() });
    return;
  }
  const { rows, cols, margin, spacing } = parsed.data;

  const [asset] = await db
    .select()
    .from(assets)
    .where(and(eq(assets.id, id), eq(assets.ownerId, req.user!.sub)))
    .limit(1);

  if (!asset) {
    res.status(404).json({ error: "Asset not found" });
    return;
  }
  if (!asset.url) {
    res.status(400).json({ error: "Asset has no stored image to slice" });
    return;
  }

  const key = keyFromUrl(asset.url);
  // Defense in depth: only slice keys inside the public generated-asset prefix.
  // The key derives from the user's own asset URL, but this guard ensures we
  // never stream a private object (e.g. PRIVATE_OBJECT_DIR) into the slicer.
  if (!key || !key.startsWith("assets/")) {
    res.status(400).json({ error: "Asset is not a stored image and cannot be sliced" });
    return;
  }

  try {
    const source = await readObject(key);
    if (!source) {
      res.status(404).json({ error: "Source image not found in storage" });
      return;
    }

    const result = await sliceSheet(source, { rows, cols, margin, spacing });

    const slug = asset.projectId ?? "standalone";
    const frames = await Promise.all(
      result.frames.map(async (f) => {
        const url = await uploadBuffer(
          `assets/${slug}/${asset.id}-frame-${f.index}.png`,
          f.buffer,
          "image/png"
        );
        return { index: f.index, row: f.row, col: f.col, url };
      })
    );

    const sheet = {
      rows: result.rows,
      cols: result.cols,
      frameWidth: result.frameWidth,
      frameHeight: result.frameHeight,
      sheetWidth: result.sheetWidth,
      sheetHeight: result.sheetHeight,
    };

    const prevMeta = (asset.metadata as Record<string, unknown> | null) ?? {};

    // Clean up frames from a prior slice so re-slicing doesn't leak orphaned
    // objects in storage. Only delete keys we no longer reference.
    const newUrls = new Set(frames.map((f) => f.url));
    const prevFrames = Array.isArray(prevMeta["frames"])
      ? (prevMeta["frames"] as Array<{ url?: string }>)
      : [];
    await Promise.all(
      prevFrames
        .map((f) => f?.url)
        .filter((u): u is string => typeof u === "string" && !newUrls.has(u))
        .map((u) => {
          const oldKey = keyFromUrl(u);
          return oldKey ? deleteObject(oldKey) : Promise.resolve();
        })
    );

    const [updated] = await db
      .update(assets)
      .set({ metadata: { ...prevMeta, sheet, frames } })
      .where(and(eq(assets.id, asset.id), eq(assets.ownerId, req.user!.sub)))
      .returning();

    res.json({ assetId: asset.id, sheet, frames, asset: updated });
  } catch (err) {
    req.log.error({ err, assetId: id }, "Sprite sheet slicing failed");
    const msg = err instanceof Error ? err.message : "Slicing failed";
    res.status(422).json({ error: msg });
  }
});

export default router;
