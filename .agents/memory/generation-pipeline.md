---
name: Generation pipeline split
description: The 6-phase game generation pipeline is extracted into lib/generator.ts and used by both SSE and background-job routes.
---

## Rule

`lib/generator.ts` is the single source of truth for the 6-phase pipeline (Foundation → World → Characters → Images → Balance → Packaging). Both routes call `runGeneration(projectId, ownerId, params, onEvent)`.

- `POST /api/projects/:id/generate` — SSE: passes `res.write(...)` as `onEvent`, holds the connection open.
- `POST /api/projects/:id/generate-async` — creates a DB job via `enqueueJob`, returns `{jobId}` immediately; the queue calls `runGeneration` with `updateProgress` as `onEvent`.

**Why:** Prevents drift between the two code paths. If you change the pipeline (add a phase, change prompts, fix image gen), edit only `lib/generator.ts`.

**How to apply:** If you need a third entrypoint (webhook, CLI, scheduled), import and call `runGeneration` — do not copy-paste the phase logic.
