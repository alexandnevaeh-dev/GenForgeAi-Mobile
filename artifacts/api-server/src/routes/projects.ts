import { db } from "@workspace/db";
import { projects } from "@workspace/db/schema";
import { and, eq, desc } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/requireAuth";
import { routeTask } from "@workspace/ai-router";

const router = Router();

const createProjectSchema = z.object({
  title: z.string().min(1).max(128),
  description: z.string().max(1000).default(""),
  genre: z.string().max(64).default("RPG"),
  artStyle: z.string().max(64).default("Pixel Art"),
  platform: z.string().max(64).default("Multi-platform"),
  tags: z.array(z.string()).max(10).default([]),
  prompt: z.string().max(1000).optional(),
});

const updateProjectSchema = createProjectSchema.partial().extend({
  status: z.enum(["planning", "generating", "in_progress", "complete", "exported", "archived"]).optional(),
  progress: z.number().int().min(0).max(100).optional(),
  storyData: z.record(z.string(), z.unknown()).optional(),
  worldData: z.record(z.string(), z.unknown()).optional(),
  characterData: z.record(z.string(), z.unknown()).optional(),
  combatData: z.record(z.string(), z.unknown()).optional(),
  isFavorite: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  isArchived: z.boolean().optional(),
});

router.get("/projects", requireAuth, async (req, res) => {
  const userProjects = await db
    .select()
    .from(projects)
    .where(and(eq(projects.ownerId, req.user!.sub), eq(projects.isArchived, false)))
    .orderBy(desc(projects.updatedAt));

  res.json({ projects: userProjects });
});

router.post("/projects", requireAuth, async (req, res) => {
  const result = createProjectSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: "Validation failed", details: result.error.issues });
    return;
  }

  const { prompt, ...rest } = result.data;
  const [project] = await db
    .insert(projects)
    .values({ ...rest, ownerId: req.user!.sub, storyData: prompt ? { prompt } : {} })
    .returning();

  res.status(201).json({ project });
});

router.get("/projects/:id", requireAuth, async (req, res) => {
  const id = req.params["id"] as string;
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.ownerId, req.user!.sub)))
    .limit(1);

  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  res.json({ project });
});

router.patch("/projects/:id", requireAuth, async (req, res) => {
  const id = req.params["id"] as string;
  const result = updateProjectSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: "Validation failed", details: result.error.issues });
    return;
  }

  const [existing] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.ownerId, req.user!.sub)))
    .limit(1);

  if (!existing) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  const [updated] = await db
    .update(projects)
    .set({ ...result.data, updatedAt: new Date() })
    .where(eq(projects.id, id))
    .returning();

  res.json({ project: updated });
});

/** POST /api/projects/:id/analyze — extract structured intent from the project's prompt */
router.post("/projects/:id/analyze", requireAuth, async (req, res) => {
  const id = req.params["id"] as string;
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.ownerId, req.user!.sub)))
    .limit(1);

  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  const storyData = (project.storyData ?? {}) as Record<string, unknown>;
  const prompt = (storyData["prompt"] as string | undefined) ?? project.description ?? "";
  const genre = project.genre;
  const artStyle = project.artStyle;

  // Return cached analysis if it exists and wasn't forced
  if (storyData["intentAnalysis"] && req.query["force"] !== "true") {
    res.json({ analysis: storyData["intentAnalysis"] });
    return;
  }

  try {
    const result = await routeTask("foundation", [
      {
        role: "system",
        content: `You are an expert game design analyst. Extract structured parameters from a game prompt.
Respond ONLY with valid JSON matching exactly this schema (no extra text, no markdown):
{
  "genre": "primary genre (e.g. RPG, Platformer, Strategy)",
  "subGenre": "secondary genre or style (e.g. Metroidvania, Roguelite, Tower Defense)",
  "visualStyle": "visual description (e.g. Dark pixel art, Cel-shaded 3D, Minimalist)",
  "camera": "perspective (e.g. 2D Side-scroll, Top-down, Isometric, First-person, 3D Third-person)",
  "networking": "Single-player | Co-op | Competitive Multiplayer | MMO | Asynchronous",
  "platform": "Mobile | Desktop | Browser | Console | Multi-platform",
  "gameLength": "Short <2h | Medium 5-10h | Long 20h+ | Epic 100h+",
  "targetAudience": "Casual | Hardcore | Mixed | Kids | Teens | Adults",
  "difficulty": "Easy | Normal | Hard | Brutal | Adaptive",
  "engine": "Godot 4 | Unity | Phaser | Unreal | Generic",
  "monetization": "Free | Premium | Freemium | DLC | Subscription",
  "accessibility": "Basic | Full",
  "coreTheme": "one sentence describing the emotional core and fantasy of this game",
  "uniqueMechanic": "the one mechanic that makes this game stand out",
  "estimatedScope": "Small (solo dev) | Medium (indie team) | Large (mid studio) | Epic (AAA)",
  "toneKeywords": ["3 to 5 mood/tone words like Dark, Epic, Cozy, Tense, Whimsical"]
}`,
      },
      {
        role: "user",
        content: `Game prompt: "${prompt}"\nGenre hint: ${genre}\nArt style hint: ${artStyle}\n\nExtract structured parameters as JSON.`,
      },
    ]);

    let analysis: Record<string, unknown> = {};
    try {
      const text = result.content.trim();
      const jsonStart = text.indexOf("{");
      const jsonEnd = text.lastIndexOf("}");
      if (jsonStart !== -1 && jsonEnd !== -1) {
        analysis = JSON.parse(text.slice(jsonStart, jsonEnd + 1)) as Record<string, unknown>;
      }
    } catch {
      res.status(500).json({ error: "Could not parse analysis response" });
      return;
    }

    // Cache the result in storyData
    await db
      .update(projects)
      .set({ storyData: { ...storyData, intentAnalysis: analysis }, updatedAt: new Date() })
      .where(eq(projects.id, id));

    res.json({ analysis });
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Analysis failed";
    res.status(500).json({ error: msg });
  }
});

router.delete("/projects/:id", requireAuth, async (req, res) => {
  const id = req.params["id"] as string;
  const [existing] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, id), eq(projects.ownerId, req.user!.sub)))
    .limit(1);

  if (!existing) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  await db.delete(projects).where(eq(projects.id, id));
  res.json({ ok: true });
});

export default router;
