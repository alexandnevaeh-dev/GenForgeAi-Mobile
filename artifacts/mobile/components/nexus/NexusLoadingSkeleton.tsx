import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

function ConsoleCard() {
  const shimmerX = useRef(new Animated.Value(-160)).current;
  const opacity = useRef(new Animated.Value(0.25)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerX, {
        toValue: 400,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.55, duration: 1100, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.2, duration: 1100, useNativeDriver: true }),
      ])
    ).start();
  }, [shimmerX, opacity]);

  return (
    <Animated.View style={[styles.card, { opacity }]}>
      <LinearGradient colors={["#0E0C1E", "#0C0A1A"]} style={StyleSheet.absoluteFill} />
      <View style={styles.border} />

      {/* Blueprint grid lines */}
      <View style={grid.v1} />
      <View style={grid.v2} />
      <View style={grid.h1} />

      {/* Header row */}
      <View style={styles.headerRow}>
        <View style={[styles.bar, { width: 80, height: 22, borderRadius: 8 }]} />
        <View style={{ flex: 1 }} />
        <View style={[styles.bar, { width: 50, height: 18, borderRadius: 8 }]} />
      </View>

      {/* Phase label */}
      <View style={[styles.bar, { width: "65%", height: 14, borderRadius: 6 }]} />

      {/* Progress bar */}
      <View style={[styles.bar, { width: "100%", height: 7, borderRadius: 4 }]} />

      {/* Pipeline dots */}
      <View style={styles.dotRow}>
        {[0, 1, 2, 3, 4, 5].map((i) => (
          <View key={i} style={styles.phaseDot} />
        ))}
      </View>

      {/* Shimmer */}
      <Animated.View
        style={[styles.shimmer, { transform: [{ translateX: shimmerX }] }]}
        pointerEvents="none"
      >
        <LinearGradient
          colors={["rgba(59,143,255,0)", "rgba(59,143,255,0.12)", "rgba(59,143,255,0)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
    </Animated.View>
  );
}

export function NexusLoadingSkeleton() {
  return (
    <View style={styles.list}>
      {[0, 1, 2].map((i) => (
        <ConsoleCard key={i} />
      ))}
    </View>
  );
}

const grid = StyleSheet.create({
  v1: { position: "absolute", left: "33%", top: 0, bottom: 0, width: 1, backgroundColor: "rgba(59,143,255,0.04)" },
  v2: { position: "absolute", left: "66%", top: 0, bottom: 0, width: 1, backgroundColor: "rgba(59,143,255,0.04)" },
  h1: { position: "absolute", top: "50%", left: 0, right: 0, height: 1, backgroundColor: "rgba(59,143,255,0.04)" },
});

const styles = StyleSheet.create({
  list: { gap: 12 },
  card: {
    borderRadius: 16,
    padding: 14,
    gap: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(42,38,64,0.7)",
  },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  bar: { backgroundColor: "rgba(42,38,64,0.8)" },
  dotRow: { flexDirection: "row", gap: 8 },
  phaseDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: "rgba(42,38,64,0.8)" },
  shimmer: { position: "absolute", top: 0, bottom: 0, width: 100 },
});
