import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useNotifications, type AppNotification } from "@/context/NotificationsContext";
import { useColors } from "@/hooks/useColors";

const TYPE_META: Record<string, { icon: string; color: string }> = {
  job_completed:       { icon: "check-circle", color: "#22C55E" },
  job_failed:          { icon: "alert-circle", color: "#EF4444" },
  generation_complete: { icon: "zap",          color: "#2B7FFF" },
  generation_failed:   { icon: "alert-circle", color: "#EF4444" },
  system:              { icon: "info",          color: "#F97316" },
};

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function NotifRow({ notif, onRead, onRemove }: {
  notif: AppNotification;
  onRead: (id: string) => void;
  onRemove: (id: string) => void;
}) {
  const colors = useColors();
  const meta = TYPE_META[notif.type] ?? TYPE_META.system;

  return (
    <Pressable
      onPress={() => { if (!notif.isRead) onRead(notif.id); }}
      style={[
        styles.row,
        {
          backgroundColor: notif.isRead ? colors.card : colors.primary + "0C",
          borderBottomColor: colors.border,
        },
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: meta.color + "22" }]}>
        <Feather name={meta.icon as any} size={16} color={meta.color} />
      </View>
      <View style={styles.rowBody}>
        <View style={styles.rowTop}>
          <Text style={[styles.rowTitle, { color: colors.foreground }]} numberOfLines={1}>
            {notif.title}
          </Text>
          {!notif.isRead && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
        </View>
        <Text style={[styles.rowBody2, { color: colors.mutedForeground }]} numberOfLines={2}>
          {notif.body}
        </Text>
        <Text style={[styles.rowTime, { color: colors.mutedForeground }]}>
          {timeAgo(notif.createdAt)}
        </Text>
      </View>
      <Pressable onPress={() => onRemove(notif.id)} style={styles.removeBtn} hitSlop={8}>
        <Feather name="x" size={14} color={colors.mutedForeground} />
      </Pressable>
    </Pressable>
  );
}

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function NotificationPanel({ visible, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { notifications, unreadCount, loading, markRead, markAllRead, remove, clearAll } =
    useNotifications();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable
          style={[
            styles.panel,
            {
              backgroundColor: colors.background,
              borderColor: colors.border,
              marginTop: insets.top + 60,
            },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          {/* Panel header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Text style={[styles.title, { color: colors.foreground }]}>Notifications</Text>
            {unreadCount > 0 && (
              <View style={[styles.badge, { backgroundColor: colors.primary }]}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
            <View style={{ flex: 1 }} />
            {unreadCount > 0 && (
              <Pressable onPress={markAllRead} style={styles.headerAction}>
                <Text style={[styles.headerActionText, { color: colors.primary }]}>Mark all read</Text>
              </Pressable>
            )}
            {notifications.length > 0 && (
              <Pressable onPress={clearAll} style={styles.headerAction}>
                <Feather name="trash-2" size={14} color={colors.mutedForeground} />
              </Pressable>
            )}
            <Pressable onPress={onClose} style={styles.headerAction} hitSlop={8}>
              <Feather name="x" size={18} color={colors.foreground} />
            </Pressable>
          </View>

          {/* Content */}
          {loading && notifications.length === 0 ? (
            <View style={styles.center}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : notifications.length === 0 ? (
            <View style={styles.center}>
              <Feather name="bell-off" size={28} color={colors.mutedForeground} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                No notifications yet
              </Text>
              <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
                You'll see alerts here when your jobs finish.
              </Text>
            </View>
          ) : (
            <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
              {notifications.map((n) => (
                <NotifRow key={n.id} notif={n} onRead={markRead} onRemove={remove} />
              ))}
            </ScrollView>
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "#00000060",
    paddingHorizontal: 16,
  },
  panel: {
    borderRadius: 18,
    borderWidth: 1,
    maxHeight: 520,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  title: { fontSize: 16, fontFamily: "Inter_700Bold" },
  badge: {
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: "center",
  },
  badgeText: { fontSize: 11, fontFamily: "Inter_700Bold", color: "#fff" },
  headerAction: { padding: 4 },
  headerActionText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  list: { maxHeight: 420 },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 14,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  rowBody: { flex: 1, gap: 3 },
  rowTop: { flexDirection: "row", alignItems: "center", gap: 6 },
  rowTitle: { flex: 1, fontSize: 13, fontFamily: "Inter_600SemiBold" },
  unreadDot: { width: 7, height: 7, borderRadius: 4, flexShrink: 0 },
  rowBody2: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  rowTime: { fontSize: 11, fontFamily: "Inter_400Regular" },
  removeBtn: { padding: 4, marginTop: 2 },
  center: { alignItems: "center", gap: 10, paddingVertical: 40, paddingHorizontal: 24 },
  emptyText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  emptySub: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 18 },
});
