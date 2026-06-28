import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Line } from "react-native-svg";

import { GameProject } from "@/context/ProjectsContext";

const STATUS_LABEL: Record<GameProject["status"], string> = {
  planning: "Planning",
  generating: "Generating",
  in_progress: "In Progress",
  complete: "Complete",
  exported: "Exported",
};

const STATUS_CRYSTAL: Record<GameProject["status"], string> = {
  planning: "#7B7890",
  generating: "#3B8FFF",
  in_progress: "#9B4BFF",
  complete: "#10B981",
  exported: "#00E5FF",
};

function BlueprintGrid({ width, height }: { width: number; height: number }) {
  const gap = 14;
  const lines = [];
  for (let x = gap; x < width; x += gap) {
    lines.push(<Line key={`v${x}`} x1={x} y1={0} x2={x} y2={height} stroke="#3B6FFF" strokeWidth={0.4} strokeOpacity={0.18} />);
  }
  for (let y = gap; y < height; y += gap) {
    lines.push(<Line key={`h${y}`} x1={0} y1={y} x2={width} y2={y} stroke="#3B6FFF" strokeWidth={0.4} strokeOpacity={0.18} />);
  }
  return (
    <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
      {lines}
    </Svg>
  );
}

interface Props {
  project: GameProject;
}

export function BlueprintProjectCard({ project }: Props) {
  const scale = useRef(new Animated.Value(1)).current;
  const crystalPulse = useRef(new Animated.Value(1)).current;
  const isActive = project.status === "generating" || project.status === "in_progress";
  const crystalColor = STATUS_CRYSTAL[project.status];

  React.useEffect(() => {
    if (isActive) {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(crystalPulse, { toValue: 1.5, duration: 700, useNativeDriver: true }),
          Animated.timing(crystalPulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        ])
      );
      anim.start();
      return () => anim.stop();
    }
    crystalPulse.setValue(1);
    return undefined;
  }, [isActive, crystalPulse]);

  return (
    <Animated.View style={[styles.cardWrap, { transform: [{ scale }] }]}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push(`/project/${project.id}`);
        }}
        onPressIn={() => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, tension: 80, friction: 6 }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 60, friction: 10 }).start()}
        style={styles.card}
      >
        <LinearGradient
          colors={["#0A0E1C", "#0C1020", "#080B17"]}
          style={StyleSheet.absoluteFill}
        />
        <BlueprintGrid width={340} height={100} />
        <View style={styles.borderOverlay} />

        <View style={styles.header}>
          {/* Status crystal */}
          <Animated.View
            style={[
              styles.crystal,
              {
                backgroundColor: crystalColor,
                shadowColor: crystalColor,
                transform: [{ scale: crystalPulse }],
              },
            ]}
          />
          <Text style={[styles.status, { color: crystalColor }]}>{STATUS_LABEL[project.status]}</Text>
          <Feather name="chevron-right" size={14} color="#3B5A8F" />
        </View>

        <Text style={styles.title} numberOfLines={1}>{project.title}</Text>
        <Text style={styles.desc} numberOfLines={2}>{project.description}</Text>

        <View style={styles.footer}>
          <View style={styles.tags}>
            <View style={styles.tag}>
              <Text style={styles.tagText}>{project.genre}</Text>
            </View>
            <View style={styles.tag}>
              <Text style={styles.tagText}>{project.artStyle}</Text>
            </View>
          </View>
          {isActive && (
            <View style={styles.progressRow}>
              <View style={styles.progressBg}>
                <LinearGradient
                  colors={["#2B7FFF", "#7B4FFF"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[styles.progressFill, { width: `${project.progress}%` as any }]}
                />
              </View>
              <Text style={styles.pctText}>{project.progress}%</Text>
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cardWrap: {
    marginBottom: 12,
    shadowColor: "#2B5FBF",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 14,
    elevation: 8,
  },
  card: {
    borderRadius: 16,
    overflow: "hidden",
    padding: 16,
    gap: 8,
  },
  borderOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1E2E4A",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  crystal: {
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 5,
    elevation: 3,
  },
  status: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
    color: "#C8D8F0",
  },
  desc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#4A5878",
    lineHeight: 18,
  },
  footer: {
    gap: 8,
    marginTop: 2,
  },
  tags: {
    flexDirection: "row",
    gap: 6,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: "rgba(59,111,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(59,111,255,0.2)",
  },
  tagText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: "#5B8FBF",
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  progressBg: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#1A2540",
    overflow: "hidden",
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },
  pctText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: "#4A7ABF",
    width: 32,
    textAlign: "right",
  },
});
