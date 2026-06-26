import { db } from "@workspace/db";
import { notifications } from "@workspace/db/schema";
import { and, desc, eq } from "drizzle-orm";
import { Router } from "express";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

/** GET /api/notifications — list the caller's notifications (newest first) */
router.get("/notifications", requireAuth, async (req, res) => {
  const userId = req.user!.sub;
  const limit = Math.min(Number(req.query["limit"] ?? 30), 100);
  const unreadOnly = req.query["unread"] === "true";

  const rows = await db
    .select()
    .from(notifications)
    .where(
      unreadOnly
        ? and(eq(notifications.userId, userId), eq(notifications.isRead, false))
        : eq(notifications.userId, userId)
    )
    .orderBy(desc(notifications.createdAt))
    .limit(limit);

  const unreadCount = rows.filter((n) => !n.isRead).length;
  res.json({ notifications: rows, unreadCount });
});

/** GET /api/notifications/count — lightweight unread count for badge */
router.get("/notifications/count", requireAuth, async (req, res) => {
  const userId = req.user!.sub;
  const rows = await db
    .select({ id: notifications.id })
    .from(notifications)
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  res.json({ unreadCount: rows.length });
});

/** PUT /api/notifications/:id/read — mark a single notification as read */
router.put("/notifications/:id/read", requireAuth, async (req, res) => {
  const userId = req.user!.sub;
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(
      and(
        eq(notifications.id, req.params["id"] as string),
        eq(notifications.userId, userId)
      )
    );
  res.json({ ok: true });
});

/** PUT /api/notifications/read-all — mark all as read */
router.put("/notifications/read-all", requireAuth, async (req, res) => {
  const userId = req.user!.sub;
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)));
  res.json({ ok: true });
});

/** DELETE /api/notifications/:id — delete one notification */
router.delete("/notifications/:id", requireAuth, async (req, res) => {
  const userId = req.user!.sub;
  await db
    .delete(notifications)
    .where(
      and(
        eq(notifications.id, req.params["id"] as string),
        eq(notifications.userId, userId)
      )
    );
  res.json({ ok: true });
});

/** DELETE /api/notifications — clear all notifications */
router.delete("/notifications", requireAuth, async (req, res) => {
  const userId = req.user!.sub;
  await db.delete(notifications).where(eq(notifications.userId, userId));
  res.json({ ok: true });
});

export default router;
