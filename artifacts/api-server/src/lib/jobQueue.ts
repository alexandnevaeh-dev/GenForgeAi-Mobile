/**
 * In-process background job queue.
 *
 * Jobs are persisted to PostgreSQL via the `jobs` table so progress survives
 * server restarts (in-flight jobs are re-marked as "failed" on startup).
 * A simple in-memory queue drives execution with a configurable concurrency
 * limit — no external broker required.
 */

import { db } from "@workspace/db";
import { jobs } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { logger } from "./logger";

export type JobStatus = "pending" | "running" | "completed" | "failed" | "cancelled";

export interface JobProgress {
  phase: number;
  progress: number;
  label: string;
}

export type JobHandler = (
  jobId: string,
  inputData: Record<string, unknown>,
  updateProgress: (p: JobProgress) => Promise<void>
) => Promise<Record<string, unknown>>;

const CONCURRENCY = 2;
const handlers = new Map<string, JobHandler>();
const queue: string[] = [];       // jobIds waiting to run
let running = 0;

/** Register a handler for a given job type. */
export function registerHandler(type: string, handler: JobHandler): void {
  handlers.set(type, handler);
}

/** Persist a progress update to the DB (best-effort). */
async function persistProgress(jobId: string, p: JobProgress): Promise<void> {
  try {
    await db
      .update(jobs)
      .set({ phase: p.phase, progress: p.progress, label: p.label, updatedAt: new Date() })
      .where(eq(jobs.id, jobId));
  } catch {
    // non-fatal
  }
}

async function runNext(): Promise<void> {
  if (running >= CONCURRENCY || queue.length === 0) return;

  const jobId = queue.shift()!;
  running++;

  // load job from DB
  const [job] = await db.select().from(jobs).where(eq(jobs.id, jobId)).limit(1);
  if (!job || job.status === "cancelled") {
    running--;
    void runNext();
    return;
  }

  const handler = handlers.get(job.type);
  if (!handler) {
    await db
      .update(jobs)
      .set({ status: "failed", error: `No handler registered for type: ${job.type}`, updatedAt: new Date() })
      .where(eq(jobs.id, jobId));
    running--;
    void runNext();
    return;
  }

  await db
    .update(jobs)
    .set({ status: "running", startedAt: new Date(), updatedAt: new Date() })
    .where(eq(jobs.id, jobId));

  logger.info({ jobId, type: job.type }, "Job started");

  try {
    const result = await handler(
      jobId,
      (job.inputData ?? {}) as Record<string, unknown>,
      (p) => persistProgress(jobId, p)
    );

    await db
      .update(jobs)
      .set({
        status: "completed",
        progress: 100,
        phase: 6,
        label: "Complete",
        result,
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(jobs.id, jobId));

    logger.info({ jobId }, "Job completed");
  } catch (err) {
    const error = err instanceof Error ? err.message : String(err);
    logger.error({ jobId, error }, "Job failed");
    await db
      .update(jobs)
      .set({
        status: "failed",
        error,
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(jobs.id, jobId));
  } finally {
    running--;
    void runNext();
  }
}

/** Enqueue a new job and return its DB id. */
export async function enqueueJob(opts: {
  ownerId: string;
  projectId?: string;
  type: string;
  label?: string;
  inputData?: Record<string, unknown>;
}): Promise<string> {
  const [job] = await db
    .insert(jobs)
    .values({
      ownerId: opts.ownerId,
      projectId: opts.projectId ?? null,
      type: opts.type,
      status: "pending",
      label: opts.label ?? opts.type,
      inputData: opts.inputData ?? {},
    })
    .returning();

  queue.push(job.id);
  // Kick the queue on next tick so the HTTP response can return first
  setImmediate(() => void runNext());

  return job.id;
}

/** Cancel a queued or running job (best-effort). */
export async function cancelJob(jobId: string): Promise<void> {
  // Remove from queue if still waiting
  const idx = queue.indexOf(jobId);
  if (idx !== -1) queue.splice(idx, 1);

  await db
    .update(jobs)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(eq(jobs.id, jobId));
}

/**
 * On server startup: mark any jobs that were `running` as `failed`
 * (they died when the process restarted).
 */
export async function recoverStalledJobs(): Promise<void> {
  try {
    const stalled = await db
      .update(jobs)
      .set({ status: "failed", error: "Server restarted", updatedAt: new Date() })
      .where(eq(jobs.status, "running"))
      .returning();
    if (stalled.length > 0) {
      logger.warn({ count: stalled.length }, "Marked stalled jobs as failed");
    }
  } catch {
    // non-fatal — DB may not be ready yet
  }
}
