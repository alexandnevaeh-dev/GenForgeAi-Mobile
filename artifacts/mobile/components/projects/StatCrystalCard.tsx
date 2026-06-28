import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

interface StatCrystalCardProps {
  label: string;
  value: number;
  icon: React.ComponentProps<typeof Feather>["name"];
  accentColor: string;
  accentGradient: [string, string];
}

export function StatCrystalCard({ label, value, icon, accentColor, accentGradient }: StatCrystalCardProps) {
  const shimmerAnim = useRef(new Animated.Value(-60)).current;
  const mountOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(mountOpacity, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(2000),
        Animated.timing(shimmerAnim, { toValue: 160, duration: 700, useNativeDriver: true }),
        Animated.timing(shimmerAnim, { toValue: -60, duration: 0, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [shimmerAnim, mountOpacity]);

  return (
    <Animated.View style={[styles.wrap, { opacity: mountOpacity }]}>
      <LinearGradient colors={["#0E0C1E", "#0C0A1A"]} style={StyleSheet.absoluteFill} />
      {/* Accent tint */}
      <LinearGradient
        colors={[accentColor + "12", accentColor + "00"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.border} />
      {/* Shimmer sweep */}
      <Animated.View
        style={[styles.shimmer, { transform: [{ translateX: shimmerAnim }] }]}
        pointerEvents="none"
      >
        <LinearGradient
          colors={["rgba(255,255,255,0)", "rgba(255,255,255,0.06)", "rgba(255,255,255,0)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1 }}
        />
      </Animated.View>

      {/* Icon crystal */}
      <View style={[styles.iconWrap, { shadowColor: accentColor }]}>
        <LinearGradient colors={accentGradient} style={StyleSheet.absoluteFill} />
        <View style={[styles.iconBorder, { borderColor: accentColor + "40" }]} />
        <Feather name={icon} size={14} color={accentColor} style={{ shadowColor: accentColor, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.9, shadowRadius: 4, elevation: 2 }} />
      </View>

      <Text style={[styles.value, { color: accentColor }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 14,
    gap: 5,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(42,38,64,0.8)",
  },
  shimmer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 60,
  },
  iconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 3,
  },
  iconBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 8,
    borderWidth: 1,
  },
  value: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
  },
  label: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    color: "#3A3458",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
});
