import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";

function DormantCore() {
  const ringRotate = useRef(new Animated.Value(0)).current;
  const corePulse = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(ringRotate, { toValue: 1, duration: 12000, easing: Easing.linear, useNativeDriver: true })
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(corePulse, { toValue: 0.6, duration: 2500, useNativeDriver: true }),
        Animated.timing(corePulse, { toValue: 0.2, duration: 2500, useNativeDriver: true }),
      ])
    ).start();
  }, [ringRotate, corePulse]);

  const spin = ringRotate.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  return (
    <View style={core.wrap}>
      {/* Outer ring */}
      <Animated.View style={[core.ring3, { transform: [{ rotate: spin }] }]} />
      {/* Middle ring */}
      <Animated.View style={[core.ring2, { opacity: 0.5 }]} />
      {/* Inner core */}
      <Animated.View style={[core.inner, { opacity: corePulse }]}>
        <Feather name="cpu" size={28} color="#2A2448" />
      </Animated.View>

      {/* Inactive crystal nodes around the core */}
      {[0, 60, 120, 180, 240, 300].map((deg) => {
        const rad = (deg * Math.PI) / 180;
        const r = 52;
        return (
          <View
            key={deg}
            style={[
              core.crystalNode,
              {
                transform: [
                  { translateX: Math.cos(rad) * r - 4 },
                  { translateY: Math.sin(rad) * r - 4 },
                ],
              },
            ]}
          />
        );
      })}
    </View>
  );
}

export type NexusEmptyVariant = "empty" | "filtered" | "guest" | "error";

interface NexusEmptyStateProps {
  variant: NexusEmptyVariant;
  errorMessage?: string;
  filterLabel?: string;
  onCreatePress?: () => void;
}

export function NexusEmptyState({ variant, errorMessage, filterLabel, onCreatePress }: NexusEmptyStateProps) {
  if (variant === "guest") {
    return (
      <View style={s.guestWrap}>
        <LinearGradient colors={["#0E0C1E", "#0C0A1A"]} style={StyleSheet.absoluteFill} />
        <View style={s.guestBorder} />
        <View style={s.lockWrap}>
          <LinearGradient colors={["#0A0818", "#0E0C1E"]} style={StyleSheet.absoluteFill} />
          <View style={[s.lockBorder, { borderColor: "rgba(59,143,255,0.3)" }]} />
          <Feather name="lock" size={26} color="#3B8FFF" style={s.lockGlow} />
        </View>
        <Text style={s.title}>Command Center Locked</Text>
        <Text style={s.body}>Sign in to monitor your AI generation pipelines and manage background jobs.</Text>
      </View>
    );
  }

  if (variant === "error") {
    return (
      <View style={s.guestWrap}>
        <LinearGradient colors={["#0E0C1E", "#0C0A1A"]} style={StyleSheet.absoluteFill} />
        <View style={[s.guestBorder, { borderColor: "rgba(100,20,20,0.5)" }]} />
        <Feather name="alert-circle" size={28} color="#EF4444" style={s.errorGlow} />
        <Text style={s.title}>Nexus Unreachable</Text>
        <Text style={s.body}>{errorMessage ?? "Could not load jobs. Pull down to try again."}</Text>
      </View>
    );
  }

  if (variant === "filtered") {
    return (
      <View style={s.filteredWrap}>
        <LinearGradient colors={["#0E0C1E", "#0C0A1A"]} style={StyleSheet.absoluteFill} />
        <View style={s.filteredBorder} />
        <Feather name="filter" size={24} color="#2A2448" />
        <Text style={s.title}>No {filterLabel ?? "Jobs"} Here</Text>
        <Text style={s.body}>Try a different filter to see your jobs.</Text>
      </View>
    );
  }

  // "empty" — dormant core
  return (
    <View style={s.emptyWrap}>
      <DormantCore />
      <Text style={s.emptyTitle}>AI Core Dormant</Text>
      <Text style={s.emptyBody}>
        No active AI operations.{"\n"}Start creating a game to activate the nexus.
      </Text>
      {onCreatePress && (
        <Pressable
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onCreatePress(); }}
          style={s.ctaBtn}
        >
          <LinearGradient colors={["#1E4FBF", "#2B7FFF"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
          <LinearGradient colors={["rgba(255,255,255,0.18)", "rgba(255,255,255,0)"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
          <View style={s.ctaBorder} />
          <Feather name="zap" size={16} color="#AADCFF" />
          <Text style={s.ctaLabel}>Start Creating a Game</Text>
        </Pressable>
      )}
    </View>
  );
}

const core = StyleSheet.create({
  wrap: {
    width: 140,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
  },
  ring3: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 1,
    borderColor: "rgba(42,38,64,0.4)",
    borderStyle: "dashed" as any,
  },
  ring2: {
    position: "absolute",
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 1,
    borderColor: "rgba(42,38,64,0.5)",
  },
  inner: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#0E0C1E",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(42,38,64,0.6)",
  },
  crystalNode: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 2,
    backgroundColor: "#2A2448",
    transform: [{ rotate: "45deg" }],
  },
});

const s = StyleSheet.create({
  emptyWrap: { alignItems: "center", gap: 16, paddingVertical: 24 },
  emptyTitle: { fontSize: 17, fontFamily: "Inter_700Bold", color: "#3A3458", textAlign: "center" },
  emptyBody: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#2A2448", textAlign: "center", lineHeight: 20 },

  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#3B8FFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
    marginTop: 4,
  },
  ctaBorder: { ...StyleSheet.absoluteFillObject, borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.12)" },
  ctaLabel: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#D0E8FF" },

  guestWrap: {
    borderRadius: 18,
    overflow: "hidden",
    padding: 36,
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  guestBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(42,38,64,0.8)",
  },
  lockWrap: {
    width: 54,
    height: 54,
    borderRadius: 14,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#3B8FFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
  lockBorder: { ...StyleSheet.absoluteFillObject, borderRadius: 14, borderWidth: 1 },
  lockGlow: {
    shadowColor: "#3B8FFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 10,
    elevation: 5,
  },
  title: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#C0B8E0", textAlign: "center" },
  body: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#3A3458", textAlign: "center", lineHeight: 20 },

  errorGlow: {
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 4,
  },

  filteredWrap: {
    borderRadius: 16,
    overflow: "hidden",
    paddingVertical: 48,
    alignItems: "center",
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  filteredBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(42,38,64,0.7)",
    borderStyle: "dashed" as any,
  },
});
