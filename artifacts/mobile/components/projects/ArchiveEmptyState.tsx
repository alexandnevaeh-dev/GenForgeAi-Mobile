import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";

function FloatingQuill() {
  const floatY = useRef(new Animated.Value(0)).current;
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, { toValue: -8, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(floatY, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(rotate, { toValue: 1, duration: 4000, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(rotate, { toValue: -1, duration: 4000, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    ).start();
  }, [floatY, rotate]);

  const rot = rotate.interpolate({ inputRange: [-1, 1], outputRange: ["-12deg", "12deg"] });

  return (
    <Animated.View style={[empty.quill, { transform: [{ translateY: floatY }, { rotate: rot }] }]}>
      <Feather name="edit-3" size={28} color="#C8922A" style={empty.quillGlow} />
    </Animated.View>
  );
}

function GlowingForgeButton({ onPress }: { onPress: () => void }) {
  const pulse = useRef(new Animated.Value(1)).current;
  const shimmerX = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.04, duration: 1000, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.delay(1500),
        Animated.timing(shimmerX, { toValue: 300, duration: 900, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(shimmerX, { toValue: -100, duration: 0, useNativeDriver: true }),
      ])
    ).start();
  }, [pulse, shimmerX]);

  return (
    <Animated.View style={[forge.wrap, { transform: [{ scale: pulse }] }]}>
      <Pressable
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onPress(); }}
        style={forge.pressable}
      >
        <LinearGradient colors={["#1E4FBF", "#2B7FFF", "#4B3FFF"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        <LinearGradient colors={["rgba(255,255,255,0.2)", "rgba(255,255,255,0)"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        <View style={forge.border} />
        {/* Shimmer */}
        <Animated.View style={[forge.shimmer, { transform: [{ translateX: shimmerX }] }]} pointerEvents="none">
          <LinearGradient colors={["rgba(255,255,255,0)", "rgba(255,255,255,0.35)", "rgba(255,255,255,0)"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1 }} />
        </Animated.View>
        <Feather name="zap" size={18} color="#AADCFF" />
        <Text style={forge.label}>Forge Your First Game</Text>
      </Pressable>
    </Animated.View>
  );
}

interface ArchiveEmptyStateProps {
  hasSearch: boolean;
  searchQuery: string;
}

export function ArchiveEmptyState({ hasSearch, searchQuery }: ArchiveEmptyStateProps) {
  if (hasSearch) {
    return (
      <View style={empty.searchWrap}>
        <LinearGradient colors={["#0E0C1E", "#0C0A1A"]} style={StyleSheet.absoluteFill} />
        <View style={empty.searchBorder} />
        <View style={empty.searchGrid}>
          <View style={empty.gridH} /><View style={empty.gridH2} />
          <View style={empty.gridV} /><View style={empty.gridV2} />
        </View>
        <Feather name="search" size={32} color="#2A2448" />
        <Text style={empty.searchTitle}>No archives found</Text>
        <Text style={empty.searchSub}>No records match "{searchQuery}"</Text>
      </View>
    );
  }

  return (
    <View style={empty.wrap}>
      {/* Blueprint table */}
      <View style={empty.table}>
        <LinearGradient colors={["#080618", "#0C0A20", "#090716"]} style={StyleSheet.absoluteFill} />
        <View style={empty.tableBorder} />
        {/* Grid lines */}
        {[20, 40, 60, 80].map((pct) => (
          <View key={`v${pct}`} style={[empty.gridLine, { left: `${pct}%` as any, top: 0, bottom: 0, width: 1 }]} />
        ))}
        {[25, 50, 75].map((pct) => (
          <View key={`h${pct}`} style={[empty.gridLine, { top: `${pct}%` as any, left: 0, right: 0, height: 1 }]} />
        ))}

        {/* Crystal lamp */}
        <View style={empty.lamp}>
          <LinearGradient colors={["#3B8FFF33", "#3B8FFF00"]} style={empty.lampBeam} />
          <Feather name="sun" size={22} color="#5BA8FF" style={empty.lampGlow} />
        </View>

        {/* Rolled parchment */}
        <View style={empty.parchment}>
          <LinearGradient colors={["#2A1E08", "#1E1508"]} style={StyleSheet.absoluteFill} />
          <View style={empty.parchmentBorder} />
          <Text style={empty.parchmentText}>~ Awaiting First Blueprint ~</Text>
        </View>

        {/* Floating quill */}
        <FloatingQuill />
      </View>

      <Text style={empty.title}>The Archives Are Empty</Text>
      <Text style={empty.subtitle}>No blueprints have been forged yet.{"\n"}Begin your first creation.</Text>

      <GlowingForgeButton onPress={() => router.push("/new-game")} />
    </View>
  );
}

const empty = StyleSheet.create({
  wrap: { alignItems: "center", gap: 16, paddingVertical: 8 },
  table: {
    width: "100%",
    height: 200,
    borderRadius: 18,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#3B8FFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5,
  },
  tableBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(59,143,255,0.15)",
    borderStyle: "dashed" as any,
  },
  gridLine: { position: "absolute", backgroundColor: "rgba(59,143,255,0.05)" },

  lamp: { position: "absolute", top: 10, right: 24, alignItems: "center" },
  lampBeam: { width: 30, height: 70, position: "absolute", top: 22, opacity: 0.4 },
  lampGlow: { shadowColor: "#5BA8FF", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 12, elevation: 5 },

  parchment: {
    width: 180,
    height: 60,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    transform: [{ rotate: "-2deg" }],
    shadowColor: "#8B6030",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  parchmentBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#4A3010",
  },
  parchmentText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: "#6B4A20",
    letterSpacing: 0.5,
  },

  quill: {
    position: "absolute",
    top: 20,
    left: 28,
  },
  quillGlow: {
    shadowColor: "#C8922A",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 4,
  },

  title: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: "#C0B8E0",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#3A3458",
    textAlign: "center",
    lineHeight: 20,
  },

  // Search empty state
  searchWrap: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 40,
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  searchBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(42,38,64,0.7)",
    borderStyle: "dashed" as any,
  },
  searchGrid: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  gridH: { position: "absolute", top: "33%", left: 0, right: 0, height: 1, backgroundColor: "rgba(59,143,255,0.04)" },
  gridH2: { position: "absolute", top: "66%", left: 0, right: 0, height: 1, backgroundColor: "rgba(59,143,255,0.04)" },
  gridV: { position: "absolute", left: "33%", top: 0, bottom: 0, width: 1, backgroundColor: "rgba(59,143,255,0.04)" },
  gridV2: { position: "absolute", left: "66%", top: 0, bottom: 0, width: 1, backgroundColor: "rgba(59,143,255,0.04)" },

  searchTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#C0B8E0" },
  searchSub: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#3A3458" },
});

const forge = StyleSheet.create({
  wrap: {
    shadowColor: "#3B8FFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 8,
    marginTop: 4,
  },
  pressable: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 22,
    paddingVertical: 14,
    borderRadius: 16,
    overflow: "hidden",
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  shimmer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 80,
  },
  label: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#D0E8FF",
  },
});
