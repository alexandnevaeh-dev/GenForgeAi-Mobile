import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";

const MESSAGES = [
  "World-building agent completed fantasy map",
  "Story agent generated 47 NPC dialogues",
  "Pixel Art agent rendered 320 sprite assets",
  "Audio agent composed 12 ambient tracks",
  "Code agent optimised movement system",
  "QA agent passed 94 automated tests",
];

const ORBS = [
  { color: "#3B8FFF", glow: "#3B8FFF", label: "World" },
  { color: "#9B4BFF", glow: "#9B4BFF", label: "Story" },
  { color: "#10B981", glow: "#10B981", label: "Art" },
  { color: "#00E5FF", glow: "#00E5FF", label: "Code" },
  { color: "#FFB347", glow: "#FFB347", label: "Audio" },
  { color: "#DC2626", glow: "#DC2626", label: "QA" },
];

function AgentOrb({ color, glow, label, delay }: { color: string; glow: string; label: string; delay: number }) {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(pulse, { toValue: 1.4, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.delay(1200),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [pulse, delay]);

  return (
    <View style={styles.orbWrap}>
      <Animated.View
        style={[
          styles.orb,
          {
            backgroundColor: color,
            shadowColor: glow,
            transform: [{ scale: pulse }],
          },
        ]}
      />
      <Text style={[styles.orbLabel, { color }]}>{label}</Text>
    </View>
  );
}

export function ForgeAIConsole() {
  const spinAnim = useRef(new Animated.Value(0)).current;
  const msgOpacities = useRef(MESSAGES.slice(0, 3).map(() => new Animated.Value(0))).current;
  const [visibleStart, setVisibleStart] = useState(0);
  const msgFade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const spin = Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 6000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    spin.start();
    return () => spin.stop();
  }, [spinAnim]);

  useEffect(() => {
    Animated.stagger(
      220,
      msgOpacities.map((op) => Animated.timing(op, { toValue: 1, duration: 400, useNativeDriver: true }))
    ).start();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      Animated.sequence([
        Animated.timing(msgFade, { toValue: 0, duration: 250, useNativeDriver: true }),
        Animated.timing(msgFade, { toValue: 1, duration: 250, useNativeDriver: true }),
      ]).start();
      setTimeout(() => {
        setVisibleStart((v) => (v + 1) % MESSAGES.length);
      }, 250);
    }, 3200);
    return () => clearInterval(interval);
  }, [msgFade]);

  const rotate = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });
  const visibleMessages = [
    MESSAGES[visibleStart % MESSAGES.length],
    MESSAGES[(visibleStart + 1) % MESSAGES.length],
    MESSAGES[(visibleStart + 2) % MESSAGES.length],
  ];

  return (
    <View style={styles.card}>
      <LinearGradient
        colors={["#0E0C1E", "#111028", "#0B0A1A"]}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.borderOverlay} />

      {/* Header */}
      <View style={styles.header}>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <Feather name="cpu" size={18} color="#3B8FFF" style={styles.cpuGlow} />
        </Animated.View>
        <Text style={styles.title}>AI Control Console</Text>
        <View style={styles.onlinePill}>
          <View style={styles.onlineDot} />
          <Text style={styles.onlineText}>23 active</Text>
        </View>
      </View>

      {/* Agent orbs */}
      <View style={styles.orbsRow}>
        {ORBS.map((orb, i) => (
          <AgentOrb key={orb.label} {...orb} delay={i * 280} />
        ))}
      </View>

      {/* Activity feed */}
      <Animated.View style={[styles.feed, { opacity: msgFade }]}>
        {visibleMessages.map((msg, i) => (
          <Animated.View key={`${msg}-${i}`} style={[styles.feedRow, { opacity: msgOpacities[i] ?? 1 }]}>
            <View style={[styles.feedDot, { backgroundColor: ORBS[i % ORBS.length].color }]} />
            <Text style={styles.feedText} numberOfLines={1}>{msg}</Text>
          </Animated.View>
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    overflow: "hidden",
    padding: 16,
    gap: 14,
    shadowColor: "#3B8FFF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  borderOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "#2A2640",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  cpuGlow: {
    shadowColor: "#3B8FFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    color: "#E8E6F0",
  },
  onlinePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(16,185,129,0.12)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.3)",
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  onlineText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: "#10B981",
  },
  orbsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  orbWrap: {
    alignItems: "center",
    gap: 4,
  },
  orb: {
    width: 12,
    height: 12,
    borderRadius: 6,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 4,
  },
  orbLabel: {
    fontSize: 9,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.3,
  },
  feed: {
    gap: 8,
  },
  feedRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  feedDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    flexShrink: 0,
  },
  feedText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#7B7890",
    flex: 1,
  },
});
