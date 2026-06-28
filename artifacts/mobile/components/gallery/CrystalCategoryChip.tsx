import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

interface CrystalCategoryChipProps {
  color: string;
  count: number;
  label: string;
}

export function CrystalCategoryChip({ color, count, label }: CrystalCategoryChipProps) {
  const gemPulse = useRef(new Animated.Value(0.6)).current;
  const mountAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(mountAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(gemPulse, { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.timing(gemPulse, { toValue: 0.5, duration: 1400, useNativeDriver: true }),
      ])
    ).start();
  }, [gemPulse, mountAnim]);

  return (
    <Animated.View style={[styles.wrap, { opacity: mountAnim }]}>
      <LinearGradient colors={["#0E0C1E", "#0C0A1A"]} style={StyleSheet.absoluteFill} />
      <View style={styles.border} />

      {/* Crystal gem */}
      <View style={styles.gemWrap}>
        <View style={[styles.gemOuter, { borderColor: color + "40" }]}>
          <Animated.View
            style={[
              styles.gemCore,
              {
                backgroundColor: color,
                shadowColor: color,
                opacity: gemPulse,
              },
            ]}
          />
        </View>
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
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginRight: 8,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(42,38,64,0.8)",
  },
  gemWrap: { alignItems: "center", justifyContent: "center" },
  gemOuter: {
    width: 13,
    height: 13,
    borderRadius: 3,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ rotate: "45deg" }],
  },
  gemCore: {
    width: 7,
    height: 7,
    borderRadius: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 5,
    elevation: 3,
  },
  count: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
  label: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#3A3458",
  },
});
