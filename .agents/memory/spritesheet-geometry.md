---
name: Sprite-sheet slice/export geometry
description: Keeping export atlas rectangles consistent with the slicer
---

The export atlas (`GET /assets/:id/export`) computes each frame rect as `left = margin + col*(frameWidth+spacing)`, `top = margin + row*(frameHeight+spacing)`, clamped to sheet bounds. This MUST mirror the slicer in `artifacts/api-server/src/lib/spriteSheet.ts`.

**Why:** The atlas and the actual sliced frame PNGs come from two different code paths. If the slicer geometry changes but the export `frameRect` does not (or vice versa), the exported atlas rectangles silently stop matching the frame images — broken in the target engine with no error. `margin`/`spacing` are persisted into `metadata.sheet` by the slice endpoint precisely so export can reproduce the same grid.

**How to apply:** Any change to slice geometry must update both the slicer and the export `frameRect`/`buildAtlas` together. The export builds the bundle only from persisted `metadata.sheet`/`metadata.frames` (409 if missing) and must fail explicitly (404/409) on any missing/invalid frame rather than emit a partial zip.
