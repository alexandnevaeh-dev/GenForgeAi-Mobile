---
name: mockup-sandbox typecheck failure is a red herring
description: Root pnpm run typecheck fails in mockup-sandbox scaffold; not part of the product
---

# `pnpm run typecheck` fails in mockup-sandbox — ignore it

The root `pnpm run typecheck` fails in `artifacts/mockup-sandbox` (e.g.
`src/components/ui/spinner.tsx` — a duplicate `@types/react` `Ref<SVGSVGElement>`
"two different types with this name exist" error). This is **pre-existing from the
initial commit** in the Replit-provided Canvas component-preview scaffold.

**Why it doesn't matter:** mockup-sandbox is a dev-only Canvas tool, not part of the
GenForgeAI product and not deployed. The two deployable packages — `@workspace/mobile`
and `@workspace/api-server` — both typecheck clean on their own.

**How to apply:** to verify the actual product, run the per-package checks, not root:
`pnpm --filter @workspace/mobile run typecheck` and
`pnpm --filter @workspace/api-server run typecheck`. Don't chase the spinner error.
