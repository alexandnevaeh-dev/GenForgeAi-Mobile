import { Storage } from "@google-cloud/storage";
import { logger } from "./logger";

const bucketId = process.env["DEFAULT_OBJECT_STORAGE_BUCKET_ID"];

// Replit object storage is GCS accessed through the Replit sidecar, which mints
// short-lived credentials. A bare `new Storage()` cannot authenticate here and
// fails with "Could not load the default credentials", so we must point the
// client at the sidecar token endpoint.
const REPLIT_SIDECAR_ENDPOINT = "http://127.0.0.1:1106";

let _client: Storage | null = null;
function client(): Storage {
  if (!_client) {
    _client = new Storage({
      credentials: {
        audience: "replit",
        subject_token_type: "access_token",
        token_url: `${REPLIT_SIDECAR_ENDPOINT}/token`,
        type: "external_account",
        credential_source: {
          url: `${REPLIT_SIDECAR_ENDPOINT}/credential`,
          format: {
            type: "json",
            subject_token_field_name: "access_token",
          },
        },
        universe_domain: "googleapis.com",
      },
      projectId: "",
    });
  }
  return _client;
}

/** Public path prefix the API server serves stored assets from. */
const SERVE_PREFIX = "/api/files/";

/**
 * Upload a buffer to object storage and return an app-served URL.
 *
 * Replit buckets enforce public-access-prevention, so objects cannot be made
 * `allUsers`-readable and there is no public googleapis URL. Instead we keep the
 * object private and serve it through the API server (`GET /api/files/<key>`).
 * The returned path is relative so it works through the Replit proxy in both
 * development and production.
 */
export async function uploadBuffer(
  key: string,
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  if (!bucketId) {
    throw new Error("DEFAULT_OBJECT_STORAGE_BUCKET_ID is not set");
  }
  const file = client().bucket(bucketId).file(key);
  await file.save(buffer, {
    metadata: { contentType: mimeType },
    resumable: false,
  });
  const url = `${SERVE_PREFIX}${key}`;
  logger.info({ key, url }, "Uploaded asset to object storage");
  return url;
}

/**
 * Open a stored object for streaming. Returns null when the bucket isn't
 * configured or the object doesn't exist.
 */
export async function getObjectStream(key: string): Promise<{
  stream: NodeJS.ReadableStream;
  contentType: string;
  size: number;
} | null> {
  if (!bucketId) return null;
  const file = client().bucket(bucketId).file(key);
  const [exists] = await file.exists();
  if (!exists) return null;
  const [meta] = await file.getMetadata();
  return {
    stream: file.createReadStream(),
    contentType: (meta.contentType as string | undefined) ?? "application/octet-stream",
    size: Number(meta.size ?? 0),
  };
}

/**
 * Delete an object from GCS by key.
 */
export async function deleteObject(key: string): Promise<void> {
  if (!bucketId) return;
  try {
    await client().bucket(bucketId).file(key).delete({ ignoreNotFound: true });
  } catch (err) {
    logger.warn({ key, err }, "Failed to delete object from storage");
  }
}

/**
 * Extract the storage key from an app-served URL (`/api/files/<key>`).
 * Also handles the legacy `storage.googleapis.com` form. Returns null when the
 * URL is not a stored-asset URL (e.g. a data: URL).
 */
export function keyFromUrl(url: string): string | null {
  if (url.startsWith(SERVE_PREFIX)) {
    return decodeURIComponent(url.slice(SERVE_PREFIX.length));
  }
  const legacyPrefix = `https://storage.googleapis.com/${bucketId}/`;
  return url.startsWith(legacyPrefix) ? url.slice(legacyPrefix.length) : null;
}
