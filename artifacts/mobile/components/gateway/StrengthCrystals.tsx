import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

interface StrengthCrystalsProps {
  password: string;
}

function getLevel(len: number) {
  if (len === 0) return 0;
  if (len < 4)  return 1;
  if (len < 8)  return 2;
  if (len < 12) return 3;
  return 4;
}

function getLabel(len: number): string {
  if (len === 0)  return "";
  if (len < 8)    return "Too short";
  if (len < 12)   return "Good";
  return "Strong";
}

const CRYSTAL_COLORS: Record<number, [string, string]> = {
  0: ["#1A1828", "#2A2448"],
  1: ["#4A1810", "#7A2A20"],
  2: ["#4A3010", "#8A5A20"],
  3: ["#0A3A20", "#1A6A40"],
  4: ["#1A1060", "#2B2FAA"],
};

const GLOW_COLORS = ["transparent", "#FF4444", "#F97316", "#22C55E", "#7B2FFF"];

interface CrystalGemProps {
  active: boolean;
  level: number;
  index: number;
}

function CrystalGem({ active, level, index }: CrystalGemProps) {
  const scale = useRef(new Animated.Value(active ? 1 : 0.75)).current;
  const glowOpacity = useRef(new Animated.Value(active ? 1 : 0)).current;

  useEffect(() => {
    if (active) {
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, tension: 80, friction: 7, useNativeDriver: true }),
        Animated.timing(glowOpacity, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(scale, { toValue: 0.75, tension: 80, friction: 7, useNativeDriver: true }),
        Animated.timing(glowOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    }
  }, [active, scale, glowOpacity]);

  const gradColors = active ? CRYSTAL_COLORS[level] ?? CRYSTAL_COLORS[0] : CRYSTAL_COLORS[0];
  const glowColor = active ? GLOW_COLORS[level] ?? "transparent" : "transparent";

  return (
    <Animated.View
      style={[
        s.gem,
        {
          transform: [{ scale }],
          shadowColor: glowColor,
          shadowOpacity: active ? 0.8 : 0,
        },
      ]}
    >
      <LinearGradient
        colors={gradColors as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={[s.gemBorder, { borderColor: active ? glowColor : "rgba(42,38,64,0.6)" }]} />
      <Animated.View style={[s.gemGlow, { opacity: glowOpacity, backgroundColor: glowColor }]} />
      {/* Facet highlight */}
      <View style={s.facet} />
    </Animated.View>
  );
}

export function StrengthCrystals({ password }: StrengthCrystalsProps) {
  const level = getLevel(password.length);
  const label = getLabel(password.length);

  if (password.length === 0) return null;

  return (
    <View style={s.wrap}>
      <View style={s.gems}>
        {[1, 2, 3, 4].map((i) => (
          <CrystalGem key={i} active={i <= level} level={level} index={i} />
        ))}
      </View>
      {label ? <Text style={[s.label, { color: level >= 4 ? "#7B2FFF" : level >= 3 ? "#22C55E" : level >= 2 ? "#F97316" : "#FF6644" }]}>{label}</Text> : null}
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: -4 },
  gems: { flexDirection: "row", gap: 6 },
  gem: {
    width: 18,
    height: 18,
    borderRadius: 3,
    transform: [{ rotate: "45deg" }],
    overflow: "hidden",
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 6,
    elevation: 4,
  },
  gemBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 3,
    borderWidth: 1,
  },
  gemGlow: {
    position: "absolute",
    top: "60%",
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.25,
    borderRadius: 3,
  },
  facet: {
    position: "absolute",
    top: 2,
    left: 2,
    width: 5,
    height: 5,
    borderRadius: 1,
    backgroundColor: "rgba(255,255,255,0.15)",
    transform: [{ rotate: "-45deg" }],
  },
  label: { fontSize: 11, fontFamily: "Inter_500Medium" },
});
