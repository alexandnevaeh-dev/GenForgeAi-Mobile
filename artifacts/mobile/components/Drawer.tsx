import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const DRAWER_WIDTH = 290;
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

function ForgeItem({ item, onNav }: { item: DrawerItem; onNav: (route?: string) => void }) {
  const pressScale = useRef(new Animated.Value(1)).current;

  return (
    <Pressable
      onPress={() => onNav(item.route)}
      onPressIn={() => Animated.spring(pressScale, { toValue: 0.96, useNativeDriver: true, tension: 80, friction: 6 }).start()}
      onPressOut={() => Animated.spring(pressScale, { toValue: 1, useNativeDriver: true, tension: 60, friction: 10 }).start()}
    >
      <Animated.View style={[styles.item, { transform: [{ scale: pressScale }] }]}>
        <View style={[styles.itemIcon, { backgroundColor: item.accent ? "rgba(59,143,255,0.2)" : "rgba(42,38,64,0.6)" }]}>
          <Feather
            name={item.icon}
            size={17}
            color={item.accent ? "#3B8FFF" : "#8888AA"}
          />
        </View>
        <Text style={[styles.itemLabel, { color: item.accent ? "#5BA8FF" : "#C0B8E0" }]}>
          {item.label}
        </Text>
        {item.badge ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.badge}</Text>
          </View>
        ) : null}
      </Animated.View>
    </Pressable>
  );
}

function GradientDivider() {
  return (
    <View style={styles.dividerWrap}>
      <LinearGradient
        colors={["rgba(255,179,71,0)", "rgba(255,179,71,0.3)", "rgba(255,179,71,0)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.dividerLine}
      />
    </View>
  );
}

export function Drawer({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const translateX = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateX, { toValue: 0, tension: 65, friction: 11, useNativeDriver: true }),
        Animated.timing(backdropOpacity, { toValue: 0.7, duration: 220, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateX, { toValue: -DRAWER_WIDTH, duration: 180, useNativeDriver: true }),
        Animated.timing(backdropOpacity, { toValue: 0, duration: 180, useNativeDriver: true }),
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

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={onClose}>
      <View style={StyleSheet.absoluteFill}>
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: backdropOpacity }]} />
        </TouchableWithoutFeedback>

        <Animated.View
          style={[
            styles.drawer,
            {
              paddingTop: insets.top + 16,
              paddingBottom: insets.bottom + 16,
              transform: [{ translateX }],
            },
          ]}
        >
          {/* Dark stone gradient background */}
          <LinearGradient
            colors={["#0E0B1E", "#110E24", "#0C0A18"]}
            style={StyleSheet.absoluteFill}
          />
          {/* Left gold accent bar */}
          <View style={styles.leftAccent}>
            <LinearGradient
              colors={["rgba(255,179,71,0)", "rgba(255,179,71,0.5)", "rgba(255,179,71,0.7)", "rgba(255,179,71,0.5)", "rgba(255,179,71,0)"]}
              locations={[0, 0.2, 0.5, 0.8, 1]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          </View>
          {/* Stone border overlay */}
          <View style={styles.stoneBorder} />

          {/* Brand */}
          <View style={styles.brand}>
            <View style={styles.brandIcon}>
              <LinearGradient colors={["#2B5FBF", "#1A3A8A"]} style={StyleSheet.absoluteFill} />
              <Feather name="cpu" size={20} color="#7BDBFF" style={styles.brandIconGlow} />
            </View>
            <View>
              <Text style={styles.brandName}>
                GenForge<Text style={styles.brandAI}>AI</Text>
              </Text>
              <Text style={styles.brandVersion}>v1.0  ·  The Forge</Text>
            </View>
          </View>

          <GradientDivider />

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
            <View style={styles.group}>
              <Text style={styles.groupLabel}>⚒  WORKSPACE</Text>
              {TOP_ITEMS.map((item) => <ForgeItem key={item.label} item={item} onNav={navigateTo} />)}
            </View>

            <GradientDivider />

            <View style={styles.group}>
              <Text style={styles.groupLabel}>✦  DISCOVER</Text>
              {BOTTOM_ITEMS.map((item) => <ForgeItem key={item.label} item={item} onNav={navigateTo} />)}
            </View>
          </ScrollView>

          <GradientDivider />

          {/* Footer — AI Credits crystal */}
          <View style={styles.footer}>
            <View style={styles.creditChip}>
              <LinearGradient
                colors={["rgba(0,229,255,0.12)", "rgba(0,229,255,0.06)"]}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.creditBorder} />
              <Feather name="zap" size={14} color="#00E5FF" style={styles.creditZapGlow} />
              <Text style={styles.creditText}>850 AI Credits</Text>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: "#050210" },
  drawer: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    elevation: 24,
    shadowColor: "#9B4BFF",
    shadowOffset: { width: 6, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    overflow: "hidden",
  },
  leftAccent: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 2,
    zIndex: 10,
  },
  stoneBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRightWidth: 1,
    borderColor: "rgba(42,38,64,0.8)",
  },
  brand: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  brandIcon: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(59,143,255,0.4)",
    shadowColor: "#3B8FFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 6,
  },
  brandIconGlow: {
    shadowColor: "#00E5FF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  brandName: {
    fontSize: 19,
    fontFamily: "Inter_700Bold",
    color: "#D0C8F0",
    letterSpacing: -0.3,
  },
  brandAI: {
    color: "#3B8FFF",
    textShadowColor: "rgba(59,143,255,0.8)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  brandVersion: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "#4A4468",
    marginTop: 1,
  },
  dividerWrap: {
    paddingHorizontal: 16,
    marginVertical: 6,
  },
  dividerLine: {
    height: 1,
  },
  scroll: {
    flex: 1,
  },
  group: {
    gap: 2,
    paddingVertical: 4,
  },
  groupLabel: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    color: "#C8922A",
    letterSpacing: 1.2,
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 4,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  itemIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(42,38,64,0.6)",
  },
  itemLabel: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  badge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#3B8FFF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
    shadowColor: "#3B8FFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
  badgeText: { fontSize: 10, fontFamily: "Inter_700Bold", color: "#fff" },
  footer: {
    paddingHorizontal: 18,
    paddingTop: 8,
  },
  creditChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    alignSelf: "flex-start",
    overflow: "hidden",
  },
  creditBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0,229,255,0.3)",
  },
  creditZapGlow: {
    shadowColor: "#00E5FF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 3,
  },
  creditText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "#A0F0FF",
  },
});
