import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

interface SecurityItem {
  label: string;
  done: boolean;
}

interface VaultPanelProps {
  items: SecurityItem[];
}

function CrystalDot({ done }: { done: boolean }) {
  const glow = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    if (!done) return;
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0.4, duration: 1400, useNativeDriver: true }),
      ])
    ).start();
  }, [done, glow]);

  return (
    <Animated.View style={[dot.wrap, done ? dot.wrapDone : dot.wrapPending, done && { opacity: glow }]}>
      {done ? (
        <>
          <LinearGradient colors={["#1A5A2A", "#22C55E40"]} style={StyleSheet.absoluteFill} />
          <View style={dot.borderDone} />
          <Feather name="check" size={9} color="#22C55E" style={dot.checkIcon} />
        </>
      ) : (
        <>
          <LinearGradient colors={["#141228", "#0E0C1E"]} style={StyleSheet.absoluteFill} />
          <View style={dot.borderPending} />
        </>
      )}
    </Animated.View>
  );
}

export function VaultPanel({ items }: VaultPanelProps) {
  const doneCount = items.filter((i) => i.done).length;
  const score = Math.round((doneCount / items.length) * 100);
  const scoreColor = score >= 75 ? "#22C55E" : score >= 50 ? "#F97316" : "#EF4444";

  return (
    <View style={styles.wrap}>
      <LinearGradient colors={["#0E0C1E", "#0C0A1A"]} style={StyleSheet.absoluteFill} />
      <View style={styles.border} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.shieldWrap}>
          <LinearGradient colors={["#1A1628", "#0E0C1E"]} style={StyleSheet.absoluteFill} />
          <View style={[styles.shieldBorder, { borderColor: scoreColor + "50" }]} />
          <Feather name="shield" size={16} color={scoreColor} style={[styles.shieldIcon, { shadowColor: scoreColor }]} />
        </View>
        <Text style={styles.title}>Security Score</Text>
        <View style={{ flex: 1 }} />
        <Text style={[styles.score, { color: scoreColor }]}>{score}%</Text>
      </View>

      {/* Items */}
      <View style={styles.itemsRow}>
        {items.map((item) => (
          <View key={item.label} style={styles.item}>
            <CrystalDot done={item.done} />
            <Text style={[styles.itemLabel, item.done && styles.itemLabelDone]}>
              {item.label}
            </Text>
          </View>
        ))}
      </View>

      {/* Score bar */}
      <View style={styles.scoreBar}>
        <LinearGradient colors={["#0A0818", "#0E0C18"]} style={StyleSheet.absoluteFill} />
        <View style={styles.scoreBarBorder} />
        <View style={[styles.scoreBarFill, { width: `${score}%` as any }]}>
          <LinearGradient
            colors={[scoreColor + "AA", scoreColor]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </View>
      </View>
    </View>
  );
}

const dot = StyleSheet.create({
  wrap: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  wrapDone: {},
  wrapPending: { opacity: 0.4 },
  borderDone: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.4)",
  },
  borderPending: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(42,38,64,0.8)",
  },
  checkIcon: {
    shadowColor: "#22C55E",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
    elevation: 3,
  },
});

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 16,
    padding: 16,
    gap: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(42,38,64,0.8)",
  },
  header: { flexDirection: "row", alignItems: "center", gap: 10 },
  shieldWrap: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  shieldBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 9,
    borderWidth: 1,
  },
  shieldIcon: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 4,
  },
  title: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#C0B8E0" },
  score: { fontSize: 16, fontFamily: "Inter_700Bold" },
  itemsRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  item: { flexDirection: "row", alignItems: "center", gap: 7 },
  itemLabel: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#3A3458" },
  itemLabelDone: { color: "#22C55E" },
  scoreBar: { height: 6, borderRadius: 4, overflow: "hidden" },
  scoreBarBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "rgba(42,38,64,0.5)",
  },
  scoreBarFill: { height: "100%", borderRadius: 4, overflow: "hidden" },
});
