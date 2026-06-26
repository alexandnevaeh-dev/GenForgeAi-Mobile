---
name: Project-aware chat
description: Streaming AI chat that knows a specific project's blueprint, agent memories, and asset data.
---

## Architecture

- **Server route**: `artifacts/api-server/src/routes/projectChat.ts` — `POST /api/projects/:id/chat`
  - Requires auth; verifies project belongs to caller
  - Loads project row, agent memories, and asset count in parallel
  - Calls `buildMemoryContext` from agentMemory lib to format memories
  - Calls `buildSystemPrompt` which injects blueprint fields (storyData, worldData, characterData, combatData), project metadata, asset count, and memory context
  - Streams via `streamTask("chat", ...)` → SSE `data:` lines with `{delta, done, error}`
- **Mobile component**: `artifacts/mobile/components/ProjectChatPanel.tsx`
  - Manages local message history per session (not persisted)
  - Streams via `fetch + ReadableStream` reader; accumulates delta tokens into the last assistant message
  - Shows suggested questions seeded from genre/title when no messages exist
  - `hasGeneratedData` prop controls the empty-state message (based on `project.progress > 0`)
- **Project detail integration**: `artifacts/mobile/app/project/[id].tsx`
  - `Tab` type extended with `"chat"`
  - `ProjectChatPanel` renders **outside** the outer ScrollView, conditionally `{activeTab === "chat"}`. The ScrollView gets `style={{ display: "none" }}` when chat is active.
  - Tab appears second in the tab bar: Overview | AI Chat | Blueprint | …

## Key constraint

The chat tab **must** render outside the outer `ScrollView` because it owns its own `FlatList` for messages. Never put `ProjectChatPanel` inside the ScrollView — nested VirtualizedLists cause a React Native warning and break scrolling.

## GameProject type note

`GameProject` (client-facing mobile type in `ProjectsContext.tsx`) does NOT include `storyData` — that field lives only on `ApiProject` (the raw API shape). Use `project.progress > 0` as a proxy for "has generated data."

**Why:** The context strips `storyData` when normalising API responses to avoid carrying large JSON blobs in state.
