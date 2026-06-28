import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

const CORNER = 10;
const CORNER_T = 2;

function FrameCorner({ top, right, bottom, left }: { top?: number; right?: number; bottom?: number; left?: number }) {
  const t = top !== undefined;
  const l = left !== undefined;
  return (
    <View
      style={[
        corner.base,
        top !== undefined && { top },
        right !== undefined && { right },
        bottom !== undefined && { bottom },
        left !== undefined && { left },
        t && l
          ? { borderTopWidth: CORNER_T, borderLeftWidth: CORNER_T }
          : t && !l
          ? { borderTopWidth: CORNER_T, borderRightWidth: CORNER_T }
          : !t && l
          ? { borderBottomWidth: CORNER_T, borderLeftWidth: CORNER_T }
          : { borderBottomWidth: CORNER_T, borderRightWidth: CORNER_T },
      ]}
    />
  );
}

function SkeletonCard() {
  const shimmerX = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerX, {
        toValue: 400,
        duration: 1800,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.6, duration: 1000, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.25, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, [shimmerX, opacity]);

  return (
    <Animated.View style={[styles.card, { opacity }]}>
      <LinearGradient colors={["#0E0C1E", "#0C0A1A"]} style={StyleSheet.absoluteFill} />
      <View style={styles.border} />
      <FrameCorner top={-1} left={-1} />
      <FrameCorner top={-1} right={-1} />
      <FrameCorner bottom={-1} left={-1} />
      <FrameCorner bottom={-1} right={-1} />

      {/* Artwork area placeholder */}
      <View style={styles.artArea}>
        <LinearGradient colors={["#080618", "#0C0A20"]} style={StyleSheet.absoluteFill} />
        <View style={sk.gridV} />
        <View style={sk.gridH} />
      </View>

      {/* Meta placeholders */}
      <View style={styles.meta}>
        <View style={[styles.bar, { width: "40%", height: 10 }]} />
        <View style={[styles.bar, { width: "80%", height: 11 }]} />
        <View style={[styles.bar, { width: "55%", height: 10 }]} />
      </View>

      {/* Shimmer sweep */}
      <Animated.View
        style={[styles.shimmer, { transform: [{ translateX: shimmerX }] }]}
        pointerEvents="none"
      >
        <LinearGradient
          colors={["rgba(59,143,255,0)", "rgba(59,143,255,0.1)", "rgba(59,143,255,0)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
    </Animated.View>
  );
}

export function GalleryLoadingSkeleton() {
  return (
    <View style={styles.grid}>
      {[0, 1, 2, 3].map((i) => (
        <SkeletonCard key={i} />
      ))}
    </View>
  );
}

const corner = StyleSheet.create({
  base: {
    position: "absolute",
    width: CORNER,
    height: CORNER,
    borderColor: "rgba(59,143,255,0.3)",
  },
});

const sk = StyleSheet.create({
  gridV: { position: "absolute", left: "50%", top: 0, bottom: 0, width: 1, backgroundColor: "rgba(59,143,255,0.07)" },
  gridH: { position: "absolute", top: "50%", left: 0, right: 0, height: 1, backgroundColor: "rgba(59,143,255,0.07)" },
});

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  card: {
    width: "47%",
    borderRadius: 14,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(42,38,64,0.7)",
  },
  artArea: { width: "100%", aspectRatio: 1, overflow: "hidden" },
  meta: { padding: 10, gap: 6 },
  bar: { borderRadius: 5, backgroundColor: "rgba(42,38,64,0.8)" },
  shimmer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 80,
  },
});
