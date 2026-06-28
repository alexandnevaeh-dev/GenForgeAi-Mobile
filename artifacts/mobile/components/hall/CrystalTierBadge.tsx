import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

const TIER_EMBLEMS: Record<
  string,
  {
    label: string;
    color: string;
    gradients: [string, string];
    icon: React.ComponentProps<typeof Feather>["name"];
  }
> = {
  guest:      { label: "Guest",      color: "#6B6B80", gradients: ["#1A1A22", "#141418"], icon: "user" },
  free:       { label: "Free",       color: "#CD7F32", gradients: ["#3D2A0E", "#2A1A08"], icon: "user" },
  pro:        { label: "Pro",        color: "#2B7FFF", gradients: ["#1A3A8A", "#0D2050"], icon: "zap" },
  studio:     { label: "Studio",     color: "#7B2FFF", gradients: ["#3A1A8A", "#200D50"], icon: "layers" },
  enterprise: { label: "Enterprise", color: "#F97316", gradients: ["#5A2500", "#3A1800"], icon: "globe" },
};

interface CrystalTierBadgeProps {
  tier: string;
}

export function CrystalTierBadge({ tier }: CrystalTierBadgeProps) {
  const emblem = TIER_EMBLEMS[tier] ?? TIER_EMBLEMS.free;
  const glow = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1600, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0.3, duration: 1600, useNativeDriver: true }),
      ])
    ).start();
  }, [glow]);

  return (
    <Animated.View style={[styles.wrap, { shadowColor: emblem.color, opacity: glow.interpolate({ inputRange: [0.3, 1], outputRange: [0.85, 1] }) }]}>
      <LinearGradient colors={emblem.gradients} style={StyleSheet.absoluteFill} />
      <View style={[styles.border, { borderColor: emblem.color + "55" }]} />
      <Animated.View style={[styles.glowOverlay, { backgroundColor: emblem.color, opacity: glow.interpolate({ inputRange: [0.3, 1], outputRange: [0, 0.06] }) }]} />
      <Feather name={emblem.icon} size={12} color={emblem.color} style={styles.icon} />
      <Text style={[styles.label, { color: emblem.color }]}>
        {emblem.label.toUpperCase()} TIER
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 5,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 10,
    borderWidth: 1,
  },
  glowOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 10,
  },
  icon: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 5,
    elevation: 3,
  },
  label: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 0.9 },
});
