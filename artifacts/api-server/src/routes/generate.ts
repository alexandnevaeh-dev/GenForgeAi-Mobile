import { db } from "@workspace/db";
import { projects } from "@workspace/db/schema";
import { openai } from "@workspace/integrations-openai-ai-server";
import { and, eq } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/requireAuth";

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

async function ai(systemPrompt: string, userPrompt: string): Promise<string> {
  const resp = await openai.chat.completions.create({
    model: "gpt-5-mini",
    max_completion_tokens: 2048,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });
  return resp.choices[0]?.message?.content ?? "";
}

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

router.post("/projects/:id/generate", requireAuth, async (req, res) => {
  const projectId = req.params["id"] as string;

  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.ownerId, req.user!.sub)))
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
    const foundationRaw = await ai(
      "You are a game design expert. Always respond with valid JSON only, no extra text.",
      `Generate a game design foundation for this game as valid JSON:\n${ctx}\n\nSchema: {"tagline": string, "coreLoop": string, "uniqueMechanic": string, "targetAudience": string, "genreFeatures": string[], "tone": string, "setting": string}`
    );
    const storyData: Record<string, unknown> = {
      prompt: p.prompt || project.description,
      ...parseJSON(foundationRaw),
    };
    await db
      .update(projects)
      .set({ storyData, progress: 16, updatedAt: new Date() })
      .where(eq(projects.id, projectId));
    send({ event: "phase_complete", phase: 1, progress: 16 });

    // ── Phase 2: World & Story ─────────────────────────────────────────────
    send({ event: "phase_start", phase: 2, label: "World & Story" });
    const worldRaw = await ai(
      "You are a world-building expert. Always respond with valid JSON only, no extra text.",
      `Generate world and story content for this game as valid JSON:\n${ctx}\nFoundation: ${JSON.stringify(storyData).slice(0, 400)}\n\nSchema: {"worldName": string, "loreSummary": string, "acts": [{"title": string, "summary": string}], "factions": [{"name": string, "description": string}], "theme": string, "openingHook": string}`
    );
    const worldData = parseJSON(worldRaw);
    await db
      .update(projects)
      .set({ worldData, progress: 33, updatedAt: new Date() })
      .where(eq(projects.id, projectId));
    send({ event: "phase_complete", phase: 2, progress: 33 });

    // ── Phase 3: Characters & Content ──────────────────────────────────────
    send({ event: "phase_start", phase: 3, label: "Characters & Content" });
    const charRaw = await ai(
      "You are a game character and quest designer. Always respond with valid JSON only, no extra text.",
      `Generate characters and quests for this game as valid JSON:\n${ctx}\nWorld: ${JSON.stringify(worldData).slice(0, 400)}\n\nSchema: {"protagonist": {"name": string, "backstory": string, "abilities": string[]}, "npcs": [{"name": string, "role": string, "description": string}], "enemies": [{"name": string, "type": string, "threat": string}], "bosses": [{"name": string, "description": string, "phase": string}], "quests": [{"name": string, "description": string, "reward": string}]}`
    );
    const characterData = parseJSON(charRaw);
    await db
      .update(projects)
      .set({ characterData, progress: 50, updatedAt: new Date() })
      .where(eq(projects.id, projectId));
    send({ event: "phase_complete", phase: 3, progress: 50 });

    // ── Phase 4: Assets ────────────────────────────────────────────────────
    send({ event: "phase_start", phase: 4, label: "Asset Generation" });
    const assetRaw = await ai(
      "You are a game asset coordinator. Always respond with valid JSON only, no extra text.",
      `Generate the asset manifest for this game as valid JSON:\n${ctx}\n\nSchema: {"sprites": [{"category": string, "count": number, "style": string}], "audioTracks": [{"name": string, "type": string, "mood": string, "bpm": number}], "uiElements": [{"name": string, "description": string}], "vfxEffects": [{"name": string, "trigger": string}], "totalAssets": number}`
    );
    const assetData = parseJSON(assetRaw);
    await db
      .update(projects)
      .set({ assetManifest: [assetData], progress: 66, updatedAt: new Date() })
      .where(eq(projects.id, projectId));
    send({ event: "phase_complete", phase: 4, progress: 66 });

    // ── Phase 5: Combat & Balance ──────────────────────────────────────────
    send({ event: "phase_start", phase: 5, label: "QA & Balance" });
    const combatRaw = await ai(
      "You are a game balance expert. Always respond with valid JSON only, no extra text.",
      `Generate combat and balance parameters for this game as valid JSON:\n${ctx}\n\nSchema: {"combatSystem": string, "coreMechanics": string[], "playerStats": {"healthRange": string, "damageRange": string, "levelCap": number}, "enemyScaling": string, "difficultyModifiers": {"easy": string, "normal": string, "hard": string}, "economy": {"currency": string, "progressionLoop": string}, "balanceNotes": string}`
    );
    const combatData = parseJSON(combatRaw);
    await db
      .update(projects)
      .set({ combatData, progress: 83, updatedAt: new Date() })
      .where(eq(projects.id, projectId));
    send({ event: "phase_complete", phase: 5, progress: 83 });

    // ── Phase 6: Export & Package ──────────────────────────────────────────
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
