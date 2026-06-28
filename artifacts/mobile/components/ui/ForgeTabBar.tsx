import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { theme } from "@/constants/theme";

type FeatherIconName = React.ComponentProps<typeof Feather>["name"];

const TABS: Array<{ name: string; label: string; icon: FeatherIconName }> = [
  { name: "index", label: "Home", icon: "home" },
  { name: "chat", label: "AI Chat", icon: "message-square" },
  { name: "projects", label: "Projects", icon: "folder" },
  { name: "assets", label: "Assets", icon: "image" },
  { name: "jobs", label: "Jobs", icon: "cpu" },
  { name: "profile", label: "Profile", icon: "user" },
];

const ACTIVE_COLOR = "#3B8FFF";
const INACTIVE_COLOR = "#4A4660";
const INDICATOR_COLOR = "#3B8FFF";
const TAB_BAR_HEIGHT = 68;

interface ForgeTabBarProps {
  state: {
    index: number;
    routes: Array<{ key: string; name: string }>;
  };
  navigation: {
    navigate: (name: string) => void;
    emit: (opts: {
      type: string;
      target?: string;
      canPreventDefault?: boolean;
    }) => { defaultPrevented: boolean };
  };
  descriptors: Record<string, { options: { href?: string | null } }>;
}

export function ForgeTabBar({ state, navigation, descriptors }: ForgeTabBarProps) {
  const insets = useSafeAreaInsets();
  const isIOS = Platform.OS === "ios";

  const scales = useRef(TABS.map((_, i) => new Animated.Value(i === 0 ? 1.18 : 1))).current;
  const indicatorOpacities = useRef(TABS.map((_, i) => new Animated.Value(i === 0 ? 1 : 0))).current;
  const labelOpacities = useRef(TABS.map((_, i) => new Animated.Value(i === 0 ? 1 : 0.55))).current;

  useEffect(() => {
    const active = state.index;
    TABS.forEach((_, i) => {
      const isActive = i === active;
      Animated.spring(scales[i], {
        toValue: isActive ? 1.18 : 1,
        useNativeDriver: true,
        ...theme.animation.springBouncy,
      }).start();
      Animated.timing(indicatorOpacities[i], {
        toValue: isActive ? 1 : 0,
        duration: theme.animation.normal,
        useNativeDriver: true,
      }).start();
      Animated.timing(labelOpacities[i], {
        toValue: isActive ? 1 : 0.55,
        duration: theme.animation.normal,
        useNativeDriver: true,
      }).start();
    });
  }, [state.index]);

  const totalHeight = TAB_BAR_HEIGHT + insets.bottom;

  const handlePress = (route: { key: string; name: string }) => {
    const event = navigation.emit({
      type: "tabPress",
      target: route.key,
      canPreventDefault: true,
    });
    if (!event.defaultPrevented) {
      navigation.navigate(route.name);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const renderBackground = () => {
    if (isIOS) {
      return (
        <BlurView
          intensity={70}
          tint="dark"
          style={[StyleSheet.absoluteFill, styles.blurContainer]}
        />
      );
    }
    return (
      <View
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: "rgba(13,11,28,0.97)" },
        ]}
      />
    );
  };

  return (
    <View style={[styles.container, { height: totalHeight }]}>
      {renderBackground()}

      {/* Top border glow line */}
      <LinearGradient
        colors={["rgba(59,143,255,0.0)", "rgba(59,143,255,0.35)", "rgba(155,75,255,0.35)", "rgba(155,75,255,0.0)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.topBorder}
        pointerEvents="none"
      />

      <View style={[styles.tabRow, { paddingBottom: insets.bottom }]}>
        {TABS.map((tab, i) => {
          const route = state.routes[i];
          if (!route) return null;

          const descriptor = descriptors[route.key];
          if (descriptor?.options?.href === null) return null;

          const isActive = state.index === i;

          return (
            <Pressable
              key={tab.name}
              onPress={() => handlePress(route)}
              style={styles.tabItem}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={tab.label}
            >
              {/* Active indicator bar */}
              <Animated.View
                style={[
                  styles.indicator,
                  {
                    opacity: indicatorOpacities[i],
                    shadowColor: INDICATOR_COLOR,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 1,
                    shadowRadius: 8,
                    elevation: 4,
                  },
                ]}
              />

              {/* Icon with scale */}
              <Animated.View
                style={[
                  styles.iconWrap,
                  { transform: [{ scale: scales[i] }] },
                  isActive && {
                    shadowColor: ACTIVE_COLOR,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: 0.75,
                    shadowRadius: 10,
                    elevation: 4,
                  },
                ]}
              >
                <Feather
                  name={tab.icon}
                  size={22}
                  color={isActive ? ACTIVE_COLOR : INACTIVE_COLOR}
                />
              </Animated.View>

              {/* Label */}
              <Animated.Text
                style={[
                  styles.label,
                  {
                    color: isActive ? ACTIVE_COLOR : INACTIVE_COLOR,
                    opacity: labelOpacities[i],
                  },
                ]}
                numberOfLines={1}
              >
                {tab.label}
              </Animated.Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    shadowColor: "#9B4BFF",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.22,
    shadowRadius: 20,
    elevation: 20,
  },
  blurContainer: {
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  topBorder: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
  },
  tabRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-start",
    paddingTop: 8,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    gap: 3,
    paddingTop: 4,
    minHeight: 52,
  },
  indicator: {
    width: 24,
    height: 3,
    borderRadius: 2,
    backgroundColor: INDICATOR_COLOR,
    marginBottom: 2,
  },
  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
    width: 28,
    height: 28,
  },
  label: {
    fontSize: 9.5,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
    letterSpacing: 0.2,
  },
});
