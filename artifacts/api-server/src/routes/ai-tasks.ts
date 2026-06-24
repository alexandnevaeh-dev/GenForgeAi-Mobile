import { db } from "@workspace/db";
import { aiTasks } from "@workspace/db/schema";
import { and, eq, desc } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

const createTaskSchema = z.object({
  projectId: z.string().uuid().optional(),
  agentName: z.string().min(1).max(64),
  agentPhase: z.string().max(32).default("planning"),
  taskType: z.string().min(1).max(64),
  priority: z.number().int().min(1).max(10).default(5),
  inputData: z.record(z.string(), z.unknown()).default({}),
});

router.get("/ai-tasks", requireAuth, async (req, res) => {
  const tasks = await db
    .select()
    .from(aiTasks)
    .where(eq(aiTasks.ownerId, req.user!.sub))
    .orderBy(desc(aiTasks.createdAt))
    .limit(50);

  res.json({ tasks });
});

router.post("/ai-tasks", requireAuth, async (req, res) => {
  const result = createTaskSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: "Validation failed" });
    return;
  }

  const [task] = await db
    .insert(aiTasks)
    .values({ ...result.data, ownerId: req.user!.sub, status: "pending" })
    .returning();

  res.status(201).json({ task });
});

router.get("/ai-tasks/:id", requireAuth, async (req, res) => {
  const id = req.params["id"] as string;
  const [task] = await db
    .select()
    .from(aiTasks)
    .where(and(eq(aiTasks.id, id), eq(aiTasks.ownerId, req.user!.sub)))
    .limit(1);

  if (!task) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  res.json({ task });
});

router.patch("/ai-tasks/:id/status", requireAuth, async (req, res) => {
  const id = req.params["id"] as string;
  const { status, progress, outputData, errorMessage } = req.body as {
    status?: string;
    progress?: number;
    outputData?: Record<string, unknown>;
    errorMessage?: string;
  };

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (status) {
    updateData.status = status;
    if (status === "running") updateData.startedAt = new Date();
    if (status === "completed" || status === "failed") updateData.completedAt = new Date();
  }
  if (progress !== undefined) updateData.progress = progress;
  if (outputData) updateData.outputData = outputData;
  if (errorMessage) updateData.errorMessage = errorMessage;

  const [updated] = await db
    .update(aiTasks)
    .set(updateData)
    .where(and(eq(aiTasks.id, id), eq(aiTasks.ownerId, req.user!.sub)))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Task not found" });
    return;
  }

  res.json({ task: updated });
});

export default router;
