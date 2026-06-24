import { Feather } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

interface MemoryEntry {
  key: string;
  value: string;
}

interface Props {
  genre: string;
  artStyle: string;
  prompt: string;
  memoryEntries?: MemoryEntry[];
  consistencyScore?: number;
}

const DEFAULT_ENTRIES = (genre: string, artStyle: string): MemoryEntry[] => [
  { key: "Genre", value: genre },
  { key: "Art Style", value: artStyle },
  { key: "Tone", value: "Dark & atmospheric" },
  { key: "Perspective", value: "2D Side-scroller" },
  { key: "Progression", value: "Non-linear, ability-gated" },
  { key: "Combat", value: "Action, real-time" },
  { key: "Audio theme", value: "Orchestral dark fantasy" },
];

function PulsingDot({ color }: { color: string }) {
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.4, duration: 800, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 800, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [scale]);

  return (
    <Animated.View style={[styles.dot, { backgroundColor: color, transform: [{ scale }] }]} />
  );
}

export function GenLogicPanel({
  genre,
  artStyle,
  prompt,
  memoryEntries,
  consistencyScore = 98,
}: Props) {
  const colors = useColors();
  const entries = memoryEntries ?? DEFAULT_ENTRIES(genre, artStyle);

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.engineIcon, { backgroundColor: colors.secondary + "33" }]}>
            <Feather name="cpu" size={16} color={colors.secondary} />
          </View>
          <View>
            <Text style={[styles.title, { color: colors.foreground }]}>GenLogic Engine</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Project reasoning & memory</Text>
          </View>
        </View>
        <View style={styles.scoreWrap}>
          <PulsingDot color={colors.success} />
          <Text style={[styles.scoreText, { color: colors.success }]}>{consistencyScore}%</Text>
          <Text style={[styles.scoreLabel, { color: colors.mutedForeground }]}>Coherent</Text>
        </View>
      </View>

      {/* Prompt Analysis */}
      <View style={[styles.promptBox, { backgroundColor: colors.muted }]}>
        <Text style={[styles.promptLabel, { color: colors.mutedForeground }]}>ANALYZED PROMPT</Text>
        <Text style={[styles.promptText, { color: colors.foreground }]} numberOfLines={3}>
          {prompt}
        </Text>
      </View>

      {/* Project Memory */}
      <View>
        <Text style={[styles.memoryTitle, { color: colors.mutedForeground }]}>PROJECT MEMORY</Text>
        <View style={styles.memoryGrid}>
          {entries.map((entry) => (
            <View key={entry.key} style={[styles.memoryEntry, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <Text style={[styles.memoryKey, { color: colors.mutedForeground }]}>{entry.key}</Text>
              <Text style={[styles.memoryValue, { color: colors.foreground }]}>{entry.value}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Rules engine note */}
      <View style={[styles.rulesRow, { borderTopColor: colors.border }]}>
        <Feather name="check-circle" size={12} color={colors.accent} />
        <Text style={[styles.rulesText, { color: colors.mutedForeground }]}>
          Conflict detection active · Dependency tracking enabled · Balance validation on
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  engineIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  subtitle: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  scoreWrap: {
    alignItems: "center",
    gap: 2,
    flexDirection: "column",
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  scoreText: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  scoreLabel: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
  },
  promptBox: {
    borderRadius: 10,
    padding: 12,
    gap: 6,
  },
  promptLabel: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
  },
  promptText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  memoryTitle: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  memoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },
  memoryEntry: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 1,
    minWidth: "45%",
    flex: 1,
  },
  memoryKey: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
  },
  memoryValue: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  rulesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  rulesText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    flex: 1,
    lineHeight: 16,
  },
});
