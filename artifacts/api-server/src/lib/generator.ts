/**
 * Core 6-phase game generation pipeline.
 * Used by both the SSE streaming endpoint and the background job handler.
 */

import { db } from "@workspace/db";
import { aiTasks, assets, projects } from "@workspace/db/schema";
import { routeTask } from "@workspace/ai-router";
import { and, eq } from "drizzle-orm";
import {
  genCoverArt,
  genProtagonistArt,
  genBossArt,
  genEnvironmentArt,
  type GameImageCtx,
} from "./imageGen";
import { getProjectMemory, writeMemories, buildMemoryContext } from "./agentMemory";

export interface GenerateParams {
  prompt: string;
  genre: string;
  artStyle: string;
  difficulty: string;
  gameLength: string;
  worldSize: string;
  numBosses: number;
}

export interface PhaseEvent {
  event: string;
  [key: string]: unknown;
}

export type OnEvent = (e: PhaseEvent) => void;

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

/**
 * Best-effort telemetry: record one ai_tasks row per generation phase.
 * Wrapped so a telemetry failure can never break the generation pipeline.
 * The /api/telemetry endpoint aggregates these rows into real metrics.
 */
async function recordTask(
  projectId: string,
  ownerId: string,
  agentName: string,
  taskType: string,
  startedAt: Date,
  model: string | undefined,
  status: "completed" | "failed" = "completed",
  errorMessage?: string,
): Promise<void> {
  try {
    const completedAt = new Date();
    await db.insert(aiTasks).values({
      projectId,
      ownerId,
      agentName,
      agentPhase: taskType,
      taskType,
      status,
      progress: status === "completed" ? 100 : 0,
      outputData: model ? { model } : {},
      errorMessage: errorMessage ?? null,
      executionTimeMs: completedAt.getTime() - startedAt.getTime(),
      startedAt,
      completedAt,
    });
  } catch {
    // telemetry is best-effort; never surface to the caller
  }
}

/**
 * routeTask wrapper that records a real ai_tasks telemetry row (timing, model,
 * success/failure) around each AI call. Rethrows on error so flow is unchanged.
 */
async function tracked(
  projectId: string,
  ownerId: string,
  agentName: string,
  taskType: Parameters<typeof routeTask>[0],
  messages: Parameters<typeof routeTask>[1],
): Promise<Awaited<ReturnType<typeof routeTask>>> {
  const startedAt = new Date();
  try {
    const result = await routeTask(taskType, messages);
    void recordTask(projectId, ownerId, agentName, String(taskType), startedAt, result.model, "completed");
    return result;
  } catch (err) {
    void recordTask(
      projectId,
      ownerId,
      agentName,
      String(taskType),
      startedAt,
      undefined,
      "failed",
      err instanceof Error ? err.message : "unknown error",
    );
    throw err;
  }
}

/**
 * Run the full 6-phase generation for a project.
 * `onEvent` receives phase lifecycle events (same shape as the SSE stream).
 * Throws on unrecoverable error; the caller is responsible for cleanup.
 */
