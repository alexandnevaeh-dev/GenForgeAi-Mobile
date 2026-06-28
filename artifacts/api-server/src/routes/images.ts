import { db } from "@workspace/db";
import { projects } from "@workspace/db/schema";
import { and, eq } from "drizzle-orm";
import { Router } from "express";
import {
  genCoverArt,
  genProtagonistArt,
  genBossArt,
  genEnvironmentArt,
  genCustomAsset,
  type GameImageCtx,
} from "../lib/imageGen";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

type ImageType = "cover" | "protagonist" | "boss" | "environment" | "custom";

function buildCtx(project: {
  title: string;
  genre: string | null;
  artStyle: string | null;
  storyData: unknown;
  characterData: unknown;
  worldData: unknown;
}): GameImageCtx {
  const characterData = (project.characterData ?? {}) as Record<string, unknown>;
  const storyData     = (project.storyData    ?? {}) as Record<string, unknown>;
  const worldData     = (project.worldData    ?? {}) as Record<string, unknown>;
  const protagonist   = (characterData.protagonist as Record<string, unknown>) ?? {};
  const boss          = (storyData.mainBoss   as Record<string, unknown>) ?? {};
  return {
    title:           project.title,
    genre:           project.genre    ?? "RPG",
    artStyle:        project.artStyle ?? "Pixel Art",
    prompt:          String(storyData.premise ?? storyData.tagline ?? ""),
    protagonistName: String(protagonist.name ?? "Hero"),
    bossName:        String(boss.name ?? "Dark Lord"),
    worldName:       String(worldData.name ?? "the realm"),
    tone:            String(storyData.tone ?? ""),
  };
}

/* ── POST /projects/:id/images/generate-all ─────────────────────
   MUST be declared before the /:type route or Express swallows it. */
router.post("/projects/:id/images/generate-all", requireAuth, async (req, res) => {
  const projectId = req.params["id"] as string;
  const ownerId   = req.user!.sub;

  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.ownerId, ownerId)))
    .limit(1);

  if (!project) { res.status(404).json({ error: "Project not found" }); return; }

  const ctx = buildCtx(project);
  const results: Record<string, string | null> = { cover: null, protagonist: null, boss: null, environment: null };
  const errors: Record<string, string> = {};

  await Promise.allSettled([
    genCoverArt(ctx, projectId).then((u) => { results.cover = u; }).catch((e: unknown) => { errors.cover = String(e); }),
    genProtagonistArt(ctx, projectId).then((u) => { results.protagonist = u; }).catch((e: unknown) => { errors.protagonist = String(e); }),
    genBossArt(ctx, projectId).then((u) => { results.boss = u; }).catch((e: unknown) => { errors.boss = String(e); }),
    genEnvironmentArt(ctx, projectId).then((u) => { results.environment = u; }).catch((e: unknown) => { errors.environment = String(e); }),
  ]);

  if (results.cover) {
    await db.update(projects).set({ coverArt: results.cover }).where(eq(projects.id, projectId));
  }

  res.json({ results, errors });
});

/* ── POST /projects/:id/images/:type ────────────────────────────
   cover | protagonist | boss | environment | custom */
router.post("/projects/:id/images/:type", requireAuth, async (req, res) => {
  const projectId = req.params["id"] as string;
  const type      = req.params["type"] as ImageType;
  const ownerId   = req.user!.sub;

  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.ownerId, ownerId)))
    .limit(1);

  if (!project) { res.status(404).json({ error: "Project not found" }); return; }

  const ctx = buildCtx(project);

  try {
    let url: string;

    if (type === "cover") {
      url = await genCoverArt(ctx, projectId);
      await db.update(projects).set({ coverArt: url }).where(eq(projects.id, projectId));
    } else if (type === "protagonist") {
      url = await genProtagonistArt(ctx, projectId);
    } else if (type === "boss") {
      url = await genBossArt(ctx, projectId);
    } else if (type === "environment") {
      url = await genEnvironmentArt(ctx, projectId);
    } else if (type === "custom") {
      const { prompt, category } = req.body as { prompt?: string; category?: string };
      if (!prompt) { res.status(400).json({ error: "prompt required for custom type" }); return; }
      url = await genCustomAsset({ prompt, style: ctx.artStyle, category: category ?? "sprite", projectId });
    } else {
      res.status(400).json({ error: "Invalid type. Use: cover | protagonist | boss | environment | custom" });
      return;
    }

    res.json({ url, type, projectId });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Image generation failed";
    req.log.error({ err: e }, "Image generation failed");
    res.status(500).json({ error: msg });
  }
});

export default router;
