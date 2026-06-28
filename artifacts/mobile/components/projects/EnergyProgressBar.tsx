import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";

interface EnergyProgressBarProps {
  progress: number;
  height?: number;
  showLabel?: boolean;
}

export function EnergyProgressBar({ progress, height = 6, showLabel = true }: EnergyProgressBarProps) {
  const shimmerAnim = useRef(new Animated.Value(-80)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 320,
          duration: 1600,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, { toValue: -80, duration: 0, useNativeDriver: true }),
        Animated.delay(500),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [shimmerAnim]);

  return (
    <View style={styles.row}>
      <View style={[styles.track, { height }]}>
        <LinearGradient colors={["#0D1A38", "#0F1E42"]} style={StyleSheet.absoluteFill} />
        <View style={[styles.fill, { width: `${progress}%` as any, height }]}>
          <LinearGradient
            colors={["#2B7FFF", "#5B4FFF", "#9B4BFF"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
          <Animated.View
            style={[styles.shimmer, { transform: [{ translateX: shimmerAnim }] }]}
            pointerEvents="none"
          >
            <LinearGradient
              colors={["rgba(255,255,255,0)", "rgba(255,255,255,0.45)", "rgba(255,255,255,0)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={{ flex: 1 }}
            />
          </Animated.View>
        </View>
        {/* Glow tip */}
        {progress > 0 && progress < 100 && (
          <View style={[styles.tip, { left: `${Math.min(progress, 97)}%` as any, height: height + 4, top: -(4 / 2) }]} />
        )}
      </View>
      {showLabel && (
        <Text style={styles.label}>{progress}%</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  track: {
    flex: 1,
    borderRadius: 4,
    overflow: "visible",
    shadowColor: "#3B8FFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  fill: {
    borderRadius: 4,
    overflow: "hidden",
  },
  shimmer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 60,
  },
  tip: {
    position: "absolute",
    width: 3,
    borderRadius: 2,
    backgroundColor: "#AADCFF",
    shadowColor: "#AADCFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 5,
    elevation: 3,
    marginLeft: -1.5,
  },
  label: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: "#4A7ABF",
    width: 34,
    textAlign: "right",
  },
});
