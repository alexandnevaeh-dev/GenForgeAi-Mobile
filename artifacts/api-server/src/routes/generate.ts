import { db } from "@workspace/db";
import { projects } from "@workspace/db/schema";
import { and, eq } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import { runGeneration, type GenerateParams } from "../lib/generator";
import { enqueueJob } from "../lib/jobQueue";
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

// ── Streaming SSE endpoint (real-time, connection stays open) ──────────────
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

  try {
    await runGeneration(projectId, ownerId, parsed.data as GenerateParams, send);
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

// ── Async background endpoint (returns immediately, poll /api/jobs/:id) ─────
router.post("/projects/:id/generate-async", requireAuth, async (req, res) => {
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

  const parsed = generateSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid generation parameters" });
    return;
  }

  const jobId = await enqueueJob({
    ownerId,
    projectId,
    type: "generate",
    label: `Generate: ${project.title}`,
    inputData: {
      projectId,
      ownerId,
      params: parsed.data,
    },
  });

  res.json({ jobId, status: "pending" });
});

export default router;
