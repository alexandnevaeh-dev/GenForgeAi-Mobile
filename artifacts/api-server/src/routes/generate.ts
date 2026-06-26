import { db } from "@workspace/db";
import { assets, projects } from "@workspace/db/schema";
import { routeTask } from "@workspace/ai-router";
import { and, eq } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/requireAuth";
import {
  genCoverArt,
  genProtagonistArt,
  genBossArt,
  genEnvironmentArt,
  type GameImageCtx,
} from "../lib/imageGen";

const router = Router();

const generateSchema = z.object({
  prompt: z.string().max(1000).default(""),
  genre: z.string().max(64).default("RPG"),
  artStyle: z.string().max(64).default("Pixel Art"),
  difficulty: z.string().max(32).default("normal"),
  gameLength: z.string().max(32).default("medium"),
  worldSize: z.string().max(32).default("medium"),
  numBosses: z.number().int().min(1).max(10).default(3),
  mode: z.string().max(32).default("autonomous"),
});

function parseJSON(text: string): Record<string, unknown> {
  const cleaned = text.replace(/```json\n?|\n?```/g, "").trim();
  const match = cleaned.match(/\{[\s\S]*\}/);
  if (match) {
    try {
      return JSON.parse(match[0]) as Record<string, unknown>;
    } catch {
      // fall through
    }
  }
  return { rawContent: text };
}

function str(v: unknown): string | undefined {
  return typeof v === "string" && v.length > 0 ? v : undefined;
}

