---
name: Marketplace & Templates
description: How templates are stored, seeded, served, and used to create projects with one tap.
---

## Rule
Templates are seeded once at server startup via `seedTemplates()` in `app.ts`. The function is idempotent — it counts existing rows and exits early if any exist.

**Why:** Avoids a separate migration step while keeping reference data consistent across restarts.

## How to apply
- Add new templates by extending the `SEED_TEMPLATES` array in `lib/seedTemplates.ts` and clearing the table once (or run `pnpm --filter @workspace/db run push` + manually delete rows).
- `GET /api/templates` is public — no auth required for browsing. Supports `?category=`, `?genre=`, `?search=` query params.
- `POST /api/templates/:id/use` requires auth. Creates a project from `tpl.promptHint` (or `customPrompt` from body), then enqueues a `generate` job using `enqueueJob()`. Increments `usageCount`.
- `jobQueue` module exports `enqueueJob` (not `jobQueue` object) — always use `enqueueJob({ ownerId, projectId, type, label, inputData })`.
- `rating` is stored as an integer 0–50 (e.g. 4.9 → 49). Display as `(rating / 10).toFixed(1)`.

## Mobile
- `app/marketplace.tsx` — real API fetch on mount + on filter/search change; featured banner = first template with badge "HOT"; template detail bottom sheet modal with stats, tags, customizable prompt, "Use Template" CTA.
- "Use Template" → POST /api/templates/:id/use → navigate to `/project/:id`.
- Screen is a stack route (accessible from home, drawer, quick actions) — not a tab.
