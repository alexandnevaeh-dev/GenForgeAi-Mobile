# GenForgeAI — Database

**ORM:** Drizzle ORM
**Database:** PostgreSQL
**Schema location:** `lib/db/src/schema/index.ts`
**Migration command:** `pnpm --filter @workspace/db run push`

---

## Tables

### `users`

Stores registered accounts.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | uuid | PK, default random | |
| `email` | text | NOT NULL, UNIQUE | |
| `username` | text | NOT NULL, UNIQUE | 3–32 chars, alphanumeric + underscore |
| `display_name` | text | NOT NULL | |
| `password_hash` | text | nullable | bcrypt, cost 12 |
| `avatar` | text | nullable | URL |
| `bio` | text | nullable | |
| `subscription_tier` | text | NOT NULL, default `"free"` | `free` / `pro` / `studio` |
| `ai_credits_used` | integer | NOT NULL, default 0 | |
| `ai_credits_limit` | integer | NOT NULL, default 100 | |
| `total_projects` | integer | NOT NULL, default 0 | |
| `total_assets` | integer | NOT NULL, default 0 | |
| `total_generations` | integer | NOT NULL, default 0 | |
| `is_email_verified` | boolean | NOT NULL, default false | |
| `is_mfa_enabled` | boolean | NOT NULL, default false | |
| `role` | text | NOT NULL, default `"free"` | `free` / `pro` / `admin` |
| `preferences` | json | default `{}` | UI preferences |
| `notification_settings` | json | default `{}` | Per-channel toggles |
| `privacy_settings` | json | default `{}` | Profile visibility settings |
| `connected_accounts` | json | default `{}` | OAuth provider map |
| `last_login_at` | timestamp | nullable | |
| `created_at` | timestamp | NOT NULL, default now | |
| `updated_at` | timestamp | NOT NULL, default now | |

---

### `refresh_tokens`

Stores long-lived tokens for session renewal. All tokens are revocable.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | uuid | PK, default random | |
| `user_id` | uuid | NOT NULL, FK → users(id) CASCADE | |
| `token` | text | NOT NULL, UNIQUE | Signed JWT string |
| `device_info` | text | nullable | User-Agent header |
| `ip_address` | text | nullable | |
| `expires_at` | timestamp | NOT NULL | 30 days from creation |
| `revoked_at` | timestamp | nullable | Set on logout |
| `created_at` | timestamp | NOT NULL, default now | |

---

### `projects`

Core entity. Each project holds all AI-generated content across phases.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | uuid | PK, default random | |
| `owner_id` | uuid | NOT NULL, FK → users(id) CASCADE | |
| `title` | text | NOT NULL | |
| `description` | text | NOT NULL, default `""` | |
| `genre` | text | NOT NULL, default `"RPG"` | |
| `art_style` | text | NOT NULL, default `"Pixel Art"` | |
| `platform` | text | NOT NULL, default `"Multi-platform"` | |
| `status` | text | NOT NULL, default `"planning"` | Lifecycle enum (see below) |
| `progress` | integer | NOT NULL, default 0 | 0–100 |
| `cover_art` | text | nullable | URL |
| `tags` | json | default `[]` | `string[]` |
| `story_data` | json | default `{}` | Phase 1 output + initial prompt |
| `world_data` | json | default `{}` | Phase 2 output |
| `character_data` | json | default `{}` | Phase 3 output |
| `combat_data` | json | default `{}` | Phase 5 output |
| `asset_manifest` | json | default `[]` | Phase 4 output |
| `audio_manifest` | json | default `[]` | Audio asset list |
| `export_configs` | json | default `{}` | Phase 6 output |
| `build_logs` | json | default `[]` | Build log entries |
| `version_history` | json | default `[]` | Previous versions |
| `agent_states` | json | default `{}` | Per-agent status snapshots |
| `is_public` | boolean | NOT NULL, default false | |
| `is_favorite` | boolean | NOT NULL, default false | |
| `is_archived` | boolean | NOT NULL, default false | |
| `last_generated_at` | timestamp | nullable | Last AI generation run |
| `created_at` | timestamp | NOT NULL, default now | |
| `updated_at` | timestamp | NOT NULL, default now | |

**Project Status Lifecycle:**

```
planning → generating → in_progress → complete → exported
                                    ↘ archived
```

---

### `ai_tasks`

Individual AI agent task records. One row per agent task per generation run.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | uuid | PK, default random | |
| `project_id` | uuid | nullable, FK → projects(id) CASCADE | |
| `owner_id` | uuid | NOT NULL, FK → users(id) CASCADE | |
| `agent_name` | text | NOT NULL | e.g. `"World Architect"` |
| `agent_phase` | text | NOT NULL, default `"planning"` | Phase label |
| `task_type` | text | NOT NULL | e.g. `"story"`, `"balance"` |
| `status` | text | NOT NULL, default `"pending"` | `pending / running / completed / failed` |
| `priority` | integer | NOT NULL, default 5 | 1–10 |
| `progress` | integer | NOT NULL, default 0 | 0–100 |
| `input_data` | json | default `{}` | Prompt sent to model |
| `output_data` | json | default `{}` | Model response |
| `logs` | json | default `[]` | `string[]` |
| `error_message` | text | nullable | |
| `retry_count` | integer | NOT NULL, default 0 | |
| `execution_time_ms` | integer | nullable | |
| `started_at` | timestamp | nullable | |
| `completed_at` | timestamp | nullable | |
| `created_at` | timestamp | NOT NULL, default now | |
| `updated_at` | timestamp | NOT NULL, default now | |

