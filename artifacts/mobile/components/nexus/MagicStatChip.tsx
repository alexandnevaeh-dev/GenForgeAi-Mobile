import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

interface MagicStatChipProps {
  label: string;
  count: number;
  color: string;
  icon: React.ComponentProps<typeof Feather>["name"];
}

export function MagicStatChip({ label, count, color, icon }: MagicStatChipProps) {
  const iconGlow = useRef(new Animated.Value(0.5)).current;
  const mountAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(mountAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(iconGlow, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(iconGlow, { toValue: 0.4, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, [iconGlow, mountAnim]);

  return (
    <Animated.View style={[styles.wrap, { opacity: mountAnim }]}>
      <LinearGradient colors={["#0E0C1E", "#0C0A1A"]} style={StyleSheet.absoluteFill} />
      <View style={styles.border} />

      {/* Icon crystal */}
      <View style={[styles.iconWrap, { borderColor: color + "40", backgroundColor: color + "12" }]}>
        <Animated.View style={{ opacity: iconGlow }}>
          <Feather name={icon} size={12} color={color} />
        </Animated.View>
      </View>

      <Text style={[styles.count, { color }]}>{count}</Text>
      <Text style={styles.label}>{label}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderRadius: 11,
    paddingHorizontal: 11,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.28,
    shadowRadius: 6,
    elevation: 4,
    overflow: "hidden",
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "rgba(42,38,64,0.7)",
  },
  iconWrap: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  count: { fontSize: 15, fontFamily: "Inter_700Bold" },
  label: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#3A3458" },
});
