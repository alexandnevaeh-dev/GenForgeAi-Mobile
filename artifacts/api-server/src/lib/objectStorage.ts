import { Storage } from "@google-cloud/storage";
import { logger } from "./logger";

const bucketId = process.env["DEFAULT_OBJECT_STORAGE_BUCKET_ID"];

let _client: Storage | null = null;
function client(): Storage {
  if (!_client) _client = new Storage();
  return _client;
}

/**
 * Upload a buffer to GCS and return a public HTTPS URL.
 * The object is made publicly readable immediately after upload.
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
  await file.makePublic();
  const url = `https://storage.googleapis.com/${bucketId}/${key}`;
  logger.info({ key, url }, "Uploaded asset to object storage");
  return url;
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
 * Extract the GCS key from a storage.googleapis.com URL.
 * Returns null if the URL is not a GCS URL (e.g. a data: URL).
 */
export function keyFromUrl(url: string): string | null {
  const prefix = `https://storage.googleapis.com/${bucketId}/`;
  return url.startsWith(prefix) ? url.slice(prefix.length) : null;
}
