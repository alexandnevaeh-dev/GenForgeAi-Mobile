import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

const DRAWER_WIDTH = 280;
const { width: SCREEN_WIDTH } = Dimensions.get("window");

interface DrawerItem {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  route?: string;
  badge?: number;
  accent?: boolean;
}

const TOP_ITEMS: DrawerItem[] = [
  { icon: "home", label: "Dashboard", route: "/(tabs)" },
  { icon: "message-square", label: "AI Studio", route: "/(tabs)/chat" },
  { icon: "folder", label: "Projects", route: "/(tabs)/projects" },
  { icon: "image", label: "Assets", route: "/(tabs)/assets" },
];

const BOTTOM_ITEMS: DrawerItem[] = [
  { icon: "shopping-bag", label: "Marketplace", route: "/marketplace" },
  { icon: "users", label: "Community", route: "/community" },
  { icon: "layout", label: "Templates", route: "/marketplace" },
  { icon: "bell", label: "Notifications", route: "/notifications", badge: 3 },
  { icon: "cloud", label: "Cloud Sync", route: "/cloud-sync" },
  { icon: "upload", label: "Export Center", route: "/export-center" },
  { icon: "bar-chart-2", label: "Analytics", route: "/analytics" },
  { icon: "help-circle", label: "Help Center", route: "/help" },
  { icon: "settings", label: "Settings", route: "/(tabs)/profile" },
  { icon: "message-circle", label: "Feedback", route: "/feedback" },
];

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function Drawer({ visible, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: 0,
          tension: 65,
          friction: 11,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0.55,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: -DRAWER_WIDTH,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, translateX, backdropOpacity]);

  const navigateTo = (route?: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onClose();
    if (route) {
      setTimeout(() => router.push(route as any), 220);
    }
  };

  function Item({ item }: { item: DrawerItem }) {
    return (
      <Pressable
        onPress={() => navigateTo(item.route)}
        style={[styles.item]}
      >
        <View style={[styles.itemIcon, { backgroundColor: item.accent ? colors.primary + "22" : colors.muted }]}>
          <Feather name={item.icon} size={17} color={item.accent ? colors.primary : colors.foreground} />
        </View>
        <Text style={[styles.itemLabel, { color: item.accent ? colors.primary : colors.foreground }]}>
          {item.label}
        </Text>
        {item.badge ? (
          <View style={[styles.badge, { backgroundColor: colors.primary }]}>
            <Text style={styles.badgeText}>{item.badge}</Text>
          </View>
        ) : null}
      </Pressable>
    );
  }

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <View style={StyleSheet.absoluteFill}>
        {/* Backdrop */}
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: backdropOpacity }]} />
        </TouchableWithoutFeedback>

        {/* Drawer Panel */}
        <Animated.View
          style={[
            styles.drawer,
            {
              backgroundColor: colors.card,
              paddingTop: insets.top + 16,
              paddingBottom: insets.bottom + 16,
              transform: [{ translateX }],
            },
          ]}
        >
          {/* Brand */}
          <View style={styles.brand}>
            <View style={[styles.brandIcon, { backgroundColor: colors.primary }]}>
              <Feather name="cpu" size={18} color="#fff" />
            </View>
            <View>
              <Text style={[styles.brandName, { color: colors.foreground }]}>
                GenForge<Text style={{ color: colors.primary }}>AI</Text>
              </Text>
              <Text style={[styles.brandVersion, { color: colors.mutedForeground }]}>v1.0 · Pro</Text>
            </View>
          </View>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Top items */}
          <Text style={[styles.groupLabel, { color: colors.mutedForeground }]}>WORKSPACE</Text>
          {TOP_ITEMS.map((item) => <Item key={item.label} item={item} />)}

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Bottom items */}
          <Text style={[styles.groupLabel, { color: colors.mutedForeground }]}>DISCOVER</Text>
          {BOTTOM_ITEMS.map((item) => <Item key={item.label} item={item} />)}

          {/* Footer */}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          <View style={styles.footer}>
            <View style={[styles.creditChip, { backgroundColor: colors.muted }]}>
              <Feather name="zap" size={12} color={colors.accent} />
              <Text style={[styles.creditText, { color: colors.foreground }]}>850 AI Credits</Text>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: "#000" },
  drawer: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    elevation: 24,
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    gap: 4,
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  brandIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  brandName: { fontSize: 18, fontFamily: "Inter_700Bold" },
  brandVersion: { fontSize: 11, fontFamily: "Inter_400Regular" },
  divider: { height: 1, marginVertical: 8, marginHorizontal: 16 },
  groupLabel: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
    paddingHorizontal: 16,
    marginBottom: 2,
    marginTop: 4,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 9,
  },
  itemIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  itemLabel: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium" },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  badgeText: { fontSize: 10, fontFamily: "Inter_700Bold", color: "#fff" },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  creditChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    alignSelf: "flex-start",
  },
  creditText: { fontSize: 13, fontFamily: "Inter_500Medium" },
});