router.post("/projects/:id/generate", requireAuth, async (req, res) => {
  const projectId = req.params["id"] as string;
  const ownerId = req.user!.sub;

  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.ownerId, ownerId)))
    .limit(1);

  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  const send = (data: object) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const parsed = generateSchema.safeParse(req.body);
  if (!parsed.success) {
    send({ event: "error", message: "Invalid generation parameters" });
    res.end();
    return;
  }

  const p = parsed.data;
  const ctx = `Title: ${project.title}
Description: ${p.prompt || project.description}
Genre: ${p.genre}
Art Style: ${p.artStyle}
Difficulty: ${p.difficulty}
Game Length: ${p.gameLength}
World Size: ${p.worldSize}
Number of Bosses: ${p.numBosses}`;

  try {
    await db
      .update(projects)
      .set({ status: "generating", updatedAt: new Date() })
      .where(eq(projects.id, projectId));

    // ── Phase 1: Foundation ────────────────────────────────────────────────
    send({ event: "phase_start", phase: 1, label: "Foundation" });
    const foundationResult = await routeTask("foundation", [
      { role: "system", content: "You are a game design expert. Always respond with valid JSON only, no extra text." },
      { role: "user", content: `Generate a game design foundation for this game as valid JSON:\n${ctx}\n\nSchema: {"tagline": string, "coreLoop": string, "uniqueMechanic": string, "targetAudience": string, "genreFeatures": string[], "tone": string, "setting": string}` },
    ]);
    send({ event: "phase_model", phase: 1, model: foundationResult.model });
    const storyData: Record<string, unknown> = {
      prompt: p.prompt || project.description,
      ...parseJSON(foundationResult.content),
    };
    await db
      .update(projects)
      .set({ storyData, progress: 16, updatedAt: new Date() })
      .where(eq(projects.id, projectId));
    send({ event: "phase_complete", phase: 1, progress: 16 });

    // ── Phase 2: World & Story ─────────────────────────────────────────────
    send({ event: "phase_start", phase: 2, label: "World & Story" });
    const worldResult = await routeTask("story", [
      { role: "system", content: "You are a world-building expert. Always respond with valid JSON only, no extra text." },
      { role: "user", content: `Generate world and story content for this game as valid JSON:\n${ctx}\nFoundation: ${JSON.stringify(storyData).slice(0, 400)}\n\nSchema: {"worldName": string, "loreSummary": string, "acts": [{"title": string, "summary": string}], "factions": [{"name": string, "description": string}], "theme": string, "openingHook": string}` },
    ]);
    send({ event: "phase_model", phase: 2, model: worldResult.model });
    const worldData = parseJSON(worldResult.content);
    await db
      .update(projects)
      .set({ worldData, progress: 33, updatedAt: new Date() })
      .where(eq(projects.id, projectId));
    send({ event: "phase_complete", phase: 2, progress: 33 });

    // ── Phase 3: Characters & Content ─────────────────────────────────────
    send({ event: "phase_start", phase: 3, label: "Characters & Content" });
    const charResult = await routeTask("characters", [
      { role: "system", content: "You are a game character and quest designer. Always respond with valid JSON only, no extra text." },
      { role: "user", content: `Generate characters and quests for this game as valid JSON:\n${ctx}\nWorld: ${JSON.stringify(worldData).slice(0, 400)}\n\nSchema: {"protagonist": {"name": string, "backstory": string, "abilities": string[]}, "npcs": [{"name": string, "role": string, "description": string}], "enemies": [{"name": string, "type": string, "threat": string}], "bosses": [{"name": string, "description": string, "phase": string}], "quests": [{"name": string, "description": string, "reward": string}]}` },
    ]);
    send({ event: "phase_model", phase: 3, model: charResult.model });
    const characterData = parseJSON(charResult.content);
    await db
      .update(projects)
      .set({ characterData, progress: 50, updatedAt: new Date() })
      .where(eq(projects.id, projectId));
    send({ event: "phase_complete", phase: 3, progress: 50 });

    // ── Phase 4: Image Generation ──────────────────────────────────────────
    send({ event: "phase_start", phase: 4, label: "Image Generation" });

    const imgCtx: GameImageCtx = {
      title: project.title,
      genre: p.genre,
      artStyle: p.artStyle,
      prompt: p.prompt || project.description,
      protagonistName: str((characterData.protagonist as Record<string, unknown>)?.name),
      bossName: str((characterData.bosses as Record<string, unknown>[])?.[0]?.name),
      worldName: str(worldData.worldName),
      tone: str(storyData.tone),
    };

    const assetManifestResult = await routeTask("assets", [
      { role: "system", content: "You are a game asset coordinator. Always respond with valid JSON only, no extra text." },
      { role: "user", content: `Generate the asset manifest for this game as valid JSON:\n${ctx}\n\nSchema: {"sprites": [{"category": string, "count": number, "style": string}], "audioTracks": [{"name": string, "type": string, "mood": string, "bpm": number}], "uiElements": [{"name": string, "description": string}], "vfxEffects": [{"name": string, "trigger": string}], "totalAssets": number}` },
    ]);
    send({ event: "phase_model", phase: 4, model: assetManifestResult.model });
    const assetData = parseJSON(assetManifestResult.content);

    // Generate 4 images concurrently — failures don't block each other
    send({ event: "asset_generating", phase: 4, message: "Generating cover art, protagonist, boss, and environment art…" });

    const [coverRes, protagonistRes, bossRes, envRes] = await Promise.allSettled([
      genCoverArt(imgCtx),
      genProtagonistArt(imgCtx),
      genBossArt(imgCtx),
      genEnvironmentArt(imgCtx),
    ]);

    const now = new Date();
    let coverArtUrl: string | undefined;

    const imageInserts: {
      name: string;
      type: string;
      category: string;
      url: string;
      mimeType: string;
    }[] = [];

    if (coverRes.status === "fulfilled") {
      coverArtUrl = coverRes.value;
      imageInserts.push({
        name: `${project.title} — Cover Art`,
        type: "sprite",
        category: "cover",
        url: coverRes.value,
        mimeType: "image/png",
      });
    }
    if (protagonistRes.status === "fulfilled") {
      imageInserts.push({
        name: `${imgCtx.protagonistName ?? "Protagonist"} — Character Art`,
        type: "sprite",
        category: "character",
        url: protagonistRes.value,
        mimeType: "image/png",
      });
    }
    if (bossRes.status === "fulfilled") {
      imageInserts.push({
        name: `${imgCtx.bossName ?? "Boss"} — Boss Art`,
        type: "sprite",
        category: "boss",
        url: bossRes.value,
        mimeType: "image/png",
      });
    }
    if (envRes.status === "fulfilled") {
      imageInserts.push({
        name: `${imgCtx.worldName ?? "Environment"} — World Art`,
        type: "environment",
        category: "environment",
        url: envRes.value,
        mimeType: "image/png",
      });
    }

    // Insert generated images into the assets table
    const insertedAssets = imageInserts.length > 0
      ? await db
          .insert(assets)
          .values(
            imageInserts.map((img) => ({
              projectId,
              ownerId,
              name: img.name,
              type: img.type,
              category: img.category,
              url: img.url,
              thumbnailUrl: img.url,
              mimeType: img.mimeType,
              tags: [p.genre, p.artStyle],
              metadata: { generatedBy: "gpt-image-1", phase: 4 },
              createdAt: now,
              updatedAt: now,
            }))
          )
          .returning()
      : [];

    // Notify client of each generated image
    for (const asset of insertedAssets) {
      send({
        event: "asset_generated",
        assetId: asset.id,
        name: asset.name,
        category: asset.category,
        imageUrl: asset.url,
      });
    }

    // Persist asset manifest + cover art + progress
    const updatePayload: Record<string, unknown> = {
      assetManifest: [assetData],
      progress: 66,
      updatedAt: new Date(),
    };
    if (coverArtUrl) updatePayload.coverArt = coverArtUrl;

    await db
      .update(projects)
      .set(updatePayload)
      .where(eq(projects.id, projectId));

    send({ event: "phase_complete", phase: 4, progress: 66, imagesGenerated: insertedAssets.length });

    // ── Phase 5: Combat & Balance ──────────────────────────────────────────
    send({ event: "phase_start", phase: 5, label: "QA & Balance" });
    const combatResult = await routeTask("balance", [
      { role: "system", content: "You are a game balance expert. Always respond with valid JSON only, no extra text." },
      { role: "user", content: `Generate combat and balance parameters for this game as valid JSON:\n${ctx}\n\nSchema: {"combatSystem": string, "coreMechanics": string[], "playerStats": {"healthRange": string, "damageRange": string, "levelCap": number}, "enemyScaling": string, "difficultyModifiers": {"easy": string, "normal": string, "hard": string}, "economy": {"currency": string, "progressionLoop": string}, "balanceNotes": string}` },
    ]);
    send({ event: "phase_model", phase: 5, model: combatResult.model });
    const combatData = parseJSON(combatResult.content);
    await db
      .update(projects)
      .set({ combatData, progress: 83, updatedAt: new Date() })
      .where(eq(projects.id, projectId));
    send({ event: "phase_complete", phase: 5, progress: 83 });

    // ── Phase 6: Packaging ─────────────────────────────────────────────────
    send({ event: "phase_start", phase: 6, label: "Packaging & Export" });
    const exportConfigs: Record<string, unknown> = {
      primaryTarget: "Godot 4.x",
      supportedTargets: ["Godot 4.x", "HTML5", "Windows", "Android"],
      buildVersion: `1.0.0-${Date.now().toString(36)}`,
      exportedAt: new Date().toISOString(),
      generatedBy: "GenForgeAI v1.0",
      genre: p.genre,
      artStyle: p.artStyle,
    };
    await db
      .update(projects)
      .set({
        exportConfigs,
        status: "in_progress",
        progress: 100,
        lastGeneratedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(projects.id, projectId));
    send({ event: "phase_complete", phase: 6, progress: 100 });
    send({ event: "done", progress: 100 });
    res.end();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed";
    send({ event: "error", message });
    try {
      await db
        .update(projects)
        .set({ status: "planning", updatedAt: new Date() })
        .where(eq(projects.id, projectId));
    } catch {
      // ignore cleanup errors
    }
    res.end();
  }
});

export default router;
