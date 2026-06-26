import { db } from "@workspace/db";
import { jobs } from "@workspace/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { Router } from "express";
import { cancelJob } from "../lib/jobQueue";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

/** GET /api/jobs — list the caller's recent jobs */
router.get("/jobs", requireAuth, async (req, res) => {
  const ownerId = req.user!.sub;
  const limit = Math.min(Number(req.query["limit"] ?? 20), 100);

  const rows = await db
    .select()
    .from(jobs)
    .where(eq(jobs.ownerId, ownerId))
    .orderBy(desc(jobs.createdAt))
    .limit(limit);

  res.json({ jobs: rows });
});

/** GET /api/jobs/:id — poll a single job */
router.get("/jobs/:id", requireAuth, async (req, res) => {
  const ownerId = req.user!.sub;
  const [job] = await db
    .select()
    .from(jobs)
    .where(and(eq(jobs.id, req.params["id"] as string), eq(jobs.ownerId, ownerId)))
    .limit(1);

  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }
  res.json({ job });
});

/** DELETE /api/jobs/:id — cancel a job */
router.delete("/jobs/:id", requireAuth, async (req, res) => {
  const ownerId = req.user!.sub;
  const [job] = await db
    .select()
    .from(jobs)
    .where(and(eq(jobs.id, req.params["id"] as string), eq(jobs.ownerId, ownerId)))
    .limit(1);

  if (!job) {
    res.status(404).json({ error: "Job not found" });
    return;
  }
  if (job.status === "completed" || job.status === "failed") {
    res.status(400).json({ error: `Job is already ${job.status}` });
    return;
  }

  await cancelJob(job.id);
  res.json({ ok: true });
});

export default router;
