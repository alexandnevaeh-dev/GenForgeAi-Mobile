import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";

interface EnergyProgressBarProps {
  progress: number;
  color: string;
  showLabel?: boolean;
  isActive?: boolean;
}

export function EnergyProgressBar({ progress, color, showLabel = true, isActive = false }: EnergyProgressBarProps) {
  const shimmerX = useRef(new Animated.Value(-60)).current;
  const tipGlow = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (!isActive) return;
    Animated.loop(
      Animated.timing(shimmerX, {
        toValue: 400,
        duration: 2200,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(tipGlow, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(tipGlow, { toValue: 0.35, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, [shimmerX, tipGlow, isActive]);

  const clampedPct = Math.min(Math.max(progress, 0), 100);

  return (
    <View style={styles.wrap}>
      <View style={styles.track}>
        {/* Track background */}
        <LinearGradient colors={["#0A0818", "#0E0C18"]} style={StyleSheet.absoluteFill} />
        <View style={styles.trackBorder} />

        {/* Fill */}
        <View style={[styles.fillWrap, { width: `${clampedPct}%` as any }]}>
          <LinearGradient
            colors={[color + "AA", color, color + "CC"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.fill}
          />
          {/* Shimmer sweep */}
          {isActive && (
            <Animated.View
              style={[styles.shimmer, { transform: [{ translateX: shimmerX }] }]}
              pointerEvents="none"
            >
              <LinearGradient
                colors={["rgba(255,255,255,0)", "rgba(255,255,255,0.5)", "rgba(255,255,255,0)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ flex: 1 }}
              />
            </Animated.View>
          )}
          {/* Glowing tip */}
          {isActive && clampedPct > 3 && (
            <Animated.View style={[styles.tip, { backgroundColor: color, shadowColor: color, opacity: tipGlow }]} />
          )}
        </View>
      </View>

      {showLabel && (
        <Text style={[styles.pct, { color }]}>{clampedPct}%</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "center", gap: 8 },
  track: {
    flex: 1,
    height: 7,
    borderRadius: 4,
    overflow: "hidden",
  },
  trackBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(42,38,64,0.5)",
  },
  fillWrap: {
    height: "100%",
    overflow: "hidden",
    position: "relative",
    borderRadius: 4,
  },
  fill: { flex: 1 },
  shimmer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 40,
  },
  tip: {
    position: "absolute",
    right: 0,
    top: "50%",
    width: 5,
    height: 5,
    borderRadius: 3,
    marginTop: -2.5,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 5,
    elevation: 4,
  },
  pct: { fontSize: 12, fontFamily: "Inter_700Bold", minWidth: 36, textAlign: "right" },
});
