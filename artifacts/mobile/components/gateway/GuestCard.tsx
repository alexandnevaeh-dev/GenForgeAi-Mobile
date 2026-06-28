import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import React, { useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

interface GuestCardProps {
  onPress: () => void;
}

const BENEFITS = [
  { icon: "zap" as const,     text: "10 free AI credits" },
  { icon: "eye" as const,     text: "Browse templates" },
  { icon: "clock" as const,   text: "No account required" },
];

export function GuestCard({ onPress }: GuestCardProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, tension: 100, friction: 8 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 60, friction: 10 }).start();
  };
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Animated.View style={[s.wrap, { transform: [{ scale }] }]}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={s.card}
      >
        <LinearGradient colors={["#0C0A18", "#0A0814"]} style={StyleSheet.absoluteFill} />
        <View style={s.border} />

        <View style={s.headerRow}>
          <View style={s.iconWrap}>
            <LinearGradient colors={["#1A1830", "#2A2448"]} style={StyleSheet.absoluteFill} />
            <Feather name="user" size={14} color="#5A5478" />
          </View>
          <View style={s.headerText}>
            <Text style={s.title}>Continue as Guest</Text>
            <Text style={s.sub}>Explore without committing</Text>
          </View>
          <View style={s.portalBtn}>
            <LinearGradient colors={["#1A2A48", "#1E3460"]} style={StyleSheet.absoluteFill} />
            <Feather name="log-in" size={14} color="#5A88C0" />
          </View>
        </View>

        <View style={s.benefits}>
          {BENEFITS.map((b) => (
            <View key={b.text} style={s.benefitRow}>
              <View style={s.benefitDot}>
                <Feather name={b.icon} size={10} color="#3A3458" />
              </View>
              <Text style={s.benefitText}>{b.text}</Text>
            </View>
          ))}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  wrap: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  card: {
    borderRadius: 16,
    padding: 14,
    gap: 10,
    overflow: "hidden",
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(42,38,64,0.6)",
  },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(42,38,64,0.8)",
  },
  headerText: { flex: 1 },
  title: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#8A8480" },
  sub: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#3A3458" },
  portalBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(42,58,80,0.6)",
  },
  benefits: { flexDirection: "row", gap: 12 },
  benefitRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  benefitDot: { width: 16, height: 16, alignItems: "center", justifyContent: "center" },
  benefitText: { fontSize: 10, fontFamily: "Inter_400Regular", color: "#2A2448" },
});
