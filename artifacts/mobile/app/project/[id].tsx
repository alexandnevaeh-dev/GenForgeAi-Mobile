import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AIProgressIndicator } from "@/components/AIProgressIndicator";
import { useProjects } from "@/context/ProjectsContext";
import { useColors } from "@/hooks/useColors";

export default function ProjectDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { projects, deleteProject } = useProjects();

  const project = projects.find((p) => p.id === id);
  const topPad = Platform.OS === "web" ? 67 : insets.top + 12;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 16;

  if (!project) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, paddingTop: topPad }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <View style={styles.notFound}>
          <Feather name="alert-circle" size={40} color={colors.mutedForeground} />
          <Text style={[styles.notFoundText, { color: colors.mutedForeground }]}>Project not found</Text>
        </View>
      </View>
    );
  }

  const handleDelete = () => {
    Alert.alert("Delete Project", `Delete "${project.title}"? This cannot be undone.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          deleteProject(project.id);
          router.back();
        },
      },
    ]);
  };

  const statusColor =
    project.status === "complete" || project.status === "exported"
      ? colors.success
      : project.status === "generating" || project.status === "in_progress"
      ? colors.primary
      : colors.mutedForeground;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>
          {project.title}
        </Text>
        <Pressable onPress={handleDelete} style={styles.deleteBtn}>
          <Feather name="trash-2" size={18} color={colors.destructive} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: bottomPad }}
        showsVerticalScrollIndicator={false}
      >
        {/* Status Banner */}
        <View style={[styles.statusBanner, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {project.status.replace("_", " ").toUpperCase()}
            </Text>
          </View>
          {project.status !== "planning" && (
            <>
              <View style={[styles.progressBg, { backgroundColor: colors.muted }]}>
                <View style={[styles.progressFill, { backgroundColor: statusColor, width: `${project.progress}%` as any }]} />
              </View>
              <Text style={[styles.progressPct, { color: statusColor }]}>{project.progress}%</Text>
            </>
          )}
        </View>

        {/* Details */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>DESCRIPTION</Text>
          <Text style={[styles.sectionBody, { color: colors.foreground }]}>{project.description}</Text>

          <View style={styles.detailGrid}>
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>Genre</Text>
              <Text style={[styles.detailValue, { color: colors.foreground }]}>{project.genre}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>Art Style</Text>
              <Text style={[styles.detailValue, { color: colors.foreground }]}>{project.artStyle}</Text>
            </View>
          </View>

          <View style={styles.tagsRow}>
            {project.tags.map((tag) => (
              <View key={tag} style={[styles.tag, { backgroundColor: colors.muted }]}>
                <Text style={[styles.tagText, { color: colors.mutedForeground }]}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* AI Progress */}
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>AI GENERATION PIPELINE</Text>
        <AIProgressIndicator steps={project.steps} />

        {/* Actions */}
        <View style={styles.actionsGrid}>
          {[
            { icon: "message-square", label: "Continue in Chat", primary: true },
            { icon: "refresh-cw", label: "Regenerate", primary: false },
            { icon: "download", label: "Export", primary: false },
            { icon: "share-2", label: "Share", primary: false },
          ].map((action) => (
            <Pressable
              key={action.label}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                if (action.label === "Continue in Chat") router.push("/(tabs)/chat");
              }}
              style={[
                styles.actionBtn,
                {
                  backgroundColor: action.primary ? colors.primary : colors.card,
                  borderColor: action.primary ? colors.primary : colors.border,
                },
              ]}
            >
              <Feather
                name={action.icon as any}
                size={18}
                color={action.primary ? "#fff" : colors.foreground}
              />
              <Text style={[styles.actionLabel, { color: action.primary ? "#fff" : colors.foreground }]}>
                {action.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: { padding: 4 },
  deleteBtn: { padding: 4 },
  headerTitle: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  statusBanner: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 8,
    marginBottom: 16,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.8,
  },
  progressBg: {
    height: 5,
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: 5,
    borderRadius: 3,
  },
  progressPct: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  section: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.2,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.2,
    marginBottom: 8,
  },
  sectionBody: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },
  detailGrid: {
    flexDirection: "row",
    gap: 20,
  },
  detailItem: { gap: 2 },
  detailLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  detailValue: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  tagsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tagText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 16,
  },
  actionBtn: {
    width: "47%",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    flex: 1,
  },
  notFound: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  notFoundText: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
});
