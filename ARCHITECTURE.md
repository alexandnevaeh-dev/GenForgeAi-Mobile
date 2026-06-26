# GenForgeAI — Architecture

---

## System Overview

```
┌──────────────────────────────────────────────────────┐
│                    User Device                        │
│            Expo / React Native (Mobile)               │
│  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │
│  │  Auth   │ │  Chat    │ │ Projects │ │  Assets  │ │
│  │ Context │ │ Context  │ │ Context  │ │   Tab    │ │
│  └────┬────┘ └────┬─────┘ └────┬─────┘ └──────────┘ │
└───────┼───────────┼────────────┼─────────────────────┘
        │           │            │
        ▼           ▼            ▼
┌──────────────────────────────────────────────────────┐
│              Replit Shared Proxy (port 80)            │
│              Path-based routing: /api → 8080          │
└──────────────────────────┬───────────────────────────┘
                           │
                           ▼
┌──────────────────────────────────────────────────────┐
│              API Server (Express 5, port 8080)        │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐ │
│  │  /auth   │ │/projects │ │  /chat   │ │/generate│ │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬────┘ │
│       │            │            │             │      │
│  ┌────▼────────────▼────────────▼─────────────▼────┐ │
│  │           AI Router (lib/ai-router)              │ │
│  │   Task type → Model priority chain → Fallback   │ │
│  └────────────────────┬─────────────────────────────┘ │
└───────────────────────┼──────────────────────────────┘
                        │
             ┌──────────┴──────────┐
             ▼                     ▼
   ┌──────────────────┐  ┌──────────────────┐
   │  Replit OpenAI   │  │ Replit OpenRouter │
   │  Proxy (gpt-5)   │  │  Proxy (free     │
   │  [image gen]     │  │   OSS models)    │
   └──────────────────┘  └──────────────────┘
             │
             ▼
   ┌──────────────────┐
   │   PostgreSQL DB  │
   │  (Drizzle ORM)   │
   └──────────────────┘
```

---

## Monorepo Structure

```
workspace/
├── artifacts/
│   ├── api-server/          # Express 5 API (port 8080)
│   │   ├── src/
│   │   │   ├── app.ts       # Express app setup
│   │   │   ├── index.ts     # Server entry point
│   │   │   ├── lib/
│   │   │   │   ├── jwt.ts   # Access + refresh token signing
│   │   │   │   └── logger.ts
│   │   │   ├── middleware/
│   │   │   │   └── requireAuth.ts  # JWT validation middleware
│   │   │   └── routes/
│   │   │       ├── auth.ts          # Register/login/refresh/logout
│   │   │       ├── users.ts         # User profile
│   │   │       ├── projects.ts      # Project CRUD
│   │   │       ├── generate.ts      # 6-phase AI generation (SSE)
│   │   │       ├── chat.ts          # Chat proxy (SSE)
│   │   │       ├── ai-tasks.ts      # AI task management
│   │   │       ├── health.ts        # Health check
│   │   │       └── index.ts         # Route aggregator
│   │   └── build.mjs        # esbuild bundler config
│   │
│   └── mobile/              # Expo Router v6 app
│       ├── app/
│       │   ├── (tabs)/      # Bottom tab navigator
│       │   │   ├── index.tsx       # Home dashboard
│       │   │   ├── chat.tsx        # AI Chat screen
│       │   │   ├── projects.tsx    # Projects list
│       │   │   ├── assets.tsx      # Asset browser
│       │   │   └── profile.tsx     # User profile
│       │   ├── auth/
│       │   │   ├── login.tsx
│       │   │   └── register.tsx
│       │   ├── project/
│       │   │   └── [id].tsx        # Project detail (9 tabs)
│       │   ├── new-game.tsx         # Game creation wizard
│       │   ├── community.tsx
│       │   ├── marketplace.tsx
│       │   └── export-center.tsx
│       ├── components/      # Shared UI components
│       ├── context/         # React contexts
│       │   ├── AuthContext.tsx
│       │   ├── ProjectsContext.tsx
│       │   └── ChatContext.tsx
│       └── constants/       # Static data & pipeline logic
│
└── lib/
    ├── ai-router/           # Task-aware AI model router
    ├── api-spec/            # OpenAPI spec + Orval codegen
    ├── api-client-react/    # Generated React Query hooks
    ├── api-zod/             # Generated Zod schemas
    ├── db/                  # Drizzle schema + migrations
    ├── integrations-openai-ai-server/   # OpenAI SDK wrapper
    ├── integrations-openai-ai-react/    # React audio hooks
    └── integrations-openrouter-ai/      # OpenRouter SDK wrapper
```

