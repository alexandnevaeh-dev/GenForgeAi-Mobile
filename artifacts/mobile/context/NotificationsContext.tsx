import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import { useAuth } from "./AuthContext";

export interface AppNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

interface NotificationsContextValue {
  notifications: AppNotification[];
  unreadCount: number;
  loading: boolean;
  refresh: () => Promise<void>;
  markRead: (id: string) => Promise<void>;
  markAllRead: () => Promise<void>;
  remove: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextValue | null>(null);

const POLL_MS = 30_000; // poll every 30 s for new notifications

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { accessToken, user } = useAuth();
  const isGuest = !accessToken || user?.id === "guest";

  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const tokenRef = useRef(accessToken);
  useEffect(() => { tokenRef.current = accessToken; }, [accessToken]);

  const headers = useCallback(
    (): HeadersInit => ({
      "Content-Type": "application/json",
      ...(tokenRef.current ? { Authorization: `Bearer ${tokenRef.current}` } : {}),
    }),
    []
  );

  const refresh = useCallback(async () => {
    if (isGuest) return;
    setLoading(true);
    try {
      const res = await fetch("/api/notifications?limit=50", { headers: headers() });
      if (!res.ok) return;
      const data = (await res.json()) as {
        notifications: AppNotification[];
        unreadCount: number;
      };
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch {
      // non-fatal
    } finally {
      setLoading(false);
    }
  }, [isGuest, headers]);

  // Initial fetch + polling
  useEffect(() => {
    if (isGuest) return;
    void refresh();
    const id = setInterval(() => void refresh(), POLL_MS);
    return () => clearInterval(id);
  }, [isGuest, refresh]);

  const markRead = useCallback(async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await fetch(`/api/notifications/${id}/read`, {
        method: "PUT",
        headers: headers(),
      });
    } catch { /* non-fatal */ }
  }, [headers]);

  const markAllRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    try {
      await fetch("/api/notifications/read-all", { method: "PUT", headers: headers() });
    } catch { /* non-fatal */ }
  }, [headers]);

  const remove = useCallback(async (id: string) => {
    const was = notifications.find((n) => n.id === id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
    if (was && !was.isRead) setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await fetch(`/api/notifications/${id}`, { method: "DELETE", headers: headers() });
    } catch { /* non-fatal */ }
  }, [notifications, headers]);

  const clearAll = useCallback(async () => {
    setNotifications([]);
    setUnreadCount(0);
    try {
      await fetch("/api/notifications", { method: "DELETE", headers: headers() });
    } catch { /* non-fatal */ }
  }, [headers]);

  return (
    <NotificationsContext.Provider
      value={{ notifications, unreadCount, loading, refresh, markRead, markAllRead, remove, clearAll }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications(): NotificationsContextValue {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error("useNotifications must be used inside NotificationsProvider");
  return ctx;
}
