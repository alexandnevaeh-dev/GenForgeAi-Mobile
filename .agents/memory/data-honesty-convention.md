---
name: Data honesty convention (no fabricated data)
description: This app must never fabricate/simulate data for authenticated users — use honest empty/error/unpublished states instead.
---

# Data honesty convention ("Option A")

Across GenForgeAI Mobile + its API, **never return fabricated, simulated, or
`Math.random()`-based data to authenticated users.** When a real data source is
empty or a backend/AI call fails, surface an honest state instead:

- Empty: `hasData:false` + zeroed metrics, or an explicit "nothing yet" UI.
- Failure: non-2xx (e.g. 502) JSON `{ error }` from the server; the client shows
  an error/retry UI. Do **not** swallow the failure and return plausible-looking
  numbers.
- Unpublished/unconnected: explain the precondition (e.g. store analytics only
  exist once published + an analytics provider is connected).

**Why:** Architect-approved product standard for this project. Fabricated
fallbacks (fake QA reports, fake telemetry, fake store analytics, fake balance/
playtest payloads) silently mislead users into thinking real analysis ran.

**How to apply:**
- Guest-only simulation is acceptable **only** when `isGuest` (no token /
  `user.id === 'guest'`); never as a fallback for authed users.
- Server route `catch` blocks should `req.log.error(...)` then return a 4xx/5xx
  with an honest message — never `res.json(fabricatedPayload)`.
- Before adding any fallback payload, confirm the consumer already handles
  `!res.ok` (shows an error banner) so honest errors don't break the happy path.
- Replace any `Math.random()` in product logic with deterministic values derived
  from real inputs.
