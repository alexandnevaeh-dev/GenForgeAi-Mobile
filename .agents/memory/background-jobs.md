---
name: Background job system
description: In-process async job queue with PostgreSQL persistence — no Redis required.
---

## Architecture

- `lib/db/src/schema/index.ts` — `jobs` table: id, ownerId, projectId, type, status, phase, progress, label, inputData, result, error, startedAt, completedAt.
- `artifacts/api-server/src/lib/jobQueue.ts` — in-memory queue (array), max 2 concurrent, DB-persisted status. Exports: `registerHandler`, `enqueueJob`, `cancelJob`, `recoverStalledJobs`.
- Handler registration and `recoverStalledJobs()` live in `app.ts` (not index.ts) so they run at module load time before any request.
- `routes/jobs.ts` — GET /api/jobs, GET /api/jobs/:id, DELETE /api/jobs/:id.

## Why app.ts for registration

Handlers must be registered before any job could theoretically dequeue. `app.ts` is imported by `index.ts`, so importing `app` ensures handlers are set before the server binds a port.

## How to apply

- To add a new job type: call `registerHandler("type", handler)` in `app.ts`.
- To enqueue: `await enqueueJob({ ownerId, projectId, type, label, inputData })` — returns jobId.
- On server startup, `recoverStalledJobs()` marks any `status = "running"` rows as `failed` (they died mid-run).
