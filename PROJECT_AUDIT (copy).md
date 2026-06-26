# GenForgeAI — Project Audit

**Date:** June 25, 2026
**Version:** 1.0.0
**Status:** Active Development

---

## Executive Summary

GenForgeAI is a mobile-first AI game development studio that lets users describe a game in natural language and receive a fully structured game design document, asset manifest, and engine-ready export package. The platform uses a 23-agent AI pipeline routed through a task-aware model router that selects the best free model for each generation phase.

---

## What Exists

### Infrastructure

| Layer | Technology | Status |
|-------|-----------|--------|
| Mobile App | Expo Router v6 + React Native | Running |
| API Server | Express 5 + Node.js 24 | Running |
| Database | PostgreSQL + Drizzle ORM | Live |
| AI Layer | OpenAI + OpenRouter (free-tier) | Live |
| Monorepo | pnpm workspaces | Healthy |
| Auth | JWT (access + refresh tokens) | Working |

### Services Running

- `artifacts/api-server` — Port 8080, proxied at `/api`
- `artifacts/mobile` — Expo Metro, proxied at `/`
- `artifacts/mockup-sandbox` — Vite dev server at `/__mockup`

---

## Completed Features

### Authentication
- Email/password registration and login
- JWT access tokens (short-lived) + refresh tokens (30-day, database-stored)
- Token revocation on logout
- Guest mode (full UI access, local storage only)
- Session persistence via AsyncStorage

### Project Management
- Full CRUD for game projects via REST API
- Real PostgreSQL persistence for authenticated users
- AsyncStorage fallback for guest users
- Project status lifecycle: `planning → generating → in_progress → complete → exported`
- Project detail screen with 9 tabs: Overview, Blueprint, Tasks, Systems, Assets, Export, Quality, Agents, Memory

### AI Generation Pipeline
- 6-phase generation with real-time SSE progress streaming
- Phase 1: Foundation (game design concepts)
- Phase 2: World & Story (lore, narrative, factions)
- Phase 3: Characters & Content (NPCs, enemies, quests)
- Phase 4: Asset Manifest (sprites, audio, VFX)
- Phase 5: Combat & Balance (stat systems, economy)
- Phase 6: Packaging (export configs, build metadata)
- Each phase writes its output to dedicated DB columns

### AI Router
- Task-aware routing to 8+ specialized free OpenRouter models
- Automatic fallback chains per task type (4–5 models each)
- Retry with exponential backoff on rate-limit / overload
- `openrouter/free` as last-resort catch-all
- Streaming support via `streamTask()`, batch via `routeTask()`

### AI Chat
- SSE streaming chat with Master Game Director persona
- Routed through `chat` task type (Llama 3.3 70B primary)
- Conversation persisted to AsyncStorage
- Works for both authenticated and guest users

### Mobile UI
- Dark theme throughout (`#0A0A0F` background)
- 5-tab navigation: Home, AI Chat, Projects, Assets, Profile
- New Game wizard (6 steps): Prompt → Genre → Art Style → Parameters → Analysis → Blueprint
- Agent network visualization (23 agents, 6 phases)
- Real-time progress indicators with phase labels
- Task graph with dependency visualization
- Quality gates panel (8 gates)
- Export framework panel
- Blueprint panel
- Procedural systems panel
- GenLogic panel

---

## What Is Not Yet Built

| Feature | Priority | Notes |
|---------|----------|-------|
| Real asset generation (images) | High | Asset manifest exists; actual sprite generation not wired |
| Audio generation | High | Manifest exists; no actual audio output |
| Community tab | Medium | Screen exists, no backend |
| Marketplace tab | Medium | Screen exists, no backend |
| Export Center | Medium | Screen exists, UI only |
| Push notifications | Low | Schema exists, no delivery |
| Subscription billing | Low | Schema exists, no payment integration |
| User profile editing | Low | Screen exists, PATCH endpoint not wired |
| AI task queue system | Low | Table exists, no worker |
| Public project sharing | Low | `isPublic` field exists, no public endpoint |

---

## Code Health

| Check | Result |
|-------|--------|
| TypeScript (libs) | Clean |
| TypeScript (api-server) | Clean |
| TypeScript (mobile) | Clean |
| API server build (esbuild) | Clean |
| Runtime errors | None observed |

---

## Security

- Passwords hashed with bcrypt (cost factor 12)
- JWT signing uses `SESSION_SECRET` env var
- Refresh tokens stored in DB, revocable
- All project routes require authentication and enforce owner isolation (`ownerId` filter on every query)
- CORS enabled
- Passwords never returned in API responses (`passwordHash` stripped)
- No API keys exposed to the mobile client; all AI calls go through the server

---

## Environment Variables Required

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection string |
| `SESSION_SECRET` | JWT signing secret |
| `AI_INTEGRATIONS_OPENAI_BASE_URL` | Replit OpenAI proxy |
| `AI_INTEGRATIONS_OPENAI_API_KEY` | Replit OpenAI key |
| `AI_INTEGRATIONS_OPENROUTER_BASE_URL` | Replit OpenRouter proxy |
| `AI_INTEGRATIONS_OPENROUTER_API_KEY` | Replit OpenRouter key |

---

## Immediate Next Steps (Recommended Priority)

1. Wire real image generation into the asset pipeline (OpenAI gpt-image-1 via existing `generateImageBuffer`)
2. Complete the Export Center with downloadable project archives
3. Build Community feed backend (posts, likes, project showcases)
4. Add user profile PATCH endpoint and wire it to the Profile screen
5. Implement AI task queue worker using the `aiTasks` table
