import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { memo, useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

import { GameProject } from "@/context/ProjectsContext";

const STATUS_CRYSTAL: Record<GameProject["status"], string> = {
  planning: "#6B6B80",
  generating: "#3B8FFF",
  in_progress: "#9B4BFF",
  complete: "#10B981",
  exported: "#00E5FF",
};

const GENRE_ICONS: Record<string, React.ComponentProps<typeof Feather>["name"]> = {
  RPG: "book-open",
  Action: "zap",
  Platformer: "chevrons-up",
  Strategy: "target",
  Puzzle: "grid",
  Horror: "moon",
  Adventure: "compass",
  Simulation: "sliders",
  Fighting: "shield",
  Shooter: "radio",
};

interface Props {
  project: GameProject;
}

export const GridBlueprintCard = memo(function GridBlueprintCard({ project }: Props) {
  const isActive = project.status === "generating" || project.status === "in_progress";
  const statusColor = STATUS_CRYSTAL[project.status] ?? "#6B6B80";
  const pressScale = useRef(new Animated.Value(1)).current;
  const activePulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (isActive) {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(activePulse, { toValue: 1, duration: 900, useNativeDriver: true }),
          Animated.timing(activePulse, { toValue: 0.4, duration: 900, useNativeDriver: true }),
        ])
      );
      anim.start();
      return () => anim.stop();
    }
    return undefined;
  }, [isActive, activePulse]);

  const genreIcon = GENRE_ICONS[project.genre] ?? "layers";

  return (
    <Animated.View style={[styles.outerWrap, { transform: [{ scale: pressScale }] }]}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push(`/project/${project.id}`);
        }}
        onPressIn={() => Animated.spring(pressScale, { toValue: 0.94, useNativeDriver: true, tension: 80, friction: 6 }).start()}
        onPressOut={() => Animated.spring(pressScale, { toValue: 1, useNativeDriver: true, tension: 60, friction: 10 }).start()}
        style={styles.card}
      >
        <LinearGradient colors={["#0E0C1E", "#0C0A1A"]} style={StyleSheet.absoluteFill} />
        <View style={styles.border} />

        {/* Thumbnail */}
        <View style={styles.thumb}>
          <LinearGradient colors={["#080618", "#0C0A20"]} style={StyleSheet.absoluteFill} />
          {/* Blueprint grid */}
          <View style={art.gridV} /><View style={art.gridH} />

          {/* Genre icon */}
          <Feather name={genreIcon} size={20} color={statusColor} style={{ shadowColor: statusColor, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.7, shadowRadius: 8, elevation: 3 }} />

          {/* Live badge */}
          {isActive && (
            <Animated.View style={[styles.liveBadge, { opacity: activePulse, shadowColor: statusColor }]}>
              <LinearGradient colors={[statusColor, statusColor + "CC"]} style={StyleSheet.absoluteFill} />
              <View style={styles.liveDot} />
            </Animated.View>
          )}
        </View>

        {/* Info */}
        <View style={styles.info}>
          <Text style={styles.title} numberOfLines={1}>{project.title}</Text>
          <Text style={styles.meta} numberOfLines={1}>{project.genre}</Text>

          {isActive && (
            <View style={styles.progressTrack}>
              <LinearGradient colors={["#0D1A38", "#0F1E42"]} style={StyleSheet.absoluteFill} />
              <View style={[styles.progressFill, { width: `${project.progress}%` as any }]}>
                <LinearGradient colors={[statusColor, statusColor + "CC"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
              </View>
            </View>
          )}

          <View style={styles.statusRow}>
            <Animated.View style={[styles.statusDot, { backgroundColor: statusColor, shadowColor: statusColor, opacity: isActive ? activePulse : 1 }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>{project.status.replace("_", " ")}</Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
});

const art = StyleSheet.create({
  gridV: { position: "absolute", left: "50%", top: 0, bottom: 0, width: 1, backgroundColor: "rgba(59,143,255,0.07)" },
  gridH: { position: "absolute", top: "50%", left: 0, right: 0, height: 1, backgroundColor: "rgba(59,143,255,0.07)" },
});

const styles = StyleSheet.create({
  outerWrap: {
    width: "47%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  card: {
    borderRadius: 14,
    overflow: "hidden",
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(42,38,64,0.8)",
  },
  thumb: {
    height: 90,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  liveBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  liveDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: "#fff" },
  info: { padding: 10, gap: 4 },
  title: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#B0A8D0" },
  meta: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#2A2448" },
  progressTrack: {
    height: 3,
    borderRadius: 2,
    overflow: "hidden",
    marginTop: 2,
  },
  progressFill: { height: 3, borderRadius: 2, overflow: "hidden" },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 2,
  },
  statusText: { fontSize: 10, fontFamily: "Inter_500Medium", textTransform: "capitalize" },
});