export async function runGeneration(
  projectId: string,
  ownerId: string,
  params: GenerateParams,
  onEvent: OnEvent
): Promise<void> {
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.ownerId, ownerId)))
    .limit(1);

  if (!project) throw new Error("Project not found");

  const p = params;
  const ctx = `Title: ${project.title}
Description: ${p.prompt || project.description}
Genre: ${p.genre}
Art Style: ${p.artStyle}
Difficulty: ${p.difficulty}
Game Length: ${p.gameLength}
World Size: ${p.worldSize}
Number of Bosses: ${p.numBosses}`;

  await db
    .update(projects)
    .set({ status: "generating", updatedAt: new Date() })
    .where(eq(projects.id, projectId));

  // Load existing memories to inject as context for continuity
  const existingMemories = await getProjectMemory(projectId);
  const memCtx = buildMemoryContext(existingMemories);
  onEvent({ event: "memory_loaded", count: existingMemories.length });

  // ── Phase 1: Foundation ────────────────────────────────────────────────────
  onEvent({ event: "phase_start", phase: 1, label: "Foundation" });
  const foundationResult = await tracked(projectId, ownerId, "Foundation Agent", "foundation", [
    { role: "system", content: "You are a game design expert. Always respond with valid JSON only, no extra text." },
    { role: "user", content: `Generate a game design foundation for this game as valid JSON:\n${ctx}${memCtx}\n\nSchema: {"tagline": string, "coreLoop": string, "uniqueMechanic": string, "targetAudience": string, "genreFeatures": string[], "tone": string, "setting": string}` },
  ]);
  onEvent({ event: "phase_model", phase: 1, model: foundationResult.model });
  const storyData: Record<string, unknown> = {
    prompt: p.prompt || project.description,
    ...parseJSON(foundationResult.content),
  };
  await db
    .update(projects)
    .set({ storyData, progress: 16, updatedAt: new Date() })
    .where(eq(projects.id, projectId));
  // Write key foundation decisions to memory
  void writeMemories(projectId, ownerId, 1, "Foundation Agent", {
    ...(typeof storyData.tone === "string" ? { Tone: storyData.tone } : {}),
    ...(typeof storyData.setting === "string" ? { Setting: storyData.setting } : {}),
    ...(typeof storyData.coreLoop === "string" ? { "Core Loop": storyData.coreLoop } : {}),
    ...(typeof storyData.uniqueMechanic === "string" ? { "Unique Mechanic": storyData.uniqueMechanic } : {}),
    ...(typeof storyData.tagline === "string" ? { Tagline: storyData.tagline } : {}),
  });
  onEvent({ event: "phase_complete", phase: 1, progress: 16 });

  // ── Phase 2: World & Story ─────────────────────────────────────────────────
  onEvent({ event: "phase_start", phase: 2, label: "World & Story" });
  const worldResult = await tracked(projectId, ownerId, "World Architect", "story", [
    { role: "system", content: "You are a world-building expert. Always respond with valid JSON only, no extra text." },
    { role: "user", content: `Generate world and story content for this game as valid JSON:\n${ctx}\nFoundation: ${JSON.stringify(storyData).slice(0, 400)}${memCtx}\n\nSchema: {"worldName": string, "loreSummary": string, "acts": [{"title": string, "summary": string}], "factions": [{"name": string, "description": string}], "theme": string, "openingHook": string}` },
  ]);
  onEvent({ event: "phase_model", phase: 2, model: worldResult.model });
  const worldData = parseJSON(worldResult.content);
  await db
    .update(projects)
    .set({ worldData, progress: 33, updatedAt: new Date() })
    .where(eq(projects.id, projectId));
  // Write world decisions to memory
  void writeMemories(projectId, ownerId, 2, "World Architect", {
    ...(typeof worldData.worldName === "string" ? { "World Name": worldData.worldName } : {}),
    ...(typeof worldData.theme === "string" ? { Theme: worldData.theme } : {}),
    ...(typeof worldData.loreSummary === "string" ? { "Lore Summary": worldData.loreSummary.slice(0, 200) } : {}),
    ...(typeof worldData.openingHook === "string" ? { "Opening Hook": worldData.openingHook.slice(0, 200) } : {}),
  });
  onEvent({ event: "phase_complete", phase: 2, progress: 33 });

  // ── Phase 3: Characters & Content ─────────────────────────────────────────
  onEvent({ event: "phase_start", phase: 3, label: "Characters & Content" });
  const charResult = await tracked(projectId, ownerId, "Character Designer", "characters", [
    { role: "system", content: "You are a game character and quest designer. Always respond with valid JSON only, no extra text." },
    { role: "user", content: `Generate characters and quests for this game as valid JSON:\n${ctx}\nWorld: ${JSON.stringify(worldData).slice(0, 400)}\n\nSchema: {"protagonist": {"name": string, "backstory": string, "abilities": string[]}, "npcs": [{"name": string, "role": string, "description": string}], "enemies": [{"name": string, "type": string, "threat": string}], "bosses": [{"name": string, "description": string, "phase": string}], "quests": [{"name": string, "description": string, "reward": string}]}` },
  ]);
  onEvent({ event: "phase_model", phase: 3, model: charResult.model });
  const characterData = parseJSON(charResult.content);
  await db
    .update(projects)
    .set({ characterData, progress: 50, updatedAt: new Date() })
    .where(eq(projects.id, projectId));
  // Write character decisions to memory
  const protagonist = characterData.protagonist as Record<string, unknown> | undefined;
  const bosses = characterData.bosses as Record<string, unknown>[] | undefined;
  void writeMemories(projectId, ownerId, 3, "Character Designer", {
    ...(typeof protagonist?.name === "string" ? { "Protagonist Name": protagonist.name } : {}),
    ...(typeof protagonist?.backstory === "string" ? { "Protagonist Backstory": protagonist.backstory.slice(0, 150) } : {}),
    ...(bosses?.[0] && typeof bosses[0].name === "string" ? { "Main Boss": bosses[0].name } : {}),
    ...(Array.isArray(characterData.quests) ? { "Quest Count": String(characterData.quests.length) } : {}),
    ...(Array.isArray(characterData.enemies) ? { "Enemy Types": String(characterData.enemies.length) } : {}),
  });
  onEvent({ event: "phase_complete", phase: 3, progress: 50 });

  // ── Phase 4: Image Generation ──────────────────────────────────────────────
  onEvent({ event: "phase_start", phase: 4, label: "Image Generation" });

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

  const assetManifestResult = await tracked(projectId, ownerId, "Asset Coordinator", "assets", [
    { role: "system", content: "You are a game asset coordinator. Always respond with valid JSON only, no extra text." },
    { role: "user", content: `Generate the asset manifest for this game as valid JSON:\n${ctx}\n\nSchema: {"sprites": [{"category": string, "count": number, "style": string}], "audioTracks": [{"name": string, "type": string, "mood": string, "bpm": number}], "uiElements": [{"name": string, "description": string}], "vfxEffects": [{"name": string, "trigger": string}], "totalAssets": number}` },
  ]);
  onEvent({ event: "phase_model", phase: 4, model: assetManifestResult.model });
  const assetData = parseJSON(assetManifestResult.content);

  onEvent({ event: "asset_generating", phase: 4, message: "Generating cover art, protagonist, boss, and environment art…" });

  const tImages = new Date();
  const [coverRes, protagonistRes, bossRes, envRes] = await Promise.allSettled([
    genCoverArt(imgCtx, projectId),
    genProtagonistArt(imgCtx, projectId),
    genBossArt(imgCtx, projectId),
    genEnvironmentArt(imgCtx, projectId),
  ]);

  const now = new Date();
  let coverArtUrl: string | undefined;
  const imageInserts: { name: string; type: string; category: string; url: string; mimeType: string; model: string; provider: string }[] = [];

  if (coverRes.status === "fulfilled") {
    coverArtUrl = coverRes.value.url;
    imageInserts.push({ name: `${project.title} — Cover Art`, type: "sprite", category: "cover", url: coverRes.value.url, mimeType: coverRes.value.mimeType, model: coverRes.value.model, provider: coverRes.value.provider });
  }
  if (protagonistRes.status === "fulfilled") {
    imageInserts.push({ name: `${imgCtx.protagonistName ?? "Protagonist"} — Character Art`, type: "sprite", category: "character", url: protagonistRes.value.url, mimeType: protagonistRes.value.mimeType, model: protagonistRes.value.model, provider: protagonistRes.value.provider });
  }
  if (bossRes.status === "fulfilled") {
    imageInserts.push({ name: `${imgCtx.bossName ?? "Boss"} — Boss Art`, type: "sprite", category: "boss", url: bossRes.value.url, mimeType: bossRes.value.mimeType, model: bossRes.value.model, provider: bossRes.value.provider });
  }
  if (envRes.status === "fulfilled") {
    imageInserts.push({ name: `${imgCtx.worldName ?? "Environment"} — World Art`, type: "environment", category: "environment", url: envRes.value.url, mimeType: envRes.value.mimeType, model: envRes.value.model, provider: envRes.value.provider });
  }

  const insertedAssets = imageInserts.length > 0
    ? await db.insert(assets).values(
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
          metadata: { generatedBy: img.model, provider: img.provider, phase: 4, imgCtx },
          createdAt: now,
          updatedAt: now,
        }))
      ).returning()
    : [];

  for (const asset of insertedAssets) {
    onEvent({ event: "asset_generated", assetId: asset.id, name: asset.name, category: asset.category, imageUrl: asset.url });
  }
  const imageGenModel = imageInserts[0]?.model ?? "image-router";
  void recordTask(projectId, ownerId, "Image Generator", "assets", tImages, imageGenModel, "completed");

  const updatePayload: Record<string, unknown> = { assetManifest: [assetData], progress: 66, updatedAt: new Date() };
  if (coverArtUrl) updatePayload.coverArt = coverArtUrl;
  await db.update(projects).set(updatePayload).where(eq(projects.id, projectId));
  // Write image generation decisions to memory
  void writeMemories(projectId, ownerId, 4, "Image Generator", {
    ...(imgCtx.protagonistName ? { "Protagonist Visual": `${imgCtx.protagonistName} — ${p.artStyle} character art` } : {}),
    ...(imgCtx.bossName ? { "Boss Visual": `${imgCtx.bossName} — ${p.artStyle} boss art` } : {}),
    ...(imgCtx.worldName ? { "World Visual": `${imgCtx.worldName} — ${p.artStyle} environment art` } : {}),
    "Images Generated": String(insertedAssets.length),
    "Art Style Used": p.artStyle,
  });
  onEvent({ event: "phase_complete", phase: 4, progress: 66, imagesGenerated: insertedAssets.length });

  // ── Phase 5: Combat & Balance ──────────────────────────────────────────────
  onEvent({ event: "phase_start", phase: 5, label: "QA & Balance" });
  const combatResult = await tracked(projectId, ownerId, "Balance Agent", "balance", [
    { role: "system", content: "You are a game balance expert. Always respond with valid JSON only, no extra text." },
    { role: "user", content: `Generate combat and balance parameters for this game as valid JSON:\n${ctx}${memCtx}\n\nSchema: {"combatSystem": string, "coreMechanics": string[], "playerStats": {"healthRange": string, "damageRange": string, "levelCap": number}, "enemyScaling": string, "difficultyModifiers": {"easy": string, "normal": string, "hard": string}, "economy": {"currency": string, "progressionLoop": string}, "balanceNotes": string}` },
  ]);
  onEvent({ event: "phase_model", phase: 5, model: combatResult.model });
  const combatData = parseJSON(combatResult.content);
  await db
    .update(projects)
    .set({ combatData, progress: 83, updatedAt: new Date() })
    .where(eq(projects.id, projectId));
  // Write balance decisions to memory
  void writeMemories(projectId, ownerId, 5, "Balance Agent", {
    ...(typeof combatData.combatSystem === "string" ? { "Combat System": combatData.combatSystem } : {}),
    ...(typeof combatData.enemyScaling === "string" ? { "Enemy Scaling": combatData.enemyScaling } : {}),
    ...((combatData.economy as Record<string, unknown>)?.currency
      ? { Currency: String((combatData.economy as Record<string, unknown>).currency) }
      : {}),
    ...(typeof combatData.balanceNotes === "string"
      ? { "Balance Notes": combatData.balanceNotes.slice(0, 200) }
      : {}),
  });
  onEvent({ event: "phase_complete", phase: 5, progress: 83 });

  // ── Phase 6: Packaging ─────────────────────────────────────────────────────
  onEvent({ event: "phase_start", phase: 6, label: "Packaging & Export" });
  const tPackaging = new Date();
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
    .set({ exportConfigs, status: "in_progress", progress: 100, lastGeneratedAt: new Date(), updatedAt: new Date() })
    .where(eq(projects.id, projectId));
  void recordTask(projectId, ownerId, "Export Agent", "packaging", tPackaging, undefined, "completed");
  onEvent({ event: "phase_complete", phase: 6, progress: 100 });
  onEvent({ event: "done", progress: 100 });
}
