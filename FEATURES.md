# GenForgeAI — Features

GenForgeAI is an AI-powered game development studio that runs on mobile. Users describe a game idea and the platform builds a complete game design document, asset manifest, and export-ready package using a multi-agent AI pipeline.

---

## Core Concept

```
"Make me a dark fantasy roguelike where you collect souls"
              ↓
        23 AI Agents
              ↓
   World · Story · Characters
   Combat · Balance · Assets
              ↓
  Structured game project ready
  for Godot 4.x / HTML5 / Android
```

---

## Feature Index

1. [User Accounts](#1-user-accounts)
2. [Guest Mode](#2-guest-mode)
3. [Home Dashboard](#3-home-dashboard)
4. [AI Chat — Master Game Director](#4-ai-chat--master-game-director)
5. [New Game Wizard](#5-new-game-wizard)
6. [AI Generation Pipeline](#6-ai-generation-pipeline)
7. [Agent Network](#7-agent-network)
8. [Project Detail — 9 Tabs](#8-project-detail--9-tabs)
9. [Quality Gates](#9-quality-gates)
10. [Export Framework](#10-export-framework)
11. [Asset Browser](#11-asset-browser)
12. [AI Router](#12-ai-router)

---

## 1. User Accounts

**Registration** requires email, username (3–32 alphanumeric), display name, and password (8+ chars). **Login** issues a short-lived access token and a 30-day refresh token. Tokens are stored in AsyncStorage on the device and sent as Bearer headers on every API request.

**Profile fields:** avatar, bio, subscription tier, AI credits used/limit, total projects, total generations.

Session restores automatically on app launch. Refresh tokens are revocable server-side on logout.

---

## 2. Guest Mode

Users can skip login entirely with "Continue as Guest." Guest mode provides:

- Full access to the New Game wizard and project creation UI
- Local project storage (AsyncStorage, not synced to server)
- Simulated AI generation (animated progress, no real AI calls)
- Full access to the chat UI (AI chat still works in guest mode — it routes through the server which allows unauthenticated chat requests)

Guest projects are not persisted server-side and will be lost if AsyncStorage is cleared.

---

## 3. Home Dashboard

The home screen (`app/(tabs)/index.tsx`) provides:

- **Quick Actions:** Create Game, AI Studio, Projects, Assets, Marketplace
- **AI Activity panel:** Shows recent agent completions and active agent count
- **Trending Templates:** Curated starter projects (Dark Fantasy Starter, Cyberpunk Runner, Cozy Farm Sim, etc.) with genre tags and pricing
- **Recent Projects:** Live list of the user's last-modified projects with status badges and progress bars

---

## 4. AI Chat — Master Game Director

The chat tab (`app/(tabs)/chat.tsx`) connects to a streaming AI advisor with a game development persona.

**Capabilities:**
- Understands and refines game concepts through conversation
- Recommends genres, art styles, mechanics, and features
- Breaks ideas into concrete game systems (story, combat, levels, audio)
- Inspires and elaborates on any game idea

**Technical:** All messages stream token-by-token via SSE from `/api/chat`. The server routes through `meta-llama/llama-3.3-70b-instruct:free` as the primary model with automatic fallback. Conversation history (up to 50 messages) is included in each request for context. Chat history persists locally across sessions.

---

## 5. New Game Wizard

A 6-step wizard (`app/new-game.tsx`) that collects all parameters needed to generate a game project.

| Step | What it collects |
|------|-----------------|
| 1 — Prompt | Free-text game description (up to 500 chars) with example prompts |
| 2 — Genre | 10 genres: RPG, Action, Platformer, Strategy, Puzzle, Horror, Adventure, Simulation, Fighting, Shooter |
| 3 — Art Style | 7 styles: Pixel Art, Low Poly, Realistic, Cartoon, Isometric, Voxel, Anime |
| 4 — Parameters | Difficulty, game length, world size, boss count, multiplayer, narrative focus, replayability, platforms, export target, perspective |
| 5 — Prompt Analysis | Real-time analysis of the prompt: genre signals, themes, tone, setting, core loop, art direction, audio direction, risks |
| 6 — Blueprint Review | Full project blueprint with vision statement, design pillars, world outline, story outline, gameplay systems, asset requirements, milestones |

After the blueprint is reviewed, tapping "Launch AI Agents" creates the project via the API (authenticated) or locally (guest) and begins the generation pipeline.

**Generation modes:**
- **Guided** — AI asks questions at each major decision
- **Assisted** — AI recommends, user retains control
- **Autonomous** — AI completes the full project automatically

---

## 6. AI Generation Pipeline

When generation starts, the app connects to `POST /api/projects/:id/generate` (SSE stream). The server runs 6 sequential phases, each using a different specialized AI model:

| Phase | Label | AI Task Type | Primary Model |
|-------|-------|-------------|---------------|
| 1 | Foundation | `foundation` | nemotron-3-ultra-550b:free |
| 2 | World & Story | `story` | hermes-3-llama-3.1-405b:free |
| 3 | Characters & Content | `characters` | llama-3.3-70b:free |
| 4 | Asset Generation | `assets` | qwen3-next-80b:free |
| 5 | QA & Balance | `balance` | nemotron-3-nano-omni-reasoning:free |
| 6 | Packaging & Export | `packaging` | gpt-oss-20b:free |

Each phase streams SSE events: `phase_start`, `phase_model` (which model was chosen), and `phase_complete`. The mobile app updates the agent network visualization, task graph, and progress bar in real time. Each phase's output is written to the database immediately — if the connection drops, progress is preserved.

Guest users see an animated simulation (no real AI calls) that runs locally using `setTimeout`.

---

## 7. Agent Network

The agent network (`components/AgentNetwork.tsx`) visualizes 23 specialized AI agents organized into 6 phases. Each agent shows live status: idle, active (pulsing), or done.

| Phase | Agents |
|-------|--------|
| 1 — Foundation | World Architect, Story Architect, Character Designer |
| 2 — Gameplay Systems | Enemy Designer, Boss Designer, Combat Designer, Ability Designer |
| 3 — Content Generation | Quest Designer, Environment Designer, Dungeon Designer, Puzzle Designer, Platforming Designer |
| 4 — Economy & Progression | Progression Designer, Economy Designer, Loot Designer, Crafting Designer |
| 5 — Asset Generation | Pixel Art Designer, Animation Designer, UI Designer, Audio Composer, Sound Designer |
| 6 — QA & Export | QA Agent, Performance Optimizer, Documentation Agent |

---

## 8. Project Detail — 9 Tabs

The project detail screen (`app/project/[id].tsx`) shows everything generated for a project across 9 tabs:

| Tab | Content |
|-----|---------|
| **Overview** | Status, progress ring, generation step timeline, prompt, quick stats |
| **Blueprint** | Full project blueprint: vision statement, design pillars, architecture summary, world outline, story outline, gameplay systems, asset requirements, milestones |
| **Tasks** | Full task graph (40 tasks, phases 1–6) with dependency visualization, status indicators (pending / running / completed), per-task progress |
| **Systems** | Procedural systems panel — world generation, procedural dungeons, enemy AI patterns, loot tables, weather/time systems |
| **Assets** | Asset generation panel — sprite categories, audio tracks, UI elements, VFX effects, with counts and descriptions |
| **Export** | Export framework panel — target engines (Godot 4.x, HTML5, Windows, Android, iOS), build config, export options |
| **Quality** | 8 quality gates with check lists (narrative coherence, gameplay balance, asset completeness, UI consistency, performance, accessibility, export readiness, error-free validation) |
| **Agents** | Live agent network with phase-by-phase status |
| **Memory** | GenLogic panel — AI memory and context for the generation run |

---

## 9. Quality Gates

8 automated quality checkpoints (`constants/generation-pipeline.ts`) that validate the project before export:

| Gate | Description | Checks |
|------|-------------|--------|
| Narrative Coherence | Story arcs and lore are consistent | Story arc completeness, character relationships, world lore, dialogue tone |
| Gameplay Balance | Combat and progression validated | Difficulty curve, enemy scaling, reward frequency, skill tree |
| Asset Completeness | All assets accounted for | Sprite coverage, audio bank, animation states, UI library |
| UI Consistency | Visual language is cohesive | Color palette, typography, icon set, interaction feedback |
| Performance Targets | Frame rate and memory targets met | Draw call budget, memory footprint, asset compression, load time |
| Accessibility | WCAG-inspired compliance | Color contrast, input remapping, text size, colorblind modes |
| Export Readiness | Engine file structure correct | File structure, asset naming, dependency resolution, bundle integrity |
| Error-Free Validation | No broken references | Reference integrity, missing assets, script syntax, config validation |

---

## 10. Export Framework

The export panel (`components/ExportFrameworkPanel.tsx`) supports generating output for multiple targets from a single GenForgeAI project:

| Target | Notes |
|--------|-------|
| Godot 4.x | Primary target — full scene structure, GDScript stubs |
| HTML5 / Web | Playable in browser |
| Windows | Desktop executable |
| Android | Mobile APK |
| iOS | (planned) |

Export metadata is stored in `projects.export_configs` after Phase 6 completes. Build version is generated automatically (`1.0.0-<timestamp36>`).

---

## 11. Asset Browser

The assets tab (`app/(tabs)/assets.tsx`) provides a browsable inventory of all generated assets for a user's projects: sprites, audio tracks, UI elements, VFX effects, and documents. Assets can be filtered by type and marked as favorites.

---

## 12. AI Router

The AI Router is the intelligence layer between the API and the AI models. It is not user-facing but determines the quality of every generation.

**How it works:**
1. Each generation phase is classified as a task type (`foundation`, `story`, `characters`, `assets`, `balance`, `coding`, `chat`, `packaging`)
2. The router selects the first model in that task's priority chain
3. If the model fails (rate limit, overload, timeout), the router waits briefly and tries the next model
4. `openrouter/free` (OpenRouter's automatic free model selector) is the final catch-all
5. All models are free-tier — zero generation cost

**Why it matters:** Story generation uses a creative Llama model. Game balance uses a reasoning-specialized Nemotron model. Coding uses a Qwen coder. Each task gets the model most likely to produce accurate, useful output.

---

## Design System

**Color palette:**

| Token | Hex | Usage |
|-------|-----|-------|
| Background | `#0A0A0F` | App background |
| Card | `#12121A` | Panel and card surfaces |
| Primary | `#2B7FFF` | Buttons, active states, links |
| Secondary | `#7B2FFF` | Accents, highlights |
| Accent | `#00D4FF` | Agent network, special indicators |
| Success | `#22C55E` | Completed states |
| Warning | `#F97316` | Risk indicators, caution states |
| Destructive | `#EF4444` | Errors, delete actions |
| Foreground | `#F8F8FF` | Primary text |
| Muted Foreground | `#8888AA` | Secondary text |

**Typography:** Inter (Regular 400, Medium 500, SemiBold 600, Bold 700)
