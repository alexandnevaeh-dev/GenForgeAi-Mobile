import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";

function SkeletonCard() {
  const shimmerX = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.timing(shimmerX, {
        toValue: 420,
        duration: 1800,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.7, duration: 900, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.35, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, [shimmerX, opacity]);

  return (
    <Animated.View style={[styles.card, { opacity }]}>
      <LinearGradient colors={["#0E0C1E", "#0C0A1A"]} style={StyleSheet.absoluteFill} />
      <View style={styles.border} />

      {/* Blueprint grid lines in artwork area */}
      <View style={styles.artArea}>
        <LinearGradient colors={["#080618", "#0C0A20"]} style={StyleSheet.absoluteFill} />
        <View style={art.gridV1} /><View style={art.gridV2} /><View style={art.gridV3} />
        <View style={art.gridH1} /><View style={art.gridH2} />
        {/* Corner dots */}
        {[[8, 8], [8, undefined], [undefined, 8], [undefined, undefined]].map(([t, b], i) => (
          <View
            key={i}
            style={[
              art.cornerDot,
              t !== undefined ? { top: t } : { bottom: 8 },
              b !== undefined ? { right: b } : { left: 8 },
            ]}
          />
        ))}
      </View>

      {/* Text placeholders */}
      <View style={styles.body}>
        <View style={[styles.bar, styles.bar1]} />
        <View style={[styles.bar, styles.bar2]} />
        <View style={styles.tagsRow}>
          <View style={[styles.tag, { width: 52 }]} />
          <View style={[styles.tag, { width: 68 }]} />
        </View>
        <View style={[styles.bar, styles.barProgress]} />
      </View>

      {/* Sweeping shimmer */}
      <Animated.View
        style={[styles.shimmer, { transform: [{ translateX: shimmerX }] }]}
        pointerEvents="none"
      >
        <LinearGradient
          colors={["rgba(59,143,255,0)", "rgba(59,143,255,0.08)", "rgba(59,143,255,0)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
    </Animated.View>
  );
}

export function BlueprintSkeleton() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <SkeletonCard key={i} />
      ))}
    </>
  );
}

const art = StyleSheet.create({
  gridV1: { position: "absolute", left: "25%", top: 0, bottom: 0, width: 1, backgroundColor: "rgba(59,143,255,0.1)" },
  gridV2: { position: "absolute", left: "50%", top: 0, bottom: 0, width: 1, backgroundColor: "rgba(59,143,255,0.1)" },
  gridV3: { position: "absolute", left: "75%", top: 0, bottom: 0, width: 1, backgroundColor: "rgba(59,143,255,0.1)" },
  gridH1: { position: "absolute", left: 0, right: 0, top: "33%", height: 1, backgroundColor: "rgba(59,143,255,0.1)" },
  gridH2: { position: "absolute", left: 0, right: 0, top: "66%", height: 1, backgroundColor: "rgba(59,143,255,0.1)" },
  cornerDot: {
    position: "absolute",
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(59,143,255,0.3)",
  },
});

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(59,143,255,0.12)",
  },
  artArea: {
    height: 80,
    overflow: "hidden",
  },
  body: {
    padding: 14,
    gap: 8,
  },
  bar: {
    height: 12,
    borderRadius: 6,
    backgroundColor: "rgba(42,38,64,0.8)",
  },
  bar1: { width: "68%" },
  bar2: { width: "90%" },
  barProgress: { height: 5, width: "100%", borderRadius: 3, marginTop: 2 },
  tagsRow: { flexDirection: "row", gap: 6 },
  tag: { height: 20, borderRadius: 6, backgroundColor: "rgba(42,38,64,0.6)" },
  shimmer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 100,
  },
});
