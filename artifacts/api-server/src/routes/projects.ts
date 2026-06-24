import { db } from "@workspace/db";
import { projects } from "@workspace/db/schema";
import { and, eq, desc } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

const createProjectSchema = z.object({
  title: z.string().min(1).max(128),
  description: z.string().max(1000).default(""),
  genre: z.string().max(64).default("RPG"),
  artStyle: z.string().max(64).default("Pixel Art"),
  platform: z.string().max(64).default("Multi-platform"),
  tags: z.array(z.string()).max(10).default([]),
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

  const [project] = await db
    .insert(projects)
    .values({ ...result.data, ownerId: req.user!.sub })
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
