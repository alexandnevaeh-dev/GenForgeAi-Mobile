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
  ASSET_CATEGORIES,
  type GameImageCtx,
} from "../lib/imageGen";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

const ALLOWED_CUSTOM_CATEGORIES = new Set<string>(ASSET_CATEGORIES);

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
    genCoverArt(ctx, projectId).then((r) => { results.cover = r.url; }).catch((e: unknown) => { errors.cover = String(e); }),
    genProtagonistArt(ctx, projectId).then((r) => { results.protagonist = r.url; }).catch((e: unknown) => { errors.protagonist = String(e); }),
    genBossArt(ctx, projectId).then((r) => { results.boss = r.url; }).catch((e: unknown) => { errors.boss = String(e); }),
    genEnvironmentArt(ctx, projectId).then((r) => { results.environment = r.url; }).catch((e: unknown) => { errors.environment = String(e); }),
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
    let gen: { url: string; model: string; provider: string };

    if (type === "cover") {
      gen = await genCoverArt(ctx, projectId);
      await db.update(projects).set({ coverArt: gen.url }).where(eq(projects.id, projectId));
    } else if (type === "protagonist") {
      gen = await genProtagonistArt(ctx, projectId);
    } else if (type === "boss") {
      gen = await genBossArt(ctx, projectId);
    } else if (type === "environment") {
      gen = await genEnvironmentArt(ctx, projectId);
    } else if (type === "custom") {
      const { prompt, category, quality } = req.body as { prompt?: string; category?: string; quality?: string };
      if (!prompt) { res.status(400).json({ error: "prompt required for custom type" }); return; }
      const cat = category && ALLOWED_CUSTOM_CATEGORIES.has(category) ? category : "sprite";
      const q = quality === "high" ? "high" : "fast";
      gen = await genCustomAsset({ prompt, style: ctx.artStyle, category: cat, projectId, quality: q });
    } else {
      res.status(400).json({ error: "Invalid type. Use: cover | protagonist | boss | environment | custom" });
      return;
    }

    res.json({ url: gen.url, model: gen.model, provider: gen.provider, type, projectId });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Image generation failed";
    req.log.error({ err: e }, "Image generation failed");
    res.status(500).json({ error: msg });
  }
});

export default router;
