import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { GameProject } from "@/context/ProjectsContext";
import { useColors } from "@/hooks/useColors";

interface Props {
  project: GameProject;
}

const STATUS_LABEL: Record<GameProject["status"], string> = {
  planning: "Planning",
  generating: "Generating",
  in_progress: "In Progress",
  complete: "Complete",
  exported: "Exported",
};

export function ProjectCard({ project }: Props) {
  const colors = useColors();
  const scale = React.useRef(new Animated.Value(1)).current;

  const onPressIn = () => {
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true }).start();
  };
  const onPressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start();
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/project/${project.id}`);
  };

  const isActive = project.status === "generating" || project.status === "in_progress";

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={handlePress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <View style={styles.header}>
          <View style={[styles.statusDot, {
            backgroundColor: project.status === "complete" ? colors.success :
              isActive ? colors.primary :
              project.status === "exported" ? colors.accent :
              colors.mutedForeground
          }]} />
          <Text style={[styles.status, { color: colors.mutedForeground }]}>
            {STATUS_LABEL[project.status]}
          </Text>
          <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
        </View>

        <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>
          {project.title}
        </Text>
        <Text style={[styles.desc, { color: colors.mutedForeground }]} numberOfLines={2}>
          {project.description}
        </Text>

        <View style={styles.footer}>
          <View style={styles.tags}>
            <View style={[styles.tag, { backgroundColor: colors.muted }]}>
              <Text style={[styles.tagText, { color: colors.mutedForeground }]}>{project.genre}</Text>
            </View>
            <View style={[styles.tag, { backgroundColor: colors.muted }]}>
              <Text style={[styles.tagText, { color: colors.mutedForeground }]}>{project.artStyle}</Text>
            </View>
          </View>
          {isActive && (
            <View style={styles.progressRow}>
              <View style={[styles.progressBg, { backgroundColor: colors.muted }]}>
                <View style={[styles.progressFill, {
                  backgroundColor: colors.primary,
                  width: `${project.progress}%` as any,
                }]} />
              </View>
              <Text style={[styles.progressText, { color: colors.mutedForeground }]}>
                {project.progress}%
              </Text>
            </View>
          )}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 8,
    marginBottom: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  status: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
  },
  desc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  footer: {
    gap: 8,
    marginTop: 4,
  },
  tags: {
    flexDirection: "row",
    gap: 6,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
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
    overflow: "hidden",
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },
  progressText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    width: 32,
    textAlign: "right",
  },
});
