# GenForgeAI — API Reference

**Base URL (development):** `http://localhost:80/api`
**Base URL (production):** `https://<domain>/api`
**Content-Type:** `application/json` (all requests and responses unless noted)
**Authentication:** `Authorization: Bearer <accessToken>` header

---

## Health

### `GET /api/healthz`

Returns server status. No authentication required.

**Response 200:**
```json
{ "status": "ok" }
```

---

## Authentication

### `POST /api/auth/register`

Create a new account.

**Request body:**
```json
{
  "email": "user@example.com",
  "username": "myusername",
  "displayName": "My Name",
  "password": "mypassword123"
}
```

**Validation:**
- `email` — valid email format
- `username` — 3–32 characters, alphanumeric and underscore only
- `displayName` — 1–64 characters
- `password` — 8–128 characters

**Response 201:**
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "myusername",
    "displayName": "My Name",
    "role": "free",
    "subscriptionTier": "free"
  }
}
```

**Error 409:** Email already in use
**Error 400:** Validation failed

---

### `POST /api/auth/login`

Authenticate an existing account.

**Request body:**
```json
{ "email": "user@example.com", "password": "mypassword123" }
```

**Response 200:**
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "username": "myusername",
    "displayName": "My Name",
    "avatar": null,
    "role": "free",
    "subscriptionTier": "free",
    "aiCreditsUsed": 0,
    "aiCreditsLimit": 100,
    "totalProjects": 0,
    "totalGenerations": 0
  }
}
```

**Error 401:** Invalid email or password

---

### `POST /api/auth/refresh`

Obtain a new access token using a refresh token.

**Request body:**
```json
{ "refreshToken": "eyJ..." }
```

**Response 200:**
```json
{ "accessToken": "eyJ..." }
```

**Error 401:** Invalid or expired / revoked refresh token

---

### `POST /api/auth/logout`

**Auth required.** Revoke the refresh token.

**Request body:**
```json
{ "refreshToken": "eyJ..." }
```

**Response 200:**
```json
{ "ok": true }
```

---

### `GET /api/auth/me`

**Auth required.** Returns the authenticated user's full profile.

**Response 200:**
```json
{
  "user": {
    "id": "uuid",
    "email": "...",
    "username": "...",
    "displayName": "...",
    "avatar": null,
    "bio": null,
    "subscriptionTier": "free",
    "aiCreditsUsed": 0,
    "aiCreditsLimit": 100,
    "totalProjects": 0,
    "role": "free",
    "preferences": {},
    "createdAt": "2026-06-25T00:00:00Z"
  }
}
```

---

## Projects

All project endpoints require authentication. Projects are scoped to the authenticated user — cross-user access is blocked at the query level.

### `GET /api/projects`

List all non-archived projects for the authenticated user, sorted by `updated_at` descending.

**Response 200:**
```json
{
  "projects": [
    {
      "id": "uuid",
      "ownerId": "uuid",
      "title": "Dark Fantasy RPG",
      "description": "...",
      "genre": "RPG",
      "artStyle": "Pixel Art",
      "platform": "Multi-platform",
      "status": "in_progress",
      "progress": 83,
      "tags": ["RPG", "Pixel Art"],
      "storyData": { "prompt": "...", "tagline": "..." },
      "worldData": {},
      "characterData": {},
      "combatData": {},
      "assetManifest": [],
      "exportConfigs": {},
      "isPublic": false,
      "isFavorite": false,
      "lastGeneratedAt": "2026-06-25T00:00:00Z",
      "createdAt": "2026-06-25T00:00:00Z",
      "updatedAt": "2026-06-25T00:00:00Z"
    }
  ]
}
```

---

### `POST /api/projects`

Create a new project.

**Request body:**
```json
{
  "title": "Dark Fantasy RPG",
  "description": "An epic RPG",
  "genre": "RPG",
  "artStyle": "Pixel Art",
  "platform": "Multi-platform",
  "tags": ["RPG", "PC"],
  "prompt": "A dark souls-like roguelike with branching narrative"
}
```

**Notes:**
- `prompt` is stored in `storyData.prompt` and used as the generation seed
- All fields except `title` are optional with sensible defaults

**Response 201:**
```json
{ "project": { ...projectObject } }
```

---

### `GET /api/projects/:id`

Retrieve a single project by ID.

**Response 200:**
```json
{ "project": { ...projectObject } }
```

**Error 404:** Project not found or not owned by user

---

### `PATCH /api/projects/:id`

