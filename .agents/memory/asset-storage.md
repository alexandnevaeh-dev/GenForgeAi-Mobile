---
name: Asset image storage
description: GCS object storage for AI-generated game assets — how images are stored, served, and regenerated.
---

## Rule
All AI-generated images must be uploaded to GCS via `lib/objectStorage.ts` and stored as persistent `https://storage.googleapis.com/...` URLs. Never store base64 data URLs in the DB.

**Why:** data URLs in postgres are enormous (hundreds of KB per row), can't be cached by CDN, and can't be referenced persistently from mobile clients.

## How to apply
- `generateImageBuffer()` returns a raw Buffer — always pass through `uploadBuffer(key, buf, mimeType)` before saving to DB.
- Key format: `assets/{projectId}/{category}-{timestamp}.png`
- `objectStorage.ts` lives at `artifacts/api-server/src/lib/objectStorage.ts`; uses `DEFAULT_OBJECT_STORAGE_BUCKET_ID` env var (already provisioned).
- GCS bucket: `replit-objstore-16e68a6f-8a52-4d33-bcfb-7021503acc82`
- `@google-cloud/storage` is installed on `@workspace/api-server`.

## Regeneration
- Each asset's `metadata.imgCtx` contains the full `GameImageCtx` needed to re-run the generator.
- `POST /api/assets/:id/regenerate` reads `imgCtx` from metadata; falls back to reading project storyData/worldData/characterData if metadata is missing.
- `regenAsset(category, ctx, projectId)` in `imageGen.ts` routes by category (cover/character/boss/environment).

## Mobile
- `assets.tsx` filters out any `data:` URLs (legacy rows) before displaying.
- Lightbox modal: full-screen image + Regenerate + Delete + Favorite actions.
- `ApiAsset` type is exported from `assets.tsx` for reuse in other components.
