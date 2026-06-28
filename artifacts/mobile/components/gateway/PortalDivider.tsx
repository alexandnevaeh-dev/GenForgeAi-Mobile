import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

interface PortalDividerProps {
  label?: string;
}

export function PortalDivider({ label = "or" }: PortalDividerProps) {
  const gemGlow = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(gemGlow, { toValue: 1, duration: 1600, useNativeDriver: true }),
        Animated.timing(gemGlow, { toValue: 0.3, duration: 1600, useNativeDriver: true }),
      ])
    ).start();
  }, [gemGlow]);

  return (
    <View style={s.wrap}>
      {/* Left line */}
      <View style={s.lineWrap}>
        <View style={s.lineBg} />
        <LinearGradient
          colors={["rgba(42,38,64,0)", "rgba(42,38,64,0.6)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </View>

      {/* Crystal gem + label */}
      <View style={s.center}>
        <Animated.View style={[s.gem, { opacity: gemGlow, shadowColor: "#3B8FFF" }]}>
          <LinearGradient colors={["#1A3A8A", "#2B5FBF"]} style={StyleSheet.absoluteFill} />
          <View style={s.gemBorder} />
        </Animated.View>
        <Text style={s.label}>{label}</Text>
        <Animated.View style={[s.gem, { opacity: gemGlow, shadowColor: "#3B8FFF" }]}>
          <LinearGradient colors={["#1A3A8A", "#2B5FBF"]} style={StyleSheet.absoluteFill} />
          <View style={s.gemBorder} />
        </Animated.View>
      </View>

      {/* Right line */}
      <View style={s.lineWrap}>
        <View style={s.lineBg} />
        <LinearGradient
          colors={["rgba(42,38,64,0.6)", "rgba(42,38,64,0)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "center", gap: 10 },
  lineWrap: { flex: 1, height: 1, overflow: "hidden" },
  lineBg: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(42,38,64,0.4)" },
  center: { flexDirection: "row", alignItems: "center", gap: 6 },
  gem: {
    width: 6,
    height: 6,
    borderRadius: 1,
    transform: [{ rotate: "45deg" }],
    overflow: "hidden",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
  gemBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderColor: "rgba(59,143,255,0.5)",
  },
  label: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: "#3A3458",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
});