Update project fields. All fields optional.

**Request body (any subset):**
```json
{
  "title": "...",
  "description": "...",
  "genre": "Action",
  "artStyle": "Low Poly",
  "status": "complete",
  "progress": 100,
  "isFavorite": true,
  "isPublic": false,
  "isArchived": false,
  "storyData": {},
  "worldData": {},
  "characterData": {},
  "combatData": {}
}
```

**Valid status values:** `planning`, `generating`, `in_progress`, `complete`, `exported`, `archived`

**Response 200:**
```json
{ "project": { ...updatedProjectObject } }
```

---

### `DELETE /api/projects/:id`

Permanently delete a project and all its cascaded data.

**Response 200:**
```json
{ "ok": true }
```

---

## AI Generation

### `POST /api/projects/:id/generate`

**Auth required.** Starts a 6-phase AI generation pipeline for the project. Returns a Server-Sent Events stream.

**Request body:**
```json
{
  "prompt": "A dark souls-like roguelike RPG",
  "genre": "RPG",
  "artStyle": "Pixel Art",
  "difficulty": "hard",
  "gameLength": "long",
  "worldSize": "medium",
  "numBosses": 5,
  "mode": "autonomous"
}
```

**Response:** `Content-Type: text/event-stream`

**SSE Event types:**

| Event | Payload | Notes |
|-------|---------|-------|
| `phase_start` | `{ event, phase, label }` | Fired when a phase begins |
| `phase_model` | `{ event, phase, model }` | Reports which model was selected |
| `phase_complete` | `{ event, phase, progress }` | Fired when phase finishes |
| `done` | `{ event, progress: 100 }` | All 6 phases complete |
| `error` | `{ event, message }` | Generation failed |

**Example stream:**
```
data: {"event":"phase_start","phase":1,"label":"Foundation"}
data: {"event":"phase_model","phase":1,"model":"nvidia/nemotron-3-ultra-550b-a55b:free"}
data: {"event":"phase_complete","phase":1,"progress":16}
data: {"event":"phase_start","phase":2,"label":"World & Story"}
data: {"event":"phase_model","phase":2,"model":"nousresearch/hermes-3-llama-3.1-405b:free"}
data: {"event":"phase_complete","phase":2,"progress":33}
...
data: {"event":"done","progress":100}
```

**Side effects:** Each phase completion writes its output to the database immediately. If the connection drops, progress is preserved and the project can be re-generated to continue.

**Error 404:** Project not found

---

## Chat

### `POST /api/chat`

**Auth optional.** Streams a response from the Master Game Director AI persona. Works for both authenticated and guest users.

**Request body:**
```json
{
  "messages": [
    { "role": "user", "content": "I want to make a dark RPG" },
    { "role": "assistant", "content": "That sounds compelling..." },
    { "role": "user", "content": "With roguelike elements" }
  ]
}
```

**Constraints:**
- Maximum 50 messages per request
- Maximum 4000 characters per message content

**Response:** `Content-Type: text/event-stream`

**SSE Event types:**

| Event | Payload |
|-------|---------|
| Token chunk | `{ "content": "token" }` |
| Done | `{ "done": true, "model": "meta-llama/..." }` |
| Error | `{ "error": "message" }` |

**Example stream:**
```
data: {"content":"That"}
data: {"content":" sounds"}
data: {"content":" like"}
data: {"done":true,"model":"meta-llama/llama-3.3-70b-instruct:free"}
```

---

## AI Tasks

### `GET /api/ai-tasks`

**Auth required.** List AI tasks for the authenticated user.

### `POST /api/ai-tasks`

**Auth required.** Create a new AI task record.

### `GET /api/ai-tasks/:id`

**Auth required.** Retrieve a single AI task.

### `PATCH /api/ai-tasks/:id`

**Auth required.** Update an AI task's status, progress, or output.

### `DELETE /api/ai-tasks/:id`

**Auth required.** Delete an AI task.

---

## Error Format

All error responses use a consistent format:

```json
{ "error": "Human readable message" }
```

Validation errors include details:

```json
{
  "error": "Validation failed",
  "details": [
    { "code": "too_small", "path": ["password"], "message": "Too short" }
  ]
}
```

---

## HTTP Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK |
| 201 | Created |
| 400 | Validation failed or bad request |
| 401 | Missing / invalid / expired token |
| 404 | Resource not found or not owned by user |
| 409 | Conflict (e.g. email already in use) |
| 500 | Internal server error |
