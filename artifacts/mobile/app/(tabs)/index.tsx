import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ProjectCard } from "@/components/ProjectCard";
import { QuickAction } from "@/components/QuickAction";
import { useProjects } from "@/context/ProjectsContext";
import { useColors } from "@/hooks/useColors";

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { projects, isLoading } = useProjects();

  const topPad = Platform.OS === "web" ? 67 : insets.top + 16;
  const bottomPad = Platform.OS === "web" ? 34 + 84 : insets.bottom + 84;

  const activeProject = projects.find(
    (p) => p.status === "in_progress" || p.status === "generating"
  );
  const recentProjects = projects.slice(0, 3);

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: topPad, paddingBottom: bottomPad }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.inner}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
              Good evening
            </Text>
            <Text style={[styles.title, { color: colors.foreground }]}>
              GenForge
              <Text style={{ color: colors.primary }}>AI</Text>
            </Text>
          </View>
          <View style={[styles.notifBtn, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="bell" size={20} color={colors.foreground} />
            <View style={[styles.notifDot, { backgroundColor: colors.primary }]} />
          </View>
        </View>

        {/* Active Project Banner */}
        {activeProject && (
          <View style={[styles.activeBanner, { backgroundColor: colors.card, borderColor: colors.primary }]}>
            <View style={styles.activeBannerTop}>
              <View style={[styles.liveChip, { backgroundColor: colors.primary }]}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>GENERATING</Text>
              </View>
              <Text style={[styles.activeBannerTitle, { color: colors.foreground }]} numberOfLines={1}>
                {activeProject.title}
              </Text>
            </View>
            <View style={[styles.progressBg, { backgroundColor: colors.muted }]}>
              <View style={[styles.progressFill, {
                backgroundColor: colors.primary,
                width: `${activeProject.progress}%` as any,
              }]} />
            </View>
            <Text style={[styles.progressPct, { color: colors.primary }]}>
              {activeProject.progress}% complete
            </Text>
          </View>
        )}

        {/* Quick Actions */}
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>QUICK ACTIONS</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickRow}>
          <QuickAction
            icon="plus"
            label="Create Game"
            accent
            onPress={() => router.push("/new-game")}
          />
          <QuickAction
            icon="message-square"
            label="AI Chat"
            onPress={() => router.push("/(tabs)/chat")}
          />
          <QuickAction
            icon="folder"
            label="Projects"
            onPress={() => router.push("/(tabs)/projects")}
          />
          <QuickAction
            icon="image"
            label="Assets"
            onPress={() => router.push("/(tabs)/assets")}
          />
          <QuickAction
            icon="upload"
            label="Export"
            onPress={() => {}}
          />
        </ScrollView>

        {/* AI Activity */}
        <View style={[styles.aiBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.aiBoxHeader}>
            <Feather name="cpu" size={16} color={colors.primary} />
            <Text style={[styles.aiBoxTitle, { color: colors.foreground }]}>AI Activity</Text>
          </View>
          {[
            "World-building agent completed fantasy map",
            "Story agent generated 47 NPC dialogues",
            "Art agent rendered 320 sprite assets",
          ].map((item, i) => (
            <View key={i} style={styles.activityRow}>
              <View style={[styles.actDot, { backgroundColor: colors.success }]} />
              <Text style={[styles.actText, { color: colors.mutedForeground }]}>{item}</Text>
            </View>
          ))}
        </View>

        {/* Recent Projects */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>RECENT PROJECTS</Text>
          <Text
            style={[styles.seeAll, { color: colors.primary }]}
            onPress={() => router.push("/(tabs)/projects")}
          >
            See all
          </Text>
        </View>
        {isLoading ? (
          <View style={[styles.skeleton, { backgroundColor: colors.card }]} />
        ) : recentProjects.length === 0 ? (
          <View style={[styles.emptyBox, { borderColor: colors.border }]}>
            <Feather name="folder" size={32} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              No projects yet. Create your first game.
            </Text>
          </View>
        ) : (
          recentProjects.map((p) => <ProjectCard key={p.id} project={p} />)
        )}

        {/* Tip */}
        <View style={[styles.tip, { backgroundColor: colors.muted }]}>
          <Feather name="zap" size={14} color={colors.accent} />
          <Text style={[styles.tipText, { color: colors.mutedForeground }]}>
            Tip: Describe your game in one sentence. The AI handles the rest.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  inner: { paddingHorizontal: 20, gap: 20 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greeting: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  title: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  notifBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  notifDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activeBanner: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    gap: 10,
  },
  activeBannerTop: {
    gap: 6,
  },
  liveChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#fff",
  },
  liveText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    letterSpacing: 0.8,
  },
  activeBannerTitle: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
  },
  progressBg: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },
  progressPct: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  quickRow: { marginHorizontal: -20, paddingHorizontal: 20 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.2,
  },
  seeAll: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  aiBox: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  aiBoxHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 2,
  },
  aiBoxTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  actText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  skeleton: {
    height: 100,
    borderRadius: 16,
  },
  emptyBox: {
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    gap: 10,
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    paddingHorizontal: 32,
  },
  tip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  tipText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
});
