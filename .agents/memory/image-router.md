---
name: image-router decision
description: Why image generation goes through lib/image-router and how provider failover/provenance work.
---

# Image generation routing

All API-server image generation goes through `lib/image-router` (`generateImage(category, prompt, {quality, aspect, transparent})`), mirroring `lib/ai-router`. Do not call a provider SDK directly from app code.

**Why:** one place owns provider selection + failover, so a single provider outage degrades gracefully instead of failing the feature.

**How to apply:**
- Quality tiers map to ordered model chains; the router tries each provider in order and falls over on error. Fast tier leads with the cheaper Gemini flash model; high tier leads with the pro image model. Gemini `pro` only on explicit high-quality requests (it bills more).
- Category → aspect ratio + transparency defaults live in `CATEGORY_CONFIG`; callers can override per call.
- **Gemini provider must stay lazy.** The `@workspace/integrations-gemini-ai` client throws at *module import* if its env vars are missing. The gemini adapter guards on env presence and uses a dynamic `import()` inside `generate()` so a missing Gemini config degrades to OpenAI failover instead of crashing server startup. Never re-add a top-level `import { ai } from "@workspace/integrations-gemini-ai"`.
- Persist real provenance (`generatedBy` = produced model, `provider`) into `assets.metadata`; never hardcode a model name. The gen helpers return `{ url, model, provider, mimeType }` for this reason.
- OpenRouter is chat-only (no image gen). Replicate/fal/HF/Together would need user-supplied keys — future plug-ins.
