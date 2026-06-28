import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import React, { useRef } from "react";
import { Animated, Pressable, StyleSheet, Text } from "react-native";

interface SocialLoginCardProps {
  label: string;
  icon: React.ComponentProps<typeof Feather>["name"];
  onPress: () => void;
}

export function SocialLoginCard({ label, icon, onPress }: SocialLoginCardProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, tension: 100, friction: 8 }).start();
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
        <LinearGradient colors={["#0E0C1E", "#0C0A1A"]} style={StyleSheet.absoluteFill} />
        <LinearGradient
          colors={["rgba(59,143,255,0.06)", "rgba(59,143,255,0)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
        <Animated.View style={s.border} />

        <Feather name={icon} size={18} color="#5A5478" />
        <Text style={s.label}>{label}</Text>
        <Feather name="arrow-right" size={14} color="#2A2448" style={s.arrow} />
      </Pressable>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  wrap: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 13,
    paddingHorizontal: 16,
    paddingVertical: 13,
    overflow: "hidden",
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "rgba(42,38,64,0.8)",
  },
  label: { flex: 1, fontSize: 15, fontFamily: "Inter_500Medium", color: "#C0B8E0" },
  arrow: { marginLeft: "auto" },
});