---

## AI Router

The AI Router (`lib/ai-router`) is a central dispatch layer between API routes and AI providers. It selects the best available model for each task type and automatically fails over to the next model in the chain.

### Task Types

| Task | Best Model | Description |
|------|-----------|-------------|
| `foundation` | `nvidia/nemotron-3-ultra-550b:free` | Game concept, core mechanics |
| `story` | `nousresearch/hermes-3-llama-3.1-405b:free` | World, lore, narrative |
| `characters` | `meta-llama/llama-3.3-70b:free` | NPCs, dialogue, quests |
| `assets` | `qwen/qwen3-next-80b:free` | Sprites, audio, VFX manifests |
| `balance` | `nvidia/nemotron-3-nano-omni-reasoning:free` | Stats, economy, difficulty |
| `coding` | `qwen/qwen3-coder:free` | Scripts, shaders, game logic |
| `chat` | `meta-llama/llama-3.3-70b:free` | Conversational game advisor |
| `packaging` | `openai/gpt-oss-20b:free` | Export configs, formatting |

### Fallback Behavior

Every chain has 4–5 models. On any rate-limit, overload (503/529), or timeout error, the router waits `retryDelayMs * attemptCount` milliseconds and tries the next model. `openrouter/free` (OpenRouter's automatic free-model selector) is always the last resort.

### API

```typescript
// Non-streaming — returns full text response
const result = await routeTask("foundation", messages);
// result.content, result.model, result.attemptCount

// Streaming — calls onChunk for each token
await streamTask("chat", messages, (event) => {
  if (event.content) res.write(`data: ${JSON.stringify(event)}\n\n`);
});
```

---

## Authentication Flow

```
Register/Login
     ↓
API issues accessToken (JWT, 15min) + refreshToken (JWT, 30d)
     ↓
refreshToken stored in DB (refresh_tokens table)
     ↓
Mobile stores both in AsyncStorage
     ↓
Each request: Authorization: Bearer <accessToken>
     ↓
requireAuth middleware validates JWT, attaches req.user
     ↓
Token expired? → POST /auth/refresh with refreshToken
     ↓
Logout: refreshToken revoked in DB (revokedAt set)
```

---

## Generation Pipeline (SSE)

```
POST /api/projects/:id/generate
         │
         ├── Phase 1 (foundation model)
         │   → SSE: phase_start / phase_model / phase_complete
         │   → DB: projects.storyData updated
         │
         ├── Phase 2 (story model)
         │   → DB: projects.worldData updated
         │
         ├── Phase 3 (characters model)
         │   → DB: projects.characterData updated
         │
         ├── Phase 4 (assets model)
         │   → DB: projects.assetManifest updated
         │
         ├── Phase 5 (balance model)
         │   → DB: projects.combatData updated
         │
         └── Phase 6 (packaging)
             → DB: projects.exportConfigs, status="in_progress", progress=100
             → SSE: done event
```

---

## Data Flow: Guest vs Authenticated

```
                    ┌── isGuest? ──┐
                    │              │
                  YES              NO
                    │              │
             AsyncStorage     PostgreSQL
             (local only)     via /api/*
                    │              │
              No AI gen       Real AI gen
              (simulation)   (SSE + OpenRouter)
```

---

## Key Design Decisions

1. **No direct AI calls from the mobile client.** All model access goes through the API server. This protects credentials and centralizes rate limiting.

2. **Workspace libs export `./src/index.ts` (TypeScript source), not compiled `./dist/`.** esbuild reads and bundles TypeScript directly at build time. Compiled declarations in `dist/` are only for TypeScript project reference type checking.

3. **Server-side SSE for generation.** The mobile app opens a single long-lived fetch connection. The server drives phase progression, writes to the database at each phase, and sends events as it goes. If the connection drops, progress is still persisted in the database.

4. **JWT is signed with `SESSION_SECRET`** (not a per-user key), so tokens are not verifiable by third parties. Refresh tokens are DB-stored and revocable.

5. **Drizzle schema is the source of truth.** All types are inferred from the schema (`typeof table.$inferSelect`). No separate TypeScript interface files for DB models.
