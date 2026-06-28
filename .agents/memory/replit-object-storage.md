---
name: Replit object storage (GCS) gotchas
description: How to use Replit's GCS object storage from the API server — auth and serving constraints that break naive setups.
---

# Replit object storage (GCS) gotchas

Two non-obvious constraints make the "obvious" GCS approach fail at runtime:

1. **A bare `new Storage()` cannot authenticate.** It throws "Could not load the
   default credentials." Replit's bucket is GCS reached through the **Replit
   sidecar** (`http://127.0.0.1:1106`), which mints short-lived external-account
   credentials. Construct `new Storage({ credentials: { type: "external_account",
   token_url, credential_source, audience: "replit", ... }, projectId: "" })`.
   The exact credentials block is in
   `.local/skills/object-storage/templates/api-server/src/lib/objectStorage.ts`.

2. **Buckets enforce public-access-prevention.** `file.makePublic()` fails with
   "The member bindings allUsers and allAuthenticatedUsers are not allowed since
   public access prevention is enforced." So there is **no** usable
   `https://storage.googleapis.com/<bucket>/<key>` public URL. Serve objects
   through the API server instead (stream via `file.createReadStream()`) and
   return an app-relative URL (e.g. `/api/files/<key>`) that resolves through the
   Replit proxy in both dev and production.

**Why:** these are runtime-only failures — types compile fine, and the code looks
correct. Both surfaced only by actually generating + uploading an image.

**How to apply:** any new upload/serve code in this repo must use the sidecar
client and an app-served path; never `makePublic()` or public GCS URLs.
