---
name: AI Router Architecture
description: GenForgeAI uses a task-aware AI Router (lib/ai-router) that routes each generation phase to the optimal free model via OpenRouter, with automatic fallback chains.
---

# AI Router Architecture

## Router Location
`lib/ai-router/src/` — standalone workspace lib, exports `routeTask()` and `streamTask()`.

## Integration
- OpenRouter provisioned via Replit AI Integrations (`AI_INTEGRATIONS_OPENROUTER_BASE_URL` + `AI_INTEGRATIONS_OPENROUTER_API_KEY`)
- Template lib at `lib/integrations-openrouter-ai/` (copied from skill)
- `api-server` imports `@workspace/ai-router` in both `routes/chat.ts` and `routes/generate.ts`

## Task → Model Priority Chain (all free-tier)

| Task | Primary | Fallback 1 | Fallback 2 | Last Resort |
|------|---------|-----------|-----------|-------------|
| foundation | nemotron-3-ultra-550b:free | nemotron-3-super-120b:free | qwen3-next-80b:free | openrouter/free |
| story | hermes-3-llama-3.1-405b:free | llama-3.3-70b:free | nemotron-3-super-120b:free | openrouter/free |
| characters | llama-3.3-70b:free | hermes-3-llama-3.1-405b:free | gemma-4-31b-it:free | openrouter/free |
| assets | qwen3-next-80b:free | gemma-4-31b-it:free | gemma-4-26b:free | openrouter/free |
| balance | nemotron-3-nano-omni-reasoning:free | nemotron-3-super-120b:free | qwen3-next-80b:free | openrouter/free |
| coding | qwen3-coder:free | laguna-m.1:free | north-mini-code:free | openrouter/free |
| chat | llama-3.3-70b:free | hermes-3-llama-3.1-405b:free | gemma-4-31b-it:free | openrouter/free |
| packaging | gpt-oss-20b:free | nemotron-3-nano-30b:free | openrouter/free | — |

## Key Rules
- Workspace lib `package.json` must export `./src/index.ts` (not `./dist/index.js`) so esbuild can bundle source directly — this is the same pattern as all other workspace libs.
- `lib/ai-router/tsconfig.json` still uses `emitDeclarationOnly: true` + `composite: true` for TS project references.
- Retry logic: exponential backoff with `retryDelayMs * attemptCount`, skips non-retryable errors.
- `streamTask()` used for chat (streaming); `routeTask()` used for generation phases (non-streaming, JSON output).

**Why:** Each AI task type has different optimal models. Story/dialogue benefits from Llama's creative strength; balance/reasoning from Nemotron's reasoning capability; coding from DeepSeek/Qwen coders. Using free OpenRouter tier keeps costs at zero.
