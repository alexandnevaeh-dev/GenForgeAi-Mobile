import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { memo, useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

import { GameProject } from "@/context/ProjectsContext";
import { EnergyProgressBar } from "./EnergyProgressBar";

const STATUS_CRYSTAL: Record<GameProject["status"], string> = {
  planning: "#6B6B80",
  generating: "#3B8FFF",
  in_progress: "#9B4BFF",
  complete: "#10B981",
  exported: "#00E5FF",
};

const STATUS_LABEL: Record<GameProject["status"], string> = {
  planning: "Planning",
  generating: "Generating",
  in_progress: "In Progress",
  complete: "Complete",
  exported: "Exported",
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

const GENRE_RUNES: Record<string, string> = {
  RPG: "ᚱ", Action: "ᛏ", Platformer: "ᛁ", Strategy: "ᚦ",
  Puzzle: "ᛈ", Horror: "ᚾ", Adventure: "ᚨ", Simulation: "ᛊ",
  Fighting: "ᛏ", Shooter: "ᚠ",
};

function timeAgo(ts: number): string {
  const m = Math.floor((Date.now() - ts) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

interface BlueprintArtworkProps {
  project: GameProject;
  isActive: boolean;
  statusColor: string;
}

function BlueprintArtwork({ project, isActive, statusColor }: BlueprintArtworkProps) {
  const artPulse = useRef(new Animated.Value(0.7)).current;
  useEffect(() => {
    if (isActive) {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(artPulse, { toValue: 1, duration: 1400, useNativeDriver: true }),
          Animated.timing(artPulse, { toValue: 0.6, duration: 1400, useNativeDriver: true }),
        ])
      );
      anim.start();
      return () => anim.stop();
    }
    return undefined;
  }, [isActive, artPulse]);

  const rune = GENRE_RUNES[project.genre] ?? "᛭";
  const genreIcon = GENRE_ICONS[project.genre] ?? "layers";

  return (
    <View style={art.wrap}>
      <LinearGradient colors={["#080618", "#0C0A20", "#090716"]} style={StyleSheet.absoluteFill} />
      {/* Blueprint grid lines */}
      <View style={art.gridV1} /><View style={art.gridV2} /><View style={art.gridV3} />
      <View style={art.gridH1} /><View style={art.gridH2} />

      {/* Central icon */}
      <Animated.View style={[art.centralIcon, { opacity: artPulse }]}>
        <Feather name={genreIcon} size={22} color={statusColor} />
      </Animated.View>

      {/* Rune overlay */}
      <Text style={[art.rune, { color: statusColor + "60" }]}>{rune}</Text>

      {/* Status crystal badge */}
      <View style={[art.crystalBadge, { backgroundColor: statusColor + "22", borderColor: statusColor + "66" }]}>
        <View style={[art.crystalDot, { backgroundColor: statusColor, shadowColor: statusColor }]} />
        <Text style={[art.crystalLabel, { color: statusColor }]}>{STATUS_LABEL[project.status]}</Text>
      </View>
    </View>
  );
}

interface Props {
  project: GameProject;
}

export const BlueprintCard = memo(function BlueprintCard({ project }: Props) {
  const isActive = project.status === "generating" || project.status === "in_progress";
  const statusColor = STATUS_CRYSTAL[project.status] ?? "#6B6B80";

  const pressScale = useRef(new Animated.Value(1)).current;
  const activeBorderOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isActive) {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(activeBorderOpacity, { toValue: 1, duration: 1200, useNativeDriver: false }),
          Animated.timing(activeBorderOpacity, { toValue: 0.25, duration: 1200, useNativeDriver: false }),
        ])
      );
      anim.start();
      return () => anim.stop();
    }
    return undefined;
  }, [isActive, activeBorderOpacity]);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/project/${project.id}`);
  };

  return (
    <Animated.View style={[styles.outerWrap, { transform: [{ scale: pressScale }] }]}>
      <Pressable
        onPress={handlePress}
        onPressIn={() => Animated.spring(pressScale, { toValue: 0.97, useNativeDriver: true, tension: 80, friction: 6 }).start()}
        onPressOut={() => Animated.spring(pressScale, { toValue: 1, useNativeDriver: true, tension: 60, friction: 10 }).start()}
        style={styles.card}
      >
        {/* Card background */}
        <LinearGradient colors={["#0E0C1E", "#0C0A1A", "#0A0818"]} style={StyleSheet.absoluteFill} />

        {/* Static border */}
        <View style={styles.staticBorder} />

        {/* Active animated border overlay */}
        {isActive && (
          <Animated.View
            style={[styles.activeBorder, { opacity: activeBorderOpacity }]}
          />
        )}

        {/* Blueprint artwork */}
        <BlueprintArtwork project={project} isActive={isActive} statusColor={statusColor} />

        {/* Card body */}
        <View style={styles.body}>
          {/* Title row */}
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>{project.title}</Text>
            <Feather name="cpu" size={13} color="#2A2448" />
          </View>

          {/* Description */}
          <Text style={styles.desc} numberOfLines={2}>{project.description}</Text>

          {/* Badges */}
          <View style={styles.badges}>
            <View style={[styles.badge, styles.genreBadge]}>
              <Text style={styles.badgeText}>{project.genre}</Text>
            </View>
            <View style={[styles.badge, styles.artBadge]}>
              <Text style={styles.badgeText}>{project.artStyle}</Text>
            </View>
          </View>

          {/* Progress energy bar */}
          {isActive && (
            <EnergyProgressBar progress={project.progress} height={5} showLabel />
          )}

          {/* Footer */}
          <View style={styles.footer}>
            <Feather name="clock" size={11} color="#2A2448" />
            <Text style={styles.footerText}>{timeAgo(project.updatedAt)}</Text>
            <View style={styles.footerSpacer} />
            <Feather name="chevron-right" size={14} color="#2A2448" />
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
});

const art = StyleSheet.create({
  wrap: {
    height: 100,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  gridV1: { position: "absolute", left: "25%", top: 0, bottom: 0, width: 1, backgroundColor: "rgba(59,143,255,0.06)" },
  gridV2: { position: "absolute", left: "50%", top: 0, bottom: 0, width: 1, backgroundColor: "rgba(59,143,255,0.06)" },
  gridV3: { position: "absolute", left: "75%", top: 0, bottom: 0, width: 1, backgroundColor: "rgba(59,143,255,0.06)" },
  gridH1: { position: "absolute", left: 0, right: 0, top: "33%", height: 1, backgroundColor: "rgba(59,143,255,0.06)" },
  gridH2: { position: "absolute", left: 0, right: 0, top: "66%", height: 1, backgroundColor: "rgba(59,143,255,0.06)" },
  centralIcon: {
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 4,
  },
  rune: {
    position: "absolute",
    fontSize: 52,
    fontFamily: "Inter_700Bold",
    top: 4,
    right: 12,
  },
  crystalBadge: {
    position: "absolute",
    top: 10,
    left: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  crystalDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
    elevation: 2,
  },
  crystalLabel: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.3,
  },
});

const styles = StyleSheet.create({
  outerWrap: {
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  card: {
    borderRadius: 18,
    overflow: "hidden",
  },
  staticBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(42,38,64,0.8)",
  },
  activeBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#3B8FFF",
  },
  body: {
    padding: 14,
    gap: 6,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  title: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    color: "#C0B8E0",
    flex: 1,
  },
  desc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#3A3458",
    lineHeight: 18,
  },
  badges: {
    flexDirection: "row",
    gap: 6,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  genreBadge: {
    backgroundColor: "rgba(59,143,255,0.08)",
    borderColor: "rgba(59,143,255,0.2)",
  },
  artBadge: {
    backgroundColor: "rgba(155,75,255,0.08)",
    borderColor: "rgba(155,75,255,0.2)",
  },
  badgeText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: "#4A7ABF",
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  footerText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "#2A2448",
  },
  footerSpacer: { flex: 1 },
});
