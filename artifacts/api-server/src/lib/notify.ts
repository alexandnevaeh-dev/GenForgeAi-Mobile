/**
 * Notification helpers.
 * Creates rows in the `notifications` table. Fire-and-forget — callers void the result.
 */

import { db } from "@workspace/db";
import { notifications } from "@workspace/db/schema";
import { logger } from "./logger";

export type NotificationType =
  | "job_completed"
  | "job_failed"
  | "generation_complete"
  | "generation_failed"
  | "system";

export async function createNotification(opts: {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}): Promise<void> {
  try {
    await db.insert(notifications).values({
      userId: opts.userId,
      type: opts.type,
      title: opts.title,
      body: opts.body,
      data: opts.data ?? {},
    });
  } catch (err) {
    logger.warn({ err }, "Failed to create notification (non-fatal)");
  }
}
