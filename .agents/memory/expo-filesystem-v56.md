---
name: expo-file-system v56 legacy API
description: Where the classic FileSystem download/cache API lives in expo-file-system v56+
---

In `expo-file-system` v56+, the classic imperative API (`downloadAsync`, `cacheDirectory`, `documentDirectory`) is no longer the default export — it moved to the `expo-file-system/legacy` entry point. The root entry exposes the new API.

**How to apply:** For authenticated file downloads (e.g. `downloadAsync(url, fileUri, { headers })`) import from `expo-file-system/legacy`. Confirmed working in the mobile artifact for the sprite-sheet export → `expo-sharing` flow.

**Why:** Importing `downloadAsync`/`cacheDirectory` from the root `expo-file-system` fails at runtime/typecheck in v56; the symbols only exist under `/legacy`.