---

### `assets`

Generated or uploaded assets linked to projects.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | uuid | PK, default random | |
| `project_id` | uuid | nullable, FK → projects(id) CASCADE | |
| `owner_id` | uuid | NOT NULL, FK → users(id) CASCADE | |
| `name` | text | NOT NULL | |
| `type` | text | NOT NULL | `sprite / audio / ui / vfx / doc` |
| `category` | text | NOT NULL | e.g. `"character"`, `"environment"` |
| `url` | text | nullable | Storage URL |
| `thumbnail_url` | text | nullable | |
| `file_size` | integer | nullable | Bytes |
| `mime_type` | text | nullable | |
| `tags` | json | default `[]` | `string[]` |
| `metadata` | json | default `{}` | Arbitrary asset metadata |
| `is_favorite` | boolean | NOT NULL, default false | |
| `created_at` | timestamp | NOT NULL, default now | |
| `updated_at` | timestamp | NOT NULL, default now | |

---

### `subscriptions`

Billing subscription records per user.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | uuid | PK, default random | |
| `user_id` | uuid | NOT NULL, FK → users(id) CASCADE | |
| `tier` | text | NOT NULL, default `"free"` | `free / pro / studio` |
| `status` | text | NOT NULL, default `"active"` | `active / cancelled / past_due` |
| `billing_interval` | text | NOT NULL, default `"monthly"` | `monthly / annual` |
| `current_period_start` | timestamp | NOT NULL, default now | |
| `current_period_end` | timestamp | nullable | |
| `cancelled_at` | timestamp | nullable | |
| `trial_ends_at` | timestamp | nullable | |
| `external_subscription_id` | text | nullable | Stripe/payment provider ID |
| `created_at` | timestamp | NOT NULL, default now | |
| `updated_at` | timestamp | NOT NULL, default now | |

---

### `notifications`

In-app notification delivery.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `id` | uuid | PK, default random | |
| `user_id` | uuid | NOT NULL, FK → users(id) CASCADE | |
| `type` | text | NOT NULL | `generation_complete / asset_ready / etc` |
| `title` | text | NOT NULL | |
| `body` | text | NOT NULL | |
| `data` | json | default `{}` | Action payload |
| `is_read` | boolean | NOT NULL, default false | |
| `created_at` | timestamp | NOT NULL, default now | |

---

### `conversations` + `messages`

OpenRouter conversation threading (from `lib/integrations-openrouter-ai` template).

| Table | Key Columns |
|-------|-------------|
| `conversations` | `id`, `user_id`, `title`, `created_at` |
| `messages` | `id`, `conversation_id`, `role`, `content`, `created_at` |

---

## JSON Column Schemas

### `projects.story_data`
```json
{
  "prompt": "user's original game description",
  "tagline": "...",
  "coreLoop": "...",
  "uniqueMechanic": "...",
  "targetAudience": "...",
  "genreFeatures": ["..."],
  "tone": "...",
  "setting": "..."
}
```

### `projects.world_data`
```json
{
  "worldName": "...",
  "loreSummary": "...",
  "acts": [{ "title": "...", "summary": "..." }],
  "factions": [{ "name": "...", "description": "..." }],
  "theme": "...",
  "openingHook": "..."
}
```

### `projects.character_data`
```json
{
  "protagonist": { "name": "...", "backstory": "...", "abilities": ["..."] },
  "npcs": [{ "name": "...", "role": "...", "description": "..." }],
  "enemies": [{ "name": "...", "type": "...", "threat": "..." }],
  "bosses": [{ "name": "...", "description": "...", "phase": "..." }],
  "quests": [{ "name": "...", "description": "...", "reward": "..." }]
}
```

### `projects.combat_data`
```json
{
  "combatSystem": "...",
  "coreMechanics": ["..."],
  "playerStats": { "healthRange": "...", "damageRange": "...", "levelCap": 50 },
  "enemyScaling": "...",
  "difficultyModifiers": { "easy": "...", "normal": "...", "hard": "..." },
  "economy": { "currency": "...", "progressionLoop": "..." },
  "balanceNotes": "..."
}
```

### `projects.export_configs`
```json
{
  "primaryTarget": "Godot 4.x",
  "supportedTargets": ["Godot 4.x", "HTML5", "Windows", "Android"],
  "buildVersion": "1.0.0-abc123",
  "exportedAt": "2026-06-25T00:00:00Z",
  "generatedBy": "GenForgeAI v1.0",
  "genre": "RPG",
  "artStyle": "Pixel Art"
}
```

---

## Indexes & Performance Notes

- All foreign keys have `onDelete: "cascade"` — deleting a user removes all their projects, tasks, assets, tokens, and subscriptions
- Project queries always include `owner_id` filter to prevent cross-user data leakage
- `projects` queries are ordered by `updated_at DESC`
- `refresh_tokens.token` has a UNIQUE index for fast lookup on refresh
