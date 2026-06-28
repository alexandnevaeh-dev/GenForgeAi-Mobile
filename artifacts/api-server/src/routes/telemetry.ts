import { db } from "@workspace/db";
import { aiTasks, assets, projects } from "@workspace/db/schema";
import { and, count, eq, isNotNull } from "drizzle-orm";
import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

/* ── GET /api/telemetry ───────────────────────────────────────
 * Real generation telemetry aggregated from the ai_tasks rows that the
 * generation pipeline records per phase, plus the caller's project/asset
 * counts. Returns hasData=false (and zeroed metrics) until the user has
 * actually run a generation — no fabricated numbers.
 */
router.get("/telemetry", requireAuth, async (req, res) => {
  const ownerId = req.user!.sub;

  const tasks = await db
    .select({
      agentName: aiTasks.agentName,
      taskType: aiTasks.taskType,
      status: aiTasks.status,
      executionTimeMs: aiTasks.executionTimeMs,
    })
    .from(aiTasks)
    .where(eq(aiTasks.ownerId, ownerId));

  const [{ c: projectCount }] = await db
    .select({ c: count() })
    .from(projects)
    .where(eq(projects.ownerId, ownerId));

  const [{ c: assetCount }] = await db
    .select({ c: count() })
    .from(assets)
    .where(eq(assets.ownerId, ownerId));

  const [{ c: generationCount }] = await db
    .select({ c: count() })
    .from(projects)
    .where(and(eq(projects.ownerId, ownerId), isNotNull(projects.lastGeneratedAt)));

  const totalTasks = tasks.length;
  const completed = tasks.filter((t) => t.status === "completed").length;
  const failed = tasks.filter((t) => t.status === "failed").length;
  const timed = tasks.filter((t) => typeof t.executionTimeMs === "number");
  const avgGenTimeMs = timed.length
    ? Math.round(timed.reduce((s, t) => s + (t.executionTimeMs ?? 0), 0) / timed.length)
    : 0;
  const successRate = totalTasks ? Math.round((completed / totalTasks) * 1000) / 10 : 0;
  const failureRate = totalTasks ? Math.round((failed / totalTasks) * 1000) / 10 : 0;

  // Per-agent aggregation
  const agentMap = new Map<
    string,
    { taskType: string; runs: number; totalMs: number; timedRuns: number; completed: number }
  >();
  for (const t of tasks) {
    const cur =
      agentMap.get(t.agentName) ??
      { taskType: t.taskType, runs: 0, totalMs: 0, timedRuns: 0, completed: 0 };
    cur.runs += 1;
    if (typeof t.executionTimeMs === "number") {
      cur.totalMs += t.executionTimeMs;
      cur.timedRuns += 1;
    }
    if (t.status === "completed") cur.completed += 1;
    agentMap.set(t.agentName, cur);
  }
  const agents = [...agentMap.entries()]
    .map(([agentName, v]) => ({
      agentName,
      taskType: v.taskType,
      runs: v.runs,
      avgMs: v.timedRuns ? Math.round(v.totalMs / v.timedRuns) : 0,
      successRate: v.runs ? Math.round((v.completed / v.runs) * 100) : 0,
    }))
    .sort((a, b) => b.runs - a.runs);

  // Per task-type usage share
  const typeMap = new Map<string, number>();
  for (const t of tasks) typeMap.set(t.taskType, (typeMap.get(t.taskType) ?? 0) + 1);
  const taskTypes = [...typeMap.entries()]
    .map(([taskType, runs]) => ({
      taskType,
      runs,
      share: totalTasks ? Math.round((runs / totalTasks) * 100) : 0,
    }))
    .sort((a, b) => b.runs - a.runs);

  res.json({
    hasData: totalTasks > 0,
    metrics: {
      totalGenerations: generationCount,
      totalTasks,
      avgGenTimeMs,
      successRate,
      failureRate,
      totalProjects: projectCount,
      totalAssets: assetCount,
    },
    agents,
    taskTypes,
  });
});

export default router;
