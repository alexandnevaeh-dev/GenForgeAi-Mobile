---
name: api-server bundle externals
description: Why some runtime deps must be DIRECT deps of api-server even when only used transitively.
---

# api-server esbuild externals

`artifacts/api-server/build.mjs` bundles to a single ESM file but marks certain packages as `external` (native modules, path-traversal loaders, and broad patterns like `@google/*`, `@google-cloud/*`, `@aws-sdk/*`, etc.). Externalized packages are NOT bundled, so they must be resolvable from `artifacts/api-server/node_modules` at runtime.

**Why:** with pnpm's strict, non-hoisted layout, a package that is only a *transitive* dep (via a `@workspace/*` lib) is not guaranteed to resolve from the api-server's own node_modules. Result: `ERR_MODULE_NOT_FOUND` at startup even though typecheck and install pass.

**How to apply:** if you add a lib that pulls in a package matched by the `external` list in build.mjs (e.g. `@google/genai` via the Gemini integration), also add that package as a **direct dependency** of `artifacts/api-server/package.json`. Mirrors how `@google-cloud/storage` is already a direct dep.
