import { Router, type IRouter } from "express";
import { getObjectStream } from "../lib/objectStorage";

const router: IRouter = Router();

// Only generated game-art assets are publicly servable. This is an allowlist:
// the default bucket is shared with private uploads (PRIVATE_OBJECT_DIR), so we
// must NOT stream arbitrary keys from an unauthenticated route. Generated assets
// are written as `assets/<projectId-or-slug>/<name>.<ext>` (see imageGen.ts).
const ALLOWED_KEY = /^assets\/[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+\.(png|jpe?g|webp)$/;

// Serves generated game assets stored in object storage. Replit buckets enforce
// public-access-prevention, so assets cannot be served via a public GCS URL and
// are streamed through the API server instead. These are display assets, so the
// route is intentionally unauthenticated — but locked to the assets/ prefix.
router.get(/^\/files\/(.+)$/, async (req, res) => {
  let key: string;
  try {
    key = decodeURIComponent(req.params[0] ?? "");
  } catch {
    res.status(400).json({ error: "Malformed file key" });
    return;
  }
  // Reject empty keys, path traversal, and anything outside the assets/ prefix.
  if (!key || key.includes("..") || !ALLOWED_KEY.test(key)) {
    res.status(404).json({ error: "File not found" });
    return;
  }
  try {
    const obj = await getObjectStream(key);
    if (!obj) {
      res.status(404).json({ error: "File not found" });
      return;
    }
    res.setHeader("Content-Type", obj.contentType);
    if (obj.size) res.setHeader("Content-Length", String(obj.size));
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
    obj.stream.on("error", (err) => {
      req.log.error({ err, key }, "Asset stream failed");
      if (!res.headersSent) res.status(500).end();
    });
    obj.stream.pipe(res);
  } catch (err) {
    req.log.error({ err, key }, "Failed to serve asset");
    if (!res.headersSent) res.status(500).json({ error: "Failed to serve file" });
  }
});

export default router;
