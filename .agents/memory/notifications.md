---
name: Notifications system
description: Push-style in-app notifications written by the job queue and served via REST; polled by the mobile app.
---

## Architecture

- **DB table**: `notifications` — columns: id, userId, type, title, body, data (jsonb), isRead, createdAt.
- **Server utility**: `artifacts/api-server/src/lib/notify.ts` — exports `createNotification({ userId, type, title, body, data? })`. Fire-and-forget via `void createNotification(...)`.
- **Job queue integration**: `lib/jobQueue.ts` calls `createNotification` on job completion (`job_completed`) and failure (`job_failed`). Non-blocking — does not affect job outcome.
- **Routes**: `artifacts/api-server/src/routes/notifications.ts` — mounted in routes/index.ts.
  - `GET /api/notifications` — list (limit param, unread=true filter)
  - `GET /api/notifications/count` — lightweight badge count
  - `PUT /api/notifications/:id/read` — mark one read
  - `PUT /api/notifications/read-all` — mark all read
  - `DELETE /api/notifications/:id` — delete one
  - `DELETE /api/notifications` — clear all
- **Mobile context**: `artifacts/mobile/context/NotificationsContext.tsx` — polls GET /api/notifications every 30s; exposes `notifications`, `unreadCount`, `markRead`, `markAllRead`, `remove`, `clearAll`. Guests (no token) skip polling.
- **Mobile UI**: `artifacts/mobile/components/NotificationPanel.tsx` — Modal with row-per-notification, icon by type, time-ago, tap-to-read, ✕ per row, "Mark all read" + trash. Opened by bell button on home screen.
- **Home screen bell**: `app/(tabs)/index.tsx` — badge with live unread count (`9+` cap); opens `NotificationPanel`.

## Notification types and icons

| type | icon | color |
|------|------|-------|
| job_completed | check-circle | #22C55E |
| job_failed | alert-circle | #EF4444 |
| generation_complete | zap | #2B7FFF |
| generation_failed | alert-circle | #EF4444 |
| system | info | #F97316 |

**Why:** `createNotification` is always called with `void` so it never propagates exceptions to callers or slows down the job pipeline.

**How to apply:** To notify a user from any server context, import `createNotification` from `lib/notify.ts` and fire-and-forget it. Never `await` it in a hot path.
