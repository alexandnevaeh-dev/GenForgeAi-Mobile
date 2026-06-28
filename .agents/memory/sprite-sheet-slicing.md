---
name: Sprite-sheet slicing
description: How generated sprite sheets are sliced into frames, and the storage-key constraint that governs served frame URLs.
---

# Sprite-sheet slicing (POST /assets/:id/slice)

Slicing uses an **explicit caller-supplied `rows`×`cols` grid**, never auto-detection.
**Why:** AI-generated sheets have no reliable machine-readable cell boundaries, so
honest, predictable output only comes from a grid the caller controls. Frames are
emitted as PNG to preserve transparency; extract regions are clamped to image bounds
to avoid sharp rounding errors.

## Served-frame storage key constraint (the sharp edge)

The public `/api/files/<key>` route (`routes/files.ts` `ALLOWED_KEY`) only permits
**exactly two path segments after `assets/`** — `assets/<dir>/<file>.<png|jpg|webp>`.
A nested key like `assets/<slug>/<assetId>/frame-0.png` (three segments) is rejected
with 404 even though the upload succeeds.
**How to apply:** any new served asset must be stored at `assets/<dir>/<file>.<ext>`.
Frames are flattened to `assets/<slug>/<assetId>-frame-<index>.png`. If you ever need
deeper nesting for served assets, you must widen `ALLOWED_KEY` in lockstep.

## Hardening that's in place (don't regress)

- `rows*cols` capped at **144 frames** (Zod refine on the endpoint) + per-dim 1..16.
- `sliceSheet` rejects sources over **64MP** decoded (sharp `limitInputPixels` + explicit check).
- Resolved storage key must start with `assets/` before reading — defense against
  slicing a private object (e.g. PRIVATE_OBJECT_DIR).
- Re-slicing deletes orphaned frame objects from a prior slice (frames no longer referenced).
- Metadata merge is shallow: `{...prevMeta, sheet, frames}` preserves provenance/prompt,
  replaces only `sheet`/`frames` with the latest slice.
