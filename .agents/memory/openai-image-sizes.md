---
name: OpenAI gpt-image-1 supported sizes
description: The image-size type union in the OpenAI integration lib is stale; only certain sizes work at runtime.
---

# OpenAI gpt-image-1 supported sizes

`generateImageBuffer(prompt, size)` in `lib/integrations-openai-ai-server` calls
model **gpt-image-1**, which only accepts sizes: `1024x1024`, `1024x1536`
(portrait), `1536x1024` (landscape), `auto`.

The integration's default size type union historically listed DALL·E 2 sizes
(`512x512`, `256x256`) that gpt-image-1 **rejects at runtime** with
`400 Invalid size`. The union was corrected to the gpt-image-1 set.

**Why:** a stale type union let callers pass `512x512`, which type-checked but
failed at runtime — exactly how the asset-generation bug slipped in.

**How to apply:** only pass gpt-image-1-supported sizes; if the model is ever
changed, re-check the supported-size list (documented in the
`ai-integrations-openai` skill) before trusting the type.
