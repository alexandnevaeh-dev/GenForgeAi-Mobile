---
name: API route prefix convention
description: Why route files must not include /api/, and the 404 symptom when they do
---

# API route prefix: never include `/api/` in route files

The aggregate router is mounted with `app.use("/api", router)` in `app.ts`. Therefore
every sub-route file must register paths WITHOUT a leading `/api` — e.g.
`router.post("/projects/:id/qa/run", ...)`, not `router.post("/api/projects/:id/qa/run", ...)`.

**Symptom when violated:** the route resolves to `/api/api/...` and is unreachable —
requests return **404** ("Cannot POST/GET ..."), not 401. A quick discriminator: a
reachable protected route returns **401** (auth required); a misprefixed one returns **404**.

**Why:** a batch of routes in publish/orchestrator/qa shipped with the `/api/` prefix
baked in and were silently dead until smoke-tested. Mobile callers always use the full
`/api/...` path (the app-wide convention; see below), so the server side is the only place
this can go wrong.

**How to apply:** when adding/auditing server routes, grep for
`router.(get|post|put|delete|patch)\(['"]\/api\/` — it should return zero matches.
Smoke-test new project-scoped routes expecting 401, not 404.

## Mobile fetch convention (related)
Every fetch in `artifacts/mobile` uses a RELATIVE `/api/...` URL (AuthContext defines
`API_BASE = "/api"`). This is correct for the web/proxy deployment target. A native Expo
build would need an absolute base URL (`EXPO_PUBLIC_API_URL`), but that applies app-wide,
not to any single screen — don't "fix" one screen to use an absolute URL in isolation.
