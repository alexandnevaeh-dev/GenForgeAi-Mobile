---
name: GenForgeAI assets API client pattern
description: How the mobile app talks to asset endpoints
---

The GenForgeAI mobile app calls asset endpoints with raw `fetch`, not the OpenAPI/Orval codegen hooks used elsewhere in the monorepo.

**Pattern:** `const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "/api";` then `fetch(\`${BASE_URL}/assets/...\`, { headers: { Authorization: \`Bearer ${accessToken}\` } })` with `accessToken` from `useAuth()`.

**How to apply:** When adding new asset features (mobile or server), follow this manual fetch + Bearer pattern and the existing Express route style in `artifacts/api-server/src/routes/assets.ts`. Do NOT introduce codegen hooks for assets — it would be inconsistent with the established convention the user approved.
