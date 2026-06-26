import { db } from "@workspace/db";
import { agentMemories, projects } from "@workspace/db/schema";
import { and, eq } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import {
  clearMemory,
  deleteMemory,
  getProjectMemory,
  upsertMemory,
} from "../lib/agentMemory";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

/** GET /api/projects/:id/memory — list all memories for a project */
router.get("/projects/:id/memory", requireAuth, async (req, res) => {
  const ownerId = req.user!.sub;
  const projectId = req.params["id"] as string;

  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.ownerId, ownerId)))
    .limit(1);
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }

  const memories = await getProjectMemory(projectId);
  res.json({ memories });
});

const upsertSchema = z.object({
  agent: z.string().min(1).max(64),
  key: z.string().min(1).max(128),
  value: z.string().min(1).max(2000),
  phase: z.number().int().min(0).max(6).optional(),
});

/** PUT /api/projects/:id/memory — upsert a single memory entry */
router.put("/projects/:id/memory", requireAuth, async (req, res) => {
  const ownerId = req.user!.sub;
  const projectId = req.params["id"] as string;

  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.ownerId, ownerId)))
    .limit(1);
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }

  const parsed = upsertSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid request" }); return; }

  await upsertMemory({ projectId, ownerId, ...parsed.data });
  const memories = await getProjectMemory(projectId);
  res.json({ memories });
});

/** DELETE /api/projects/:id/memory — clear all or a specific agent's memories */
router.delete("/projects/:id/memory", requireAuth, async (req, res) => {
  const ownerId = req.user!.sub;
  const projectId = req.params["id"] as string;

  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.ownerId, ownerId)))
    .limit(1);
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }

  const agent = typeof req.query["agent"] === "string" ? req.query["agent"] : undefined;
  const count = await clearMemory(projectId, agent);
  res.json({ ok: true, deleted: count });
});

/** DELETE /api/projects/:id/memory/:entryId — delete a single memory entry */
router.delete("/projects/:id/memory/:entryId", requireAuth, async (req, res) => {
  const ownerId = req.user!.sub;
  const projectId = req.params["id"] as string;
  const entryId = req.params["entryId"] as string;

  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.ownerId, ownerId)))
    .limit(1);
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }

  // Verify ownership via agentMemories table
  const [entry] = await db
    .select({ id: agentMemories.id })
    .from(agentMemories)
    .where(and(eq(agentMemories.id, entryId), eq(agentMemories.ownerId, ownerId)))
    .limit(1);
  if (!entry) { res.status(404).json({ error: "Memory entry not found" }); return; }

  await deleteMemory(entryId, projectId);
  res.json({ ok: true });
});

export default router;
