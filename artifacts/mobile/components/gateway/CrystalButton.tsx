import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";

interface CrystalButtonProps {
  onPress: () => void;
  label: string;
  icon?: React.ComponentProps<typeof Feather>["name"];
  isLoading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "forge";
}

export function CrystalButton({ onPress, label, icon, isLoading, disabled, variant = "primary" }: CrystalButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const ringRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!isLoading) { ringRotate.setValue(0); return; }
    const loop = Animated.loop(
      Animated.timing(ringRotate, { toValue: 1, duration: 800, easing: Easing.linear, useNativeDriver: true })
    );
    loop.start();
    return () => loop.stop();
  }, [isLoading, ringRotate]);

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, tension: 100, friction: 8 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 60, friction: 10 }).start();
  };
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  const spin = ringRotate.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  const grad = variant === "forge"
    ? ["#3B1FA8", "#5B2FDF", "#7B3FFF"] as [string, string, string]
    : ["#1E4FBF", "#2B7FFF", "#3B8FFF"] as [string, string, string];

  return (
    <Animated.View style={[s.outerWrap, { transform: [{ scale }] }]}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || isLoading}
        style={s.btn}
      >
        <LinearGradient colors={grad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        <LinearGradient
          colors={["rgba(255,255,255,0.18)", "rgba(255,255,255,0)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={s.border} />

        {isLoading ? (
          <View style={s.loadingRow}>
            {/* Rotating ring */}
            <Animated.View style={[s.loadingRing, { transform: [{ rotate: spin }] }]} />
            <Text style={s.label}>Channeling…</Text>
          </View>
        ) : (
          <View style={s.contentRow}>
            {icon && <Feather name={icon} size={18} color="#AADCFF" style={s.iconGlow} />}
            <Text style={s.label}>{label}</Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  outerWrap: {
    shadowColor: "#3B8FFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 8,
  },
  btn: {
    borderRadius: 16,
    paddingVertical: 15,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  contentRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  loadingRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  loadingRing: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: "rgba(170,220,255,0.3)",
    borderTopColor: "#AADCFF",
  },
  iconGlow: {
    shadowColor: "#AADCFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 4,
  },
  label: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#D0E8FF" },
});
