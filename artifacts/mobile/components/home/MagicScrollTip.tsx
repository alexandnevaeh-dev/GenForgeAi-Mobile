import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

const TIPS = [
  "Describe your game in one sentence — the Master Game Director handles the rest.",
  "Use the AI Studio to refine your concept before generating assets.",
  "Export sprites directly to Godot, Unity, or Unreal Engine.",
  "Join 2,341 forge-masters in the community for templates and tips.",
];

const RUNE = "᛭"; // Elder Futhark-style rune character

export function MagicScrollTip() {
  const [tipIndex, setTipIndex] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const runeGlow = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const runeLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(runeGlow, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(runeGlow, { toValue: 0.5, duration: 1200, useNativeDriver: true }),
      ])
    );
    runeLoop.start();
    return () => runeLoop.stop();
  }, [runeGlow]);

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.timing(fadeAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
        setTipIndex((i) => (i + 1) % TIPS.length);
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }).start();
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [fadeAnim]);

  return (
    <View style={styles.scroll}>
      <LinearGradient
        colors={["#140F08", "#1A1310", "#140F08"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.border} />
      {/* Scroll ends */}
      <View style={[styles.scrollEnd, { left: 0 }]} />
      <View style={[styles.scrollEnd, { right: 0 }]} />

      <Animated.Text style={[styles.rune, { opacity: runeGlow }]}>{RUNE}</Animated.Text>
      <Animated.Text style={[styles.tip, { opacity: fadeAnim }]} numberOfLines={2}>
        {TIPS[tipIndex]}
      </Animated.Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    overflow: "hidden",
    shadowColor: "#8B6030",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
    marginBottom: 8,
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#4A3010",
  },
  scrollEnd: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 6,
    backgroundColor: "#6B420A",
    borderRadius: 3,
    opacity: 0.8,
  },
  rune: {
    fontSize: 18,
    color: "#00E5FF",
    textShadowColor: "#00E5FF",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
    flexShrink: 0,
  },
  tip: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#8B7055",
    lineHeight: 19,
  },
});
