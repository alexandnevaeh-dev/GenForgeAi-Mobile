import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";

function FloatingCrystal() {
  const floatY = useRef(new Animated.Value(0)).current;
  const glow = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatY, { toValue: -10, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(floatY, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1500, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0.4, duration: 1500, useNativeDriver: true }),
      ])
    ).start();
  }, [floatY, glow]);

  return (
    <Animated.View style={[crystal.wrap, { transform: [{ translateY: floatY }] }]}>
      <Animated.View style={[crystal.glow, { opacity: glow }]} />
      <View style={crystal.gem}>
        <LinearGradient
          colors={["#2B7FFF", "#4B3FFF", "#7B2FFF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <LinearGradient
          colors={["rgba(255,255,255,0.35)", "rgba(255,255,255,0)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </View>
    </Animated.View>
  );
}

function ForgeButton({ onPress, label }: { onPress: () => void; label: string }) {
  const shimmerX = useRef(new Animated.Value(-100)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.03, duration: 1100, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 1100, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.delay(2000),
        Animated.timing(shimmerX, { toValue: 280, duration: 800, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(shimmerX, { toValue: -100, duration: 0, useNativeDriver: true }),
      ])
    ).start();
  }, [pulse, shimmerX]);

  return (
    <Animated.View style={[fb.wrap, { transform: [{ scale: pulse }] }]}>
      <Pressable
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onPress(); }}
        style={fb.btn}
      >
        <LinearGradient colors={["#1E4FBF", "#2B7FFF", "#4B3FFF"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        <LinearGradient colors={["rgba(255,255,255,0.22)", "rgba(255,255,255,0)"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        <View style={fb.border} />
        <Animated.View style={[fb.shimmer, { transform: [{ translateX: shimmerX }] }]} pointerEvents="none">
          <LinearGradient colors={["rgba(255,255,255,0)", "rgba(255,255,255,0.3)", "rgba(255,255,255,0)"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ flex: 1 }} />
        </Animated.View>
        <Feather name="zap" size={17} color="#AADCFF" />
        <Text style={fb.label}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

export type EmptyVariant = "empty" | "filtered" | "guest" | "error";

interface GalleryEmptyStateProps {
  variant: EmptyVariant;
  onGeneratePress?: () => void;
  errorMessage?: string;
  filterName?: string;
}

export function GalleryEmptyState({ variant, onGeneratePress, errorMessage, filterName }: GalleryEmptyStateProps) {
  if (variant === "guest") {
    return (
      <View style={s.guestWrap}>
        <LinearGradient colors={["#0E0C1E", "#0C0A1A"]} style={StyleSheet.absoluteFill} />
        <View style={s.guestBorder} />
        {/* Vault lock */}
        <View style={s.lockWrap}>
          <LinearGradient colors={["#0A0818", "#0E0C1E"]} style={StyleSheet.absoluteFill} />
          <View style={[s.lockBorder, { borderColor: "rgba(59,143,255,0.3)" }]} />
          <Feather name="lock" size={28} color="#3B8FFF" style={s.lockGlow} />
        </View>
        <Text style={s.guestTitle}>Arcane Vault Locked</Text>
        <Text style={s.guestBody}>Sign in to access your gallery and start generating game assets.</Text>
      </View>
    );
  }

  if (variant === "error") {
    return (
      <View style={s.errorWrap}>
        <LinearGradient colors={["#0E0C1E", "#0C0A1A"]} style={StyleSheet.absoluteFill} />
        <View style={s.errorBorder} />
        <Feather name="alert-circle" size={28} color="#EF4444" style={s.errorGlow} />
        <Text style={s.guestTitle}>Gallery Unreachable</Text>
        <Text style={s.guestBody}>{errorMessage ?? "Could not load assets. Pull down to try again."}</Text>
      </View>
    );
  }

  if (variant === "filtered") {
    return (
      <View style={s.filteredWrap}>
        <LinearGradient colors={["#0E0C1E", "#0C0A1A"]} style={StyleSheet.absoluteFill} />
        <View style={s.filteredBorder} />
        <View style={s.filteredGrid}>
          <View style={fg.v1} /><View style={fg.v2} />
          <View style={fg.h1} /><View style={fg.h2} />
        </View>
        <Feather name="image" size={28} color="#2A2448" />
        <Text style={s.filteredTitle}>No {filterName ?? "Assets"} Here</Text>
        <Text style={s.filteredBody}>Try a different category filter.</Text>
      </View>
    );
  }

  // "empty" — no assets at all
  return (
    <View style={s.emptyWrap}>
      {/* Pedestal */}
      <View style={s.pedestal}>
        <LinearGradient colors={["#12101E", "#0E0C1A"]} style={StyleSheet.absoluteFill} />
        <View style={s.pedestalBorder} />
        {/* Velvet top */}
        <View style={s.pedestalTop}>
          <LinearGradient colors={["#1A1440", "#1A1040"]} style={StyleSheet.absoluteFill} />
        </View>
        <FloatingCrystal />
      </View>

      <Text style={s.emptyTitle}>The Gallery Awaits</Text>
      <Text style={s.emptyBody}>No masterpieces have been created yet.{"\n"}Forge your first game asset.</Text>

      {onGeneratePress && (
        <ForgeButton onPress={onGeneratePress} label="Generate First Asset" />
      )}
    </View>
  );
}

const crystal = StyleSheet.create({
  wrap: {
    position: "absolute",
    top: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  glow: {
    position: "absolute",
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "rgba(59,143,255,0.3)",
    shadowColor: "#3B8FFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 15,
    elevation: 8,
  },
  gem: {
    width: 36,
    height: 36,
    borderRadius: 8,
    transform: [{ rotate: "45deg" }],
    overflow: "hidden",
    shadowColor: "#3B8FFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 6,
  },
});

const fb = StyleSheet.create({
  wrap: {
    shadowColor: "#3B8FFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 14,
    elevation: 8,
    marginTop: 4,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    paddingHorizontal: 22,
    paddingVertical: 13,
    borderRadius: 16,
    overflow: "hidden",
  },
  border: { ...StyleSheet.absoluteFillObject, borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.15)" },
  shimmer: { position: "absolute", top: 0, bottom: 0, width: 70 },
  label: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#D0E8FF" },
});

const fg = StyleSheet.create({
  v1: { position: "absolute", left: "33%", top: 0, bottom: 0, width: 1, backgroundColor: "rgba(59,143,255,0.05)" },
  v2: { position: "absolute", left: "66%", top: 0, bottom: 0, width: 1, backgroundColor: "rgba(59,143,255,0.05)" },
  h1: { position: "absolute", top: "33%", left: 0, right: 0, height: 1, backgroundColor: "rgba(59,143,255,0.05)" },
  h2: { position: "absolute", top: "66%", left: 0, right: 0, height: 1, backgroundColor: "rgba(59,143,255,0.05)" },
});

const s = StyleSheet.create({
  emptyWrap: { alignItems: "center", gap: 14, paddingTop: 8 },
  pedestal: {
    width: "100%",
    height: 180,
    borderRadius: 18,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "flex-end",
    shadowColor: "#3B8FFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 5,
  },
  pedestalBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(42,38,64,0.8)",
    borderStyle: "dashed" as any,
  },
  pedestalTop: {
    width: "60%",
    height: 14,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 12,
  },
  emptyTitle: { fontSize: 17, fontFamily: "Inter_700Bold", color: "#C0B8E0", textAlign: "center" },
  emptyBody: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#3A3458", textAlign: "center", lineHeight: 20 },

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
  guestBorder: { ...StyleSheet.absoluteFillObject, borderRadius: 18, borderWidth: 1, borderColor: "rgba(42,38,64,0.8)" },
  guestTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#C0B8E0", textAlign: "center" },
  guestBody: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#3A3458", textAlign: "center", lineHeight: 20 },

  lockWrap: {
    width: 56,
    height: 56,
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
  lockGlow: { shadowColor: "#3B8FFF", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 10, elevation: 5 },

  errorWrap: {
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
  errorBorder: { ...StyleSheet.absoluteFillObject, borderRadius: 18, borderWidth: 1, borderColor: "rgba(100,20,20,0.5)" },
  errorGlow: { shadowColor: "#EF4444", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 8, elevation: 4 },

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
  filteredBorder: { ...StyleSheet.absoluteFillObject, borderRadius: 16, borderWidth: 1, borderColor: "rgba(42,38,64,0.7)", borderStyle: "dashed" as any },
  filteredGrid: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0 },
  filteredTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#C0B8E0" },
  filteredBody: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#3A3458" },
});
