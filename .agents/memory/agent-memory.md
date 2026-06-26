---
name: Agent memory system
description: Per-project, per-agent persistent memory — written after each generation phase, read at the start of the next run.
---

## Architecture

- **DB table**: `agent_memories` — columns: id, projectId, ownerId, agent, key, value, phase, createdAt, updatedAt.
- **Library**: `artifacts/api-server/src/lib/agentMemory.ts` — exports `getProjectMemory`, `upsertMemory`, `writeMemories`, `deleteMemory`, `clearMemory`, `buildMemoryContext`.
- **Routes**: `artifacts/api-server/src/routes/memory.ts` — mounted in routes/index.ts.
  - `GET /api/projects/:id/memory` — all entries
  - `PUT /api/projects/:id/memory` — upsert one entry `{agent, key, value, phase?}`
  - `DELETE /api/projects/:id/memory` — clear all (or `?agent=X` for one agent)
  - `DELETE /api/projects/:id/memory/:entryId` — delete one entry
- **Generator integration**: `lib/generator.ts` calls `getProjectMemory` before phase 1, injects via `buildMemoryContext` into all prompts, and calls `writeMemories` (void, non-blocking) after phases 1–5.
- **Mobile**: `ProjectMemoryPanel` component fetches from the API; shows entries grouped by agent with individual and bulk delete.

## What each agent writes

| Phase | Agent | Keys written |
|-------|-------|--------------|
| 1 | Foundation Agent | Tone, Setting, Core Loop, Unique Mechanic, Tagline |
| 2 | World Architect | World Name, Theme, Lore Summary (truncated), Opening Hook |
| 3 | Character Designer | Protagonist Name, Protagonist Backstory (truncated), Main Boss, Quest Count, Enemy Types |
| 4 | Image Generator | Protagonist Visual, Boss Visual, World Visual, Images Generated, Art Style Used |
| 5 | Balance Agent | Combat System, Enemy Scaling, Currency, Balance Notes (truncated) |

**Why:** `writeMemories` is called with `void` so it does not block the generation pipeline — it fires-and-forgets. A failure to write memory does not fail the generation.

**How to apply:** To add a new agent or phase, call `writeMemories(projectId, ownerId, phase, "Agent Name", { key: value })` after the relevant pipeline step. Keep values under 200 chars for context efficiency.
