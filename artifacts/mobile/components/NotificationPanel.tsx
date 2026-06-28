import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useNotifications, type AppNotification } from "@/context/NotificationsContext";

const TYPE_META: Record<string, { icon: string; color: string }> = {
  job_completed:       { icon: "check-circle", color: "#10B981" },
  job_failed:          { icon: "alert-circle", color: "#DC2626" },
  generation_complete: { icon: "zap",          color: "#3B8FFF" },
  generation_failed:   { icon: "alert-circle", color: "#DC2626" },
  system:              { icon: "info",          color: "#F59E0B" },
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

function NotifRow({ notif, onRead, onRemove, index }: {
  notif: AppNotification;
  onRead: (id: string) => void;
  onRemove: (id: string) => void;
  index: number;
}) {
  const mountAnim = useRef(new Animated.Value(0)).current;
  const meta = TYPE_META[notif.type] ?? TYPE_META.system;

  useEffect(() => {
    Animated.timing(mountAnim, {
      toValue: 1,
      duration: 350,
      delay: index * 60,
      useNativeDriver: true,
    }).start();
  }, [mountAnim, index]);

  return (
    <Animated.View style={{ opacity: mountAnim }}>
      <Pressable
        onPress={() => { if (!notif.isRead) onRead(notif.id); }}
        style={[
          styles.row,
          !notif.isRead && styles.rowUnread,
        ]}
      >
        {!notif.isRead && <View style={styles.unreadBar} />}
        <View style={[styles.iconWrap, { backgroundColor: meta.color + "20" }]}>
          <Feather
            name={meta.icon as any}
            size={16}
            color={meta.color}
            style={{ shadowColor: meta.color, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 6 }}
          />
        </View>
        <View style={styles.rowBody}>
          <View style={styles.rowTop}>
            <Text style={styles.rowTitle} numberOfLines={1}>{notif.title}</Text>
            {!notif.isRead && <View style={[styles.unreadDot, { backgroundColor: "#3B8FFF", shadowColor: "#3B8FFF" }]} />}
          </View>
          <Text style={styles.rowMsg} numberOfLines={2}>{notif.body}</Text>
          <Text style={styles.rowTime}>{timeAgo(notif.createdAt)}</Text>
        </View>
        <Pressable onPress={() => onRemove(notif.id)} style={styles.removeBtn} hitSlop={8}>
          <Feather name="x" size={14} color="#4A4468" />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function NotificationPanel({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { notifications, unreadCount, loading, markRead, markAllRead, remove, clearAll } = useNotifications();
  const slideAnim = useRef(new Animated.Value(-20)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const isIOS = Platform.OS === "ios";

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: -16, duration: 160, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0, duration: 160, useNativeDriver: true }),
      ]).start();
    }
  }, [visible, slideAnim, fadeAnim]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Animated.View
          style={[
            styles.panel,
            { marginTop: insets.top + 56, transform: [{ translateY: slideAnim }], opacity: fadeAnim },
          ]}
          onStartShouldSetResponder={() => true}
        >
          {isIOS ? (
            <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill} />
          ) : (
            <LinearGradient
              colors={["#0E0C1E", "#12101C"]}
              style={StyleSheet.absoluteFill}
            />
          )}
          <View style={styles.panelBorder} />

          {/* Header */}
          <View style={styles.header}>
            <LinearGradient
              colors={["rgba(59,143,255,0.06)", "rgba(59,143,255,0)"]}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.headerTitle}>Notifications</Text>
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
            <View style={{ flex: 1 }} />
            {unreadCount > 0 && (
              <Pressable onPress={markAllRead} style={styles.headerAction}>
                <Text style={styles.headerActionText}>Mark all read</Text>
              </Pressable>
            )}
            {notifications.length > 0 && (
              <Pressable onPress={clearAll} style={styles.headerAction}>
                <Feather name="trash-2" size={14} color="#4A4468" />
              </Pressable>
            )}
            <Pressable onPress={onClose} style={styles.headerAction} hitSlop={8}>
              <Feather name="x" size={18} color="#8888AA" />
            </Pressable>
          </View>
          <View style={styles.headerDivider} />

          {/* Content */}
          {loading && notifications.length === 0 ? (
            <View style={styles.center}>
              <ActivityIndicator color="#3B8FFF" />
            </View>
          ) : notifications.length === 0 ? (
            <View style={styles.center}>
              <Feather name="bell-off" size={28} color="#2A2448" />
              <Text style={styles.emptyTitle}>No notifications yet</Text>
              <Text style={styles.emptySub}>You'll see alerts here when your jobs finish.</Text>
            </View>
          ) : (
            <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
              {notifications.map((n, i) => (
                <NotifRow key={n.id} notif={n} onRead={markRead} onRemove={remove} index={i} />
              ))}
            </ScrollView>
          )}
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(5,2,16,0.75)",
    paddingHorizontal: 16,
  },
  panel: {
    borderRadius: 20,
    maxHeight: 540,
    overflow: "hidden",
    shadowColor: "#9B4BFF",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 24,
    elevation: 24,
  },
  panelBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(42,38,64,0.9)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
    overflow: "hidden",
  },
  headerTitle: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#D0C8F0",
  },
  badge: {
    borderRadius: 10,
    paddingHorizontal: 7,
    paddingVertical: 2,
    minWidth: 22,
    alignItems: "center",
    backgroundColor: "#3B8FFF",
    shadowColor: "#3B8FFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 6,
    elevation: 3,
  },
  badgeText: { fontSize: 11, fontFamily: "Inter_700Bold", color: "#fff" },
  headerAction: { padding: 4 },
  headerActionText: { fontSize: 12, fontFamily: "Inter_500Medium", color: "#5BA8FF" },
  headerDivider: {
    height: 1,
    backgroundColor: "rgba(42,38,64,0.8)",
    marginHorizontal: 0,
  },
  list: { maxHeight: 440 },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 14,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(42,38,64,0.6)",
    position: "relative",
    overflow: "hidden",
  },
  rowUnread: {
    backgroundColor: "rgba(59,143,255,0.05)",
  },
  unreadBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: "#3B8FFF",
    shadowColor: "#3B8FFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
    elevation: 3,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    borderWidth: 1,
    borderColor: "rgba(42,38,64,0.6)",
  },
  rowBody: { flex: 1, gap: 3 },
  rowTop: { flexDirection: "row", alignItems: "center", gap: 6 },
  rowTitle: { flex: 1, fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#C0B8E0" },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    flexShrink: 0,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
    elevation: 2,
  },
  rowMsg: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#5A5478", lineHeight: 17 },
  rowTime: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#3A3458" },
  removeBtn: { padding: 4, marginTop: 2 },
  center: { alignItems: "center", gap: 10, paddingVertical: 40, paddingHorizontal: 24 },
  emptyTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#2A2448" },
  emptySub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#1E1A38", textAlign: "center", lineHeight: 18 },
});
