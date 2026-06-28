# GenForgeAI

AI-assisted game-asset studio: generate sprites/sheets/covers, slice sprite sheets into frames, preview them as animations, and export engine-ready bundles. Mobile (Expo) frontend backed by an Express/Drizzle/Postgres API.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/api-server/src/routes/assets.ts` — asset CRUD, generate, sprite-sheet `POST /assets/:id/slice` and `GET /assets/:id/export` (zip).
- `artifacts/api-server/src/lib/spriteSheet.ts` — slice geometry (source of truth for frame rects).
- `artifacts/api-server/src/lib/objectStorage.ts` — object storage helpers (`getObjectStream`/`keyFromUrl`/`uploadBuffer`/`deleteObject`); `readObject` is local to `assets.ts`.
- `artifacts/mobile/app/(tabs)/assets.tsx` — asset grid + lightbox; exports the `ApiAsset` interface.
- `artifacts/mobile/components/SpriteSheetToolsModal.tsx` — slice controls, frame grid, play-as-animation, export.

## Architecture decisions

- Assets use the manual `fetch` + Bearer-token pattern, NOT the OpenAPI codegen hooks. Match it for new asset endpoints.
- Sprite-sheet export requires a prior slice: it builds the bundle from persisted `metadata.sheet`/`metadata.frames` and returns 409 if absent (no on-demand slicing in the GET). The slice endpoint persists `margin`/`spacing` so the atlas geometry is reproducible.
- Export atlas format is TexturePacker JSON Hash (Phaser-native, generically importable). Bundle = original sheet PNG + `frames/` PNGs + atlas JSON + `manifest.json` + `README.txt`.
- Export is an authenticated GET (owner check + `assets/` key-prefix guard), streamed with `Content-Disposition` — not served via `/api/files`.
- Honesty convention: the export fails explicitly (404/409) on any missing/invalid frame rather than emitting a partial zip.

## Product

- Generate game assets (sprites, sprite sheets, covers, characters, etc.) from prompts.
- Slice a sprite sheet into a grid of frames (rows/cols/margin/spacing), preview the frame grid, and play frames as a looping animation at adjustable FPS.
- Export an engine-ready zip (sheet + frame PNGs + TexturePacker atlas + manifest + README) and share/download it from the device.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
