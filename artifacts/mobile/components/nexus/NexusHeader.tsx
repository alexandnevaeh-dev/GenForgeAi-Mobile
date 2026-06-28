import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";

interface NexusHeaderProps {
  activeCount: number;
}

function ActiveCrystalBadge({ count }: { count: number }) {
  const pulse = useRef(new Animated.Value(0.6)).current;
  const ring = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.45, duration: 900, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(ring, { toValue: 1.6, duration: 1400, useNativeDriver: true }),
        Animated.timing(ring, { toValue: 1, duration: 0, useNativeDriver: true }),
        Animated.delay(600),
      ])
    ).start();
  }, [pulse, ring]);

  return (
    <View style={badge.wrap}>
      <LinearGradient
        colors={["rgba(59,143,255,0.18)", "rgba(59,143,255,0.08)"]}
        style={StyleSheet.absoluteFill}
      />
      <View style={badge.border} />

      {/* Pulsing ring */}
      <Animated.View
        style={[badge.ring, { transform: [{ scale: ring }], opacity: pulse }]}
        pointerEvents="none"
      />

      {/* Energy dot */}
      <Animated.View style={[badge.dot, { opacity: pulse }]} />

      <Text style={badge.text}>{count} active</Text>
    </View>
  );
}

export function NexusHeader({ activeCount }: NexusHeaderProps) {
  const shimmerX = useRef(new Animated.Value(-80)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(4500),
        Animated.timing(shimmerX, {
          toValue: 180,
          duration: 900,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerX, { toValue: -80, duration: 0, useNativeDriver: true }),
      ])
    ).start();
  }, [shimmerX]);

  return (
    <View style={s.wrap}>
      {/* Metallic title */}
      <View style={s.titleWrap}>
        <Text style={s.title}>Jobs</Text>
        <Animated.View
          style={[s.shimmer, { transform: [{ translateX: shimmerX }] }]}
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

      {activeCount > 0 && <ActiveCrystalBadge count={activeCount} />}
    </View>
  );
}

const badge = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 14,
    paddingHorizontal: 11,
    paddingVertical: 6,
    overflow: "hidden",
    shadowColor: "#3B8FFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(59,143,255,0.35)",
  },
  ring: {
    position: "absolute",
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#3B8FFF",
    left: 11,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#3B8FFF",
    shadowColor: "#3B8FFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 5,
    elevation: 4,
  },
  text: { fontSize: 12, fontFamily: "Inter_600SemiBold", color: "#5BA8FF" },
});

const s = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "center", gap: 12 },
  titleWrap: { flex: 1, overflow: "hidden" },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
    color: "#C0B8E0",
    textShadowColor: "rgba(140,120,255,0.3)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  shimmer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 70,
    transform: [{ skewX: "-15deg" }],
  },
});
