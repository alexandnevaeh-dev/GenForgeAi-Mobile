import { db } from "@workspace/db";
import { assets } from "@workspace/db/schema";
import { and, eq, desc } from "drizzle-orm";
import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

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

export default router;
