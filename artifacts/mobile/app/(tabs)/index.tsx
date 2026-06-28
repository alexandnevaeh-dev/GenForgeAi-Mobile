import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Drawer } from "@/components/Drawer";
import { NotificationPanel } from "@/components/NotificationPanel";
import { ProjectCard } from "@/components/ProjectCard";
import { QuickAction } from "@/components/QuickAction";
import { useNotifications } from "@/context/NotificationsContext";
import { useProjects } from "@/context/ProjectsContext";
import { useColors } from "@/hooks/useColors";

type HomeTpl = { id: string; title: string; genre: string; priceCents: number; badge?: string };

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { projects, isLoading } = useProjects();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const { unreadCount } = useNotifications();
  const [trendingTemplates, setTrendingTemplates] = useState<HomeTpl[]>([]);

  const fetchTrending = useCallback(async () => {
    try {
      const res = await fetch("/api/templates?limit=4");
      if (!res.ok) return;
      const data = (await res.json()) as { templates: HomeTpl[] };
      setTrendingTemplates(data.templates.slice(0, 4));
    } catch {
      // non-fatal, keep empty
    }
  }, []);

  useEffect(() => { void fetchTrending(); }, [fetchTrending]);

  const topPad = Platform.OS === "web" ? 67 : insets.top + 16;
  const bottomPad = Platform.OS === "web" ? 34 + 84 : insets.bottom + 84;

  const activeProject = projects.find(
    (p) => p.status === "in_progress" || p.status === "generating"
  );
  const recentProjects = projects.slice(0, 3);

  return (
    <>
      <Drawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <NotificationPanel visible={notifOpen} onClose={() => setNotifOpen(false)} />

      <ScrollView
        style={[styles.scroll, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingTop: topPad, paddingBottom: bottomPad }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.inner}>
          {/* Header */}
          <View style={styles.headerRow}>
            <Pressable
              onPress={() => setDrawerOpen(true)}
              style={[styles.menuBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Feather name="menu" size={20} color={colors.foreground} />
            </Pressable>
            <Text style={[styles.title, { color: colors.foreground }]}>
              GenForge
              <Text style={{ color: colors.primary }}>AI</Text>
            </Text>
            <Pressable
              onPress={() => setNotifOpen(true)}
              style={[styles.notifBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Feather name="bell" size={20} color={colors.foreground} />
              {unreadCount > 0 && (
                <View style={[styles.notifBadge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.notifBadgeText}>
                    {unreadCount > 9 ? "9+" : String(unreadCount)}
                  </Text>
                </View>
              )}
            </Pressable>
          </View>

          {/* Active Project Banner */}
          {activeProject && (
            <Pressable
              onPress={() => router.push(`/project/${activeProject.id}`)}
              style={[styles.activeBanner, { backgroundColor: colors.card, borderColor: colors.primary }]}
            >
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
              <View style={styles.bannerFooter}>
                <Text style={[styles.progressPct, { color: colors.primary }]}>
                  {activeProject.progress}% complete
                </Text>
                <Text style={[styles.bannerTap, { color: colors.mutedForeground }]}>
                  View details →
                </Text>
              </View>
            </Pressable>
          )}

          {/* Quick Actions */}
          <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>QUICK ACTIONS</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickRow}>
            <QuickAction icon="plus" label="Create Game" accent onPress={() => router.push("/new-game")} />
            <QuickAction icon="message-square" label="AI Studio" onPress={() => router.push("/(tabs)/chat")} />
            <QuickAction icon="folder" label="Projects" onPress={() => router.push("/(tabs)/projects")} />
            <QuickAction icon="image" label="Assets" onPress={() => router.push("/(tabs)/assets")} />
            <QuickAction icon="shopping-bag" label="Marketplace" onPress={() => router.push("/marketplace")} />
            <QuickAction icon="upload" label="Export" onPress={() => router.push("/export-center")} />
          </ScrollView>

          {/* AI Activity */}
          <View style={[styles.aiBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.aiBoxHeader}>
              <Feather name="cpu" size={16} color={colors.primary} />
              <Text style={[styles.aiBoxTitle, { color: colors.foreground }]}>AI Activity</Text>
              <View style={[styles.onlineDot, { backgroundColor: colors.success }]} />
              <Text style={[styles.onlineText, { color: colors.success }]}>23 agents active</Text>
            </View>
            {[
              "World-building agent completed fantasy map",
              "Story agent generated 47 NPC dialogues",
              "Pixel Art agent rendered 320 sprite assets",
            ].map((item, i) => (
              <View key={i} style={styles.activityRow}>
                <View style={[styles.actDot, { backgroundColor: colors.success }]} />
                <Text style={[styles.actText, { color: colors.mutedForeground }]}>{item}</Text>
              </View>
            ))}
          </View>

          {/* Trending Templates */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>TRENDING TEMPLATES</Text>
            <Text style={[styles.seeAll, { color: colors.primary }]} onPress={() => router.push("/marketplace")}>
              Browse all
            </Text>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.templateRow}>
            {trendingTemplates.map((t) => {
              const badge = t.badge ?? (t.priceCents === 0 ? "FREE" : `$${(t.priceCents / 100).toFixed(2)}`);
              return (
                <Pressable
                  key={t.id}
                  onPress={() => router.push("/marketplace")}
                  style={[styles.templateCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <View style={[styles.templateIcon, { backgroundColor: colors.muted }]}>
                    <Feather name="layout" size={22} color={colors.primary} />
                  </View>
                  <Text style={[styles.templateName, { color: colors.foreground }]} numberOfLines={2}>{t.title}</Text>
                  <View style={styles.templateFooter}>
                    <Text style={[styles.templateGenre, { color: colors.mutedForeground }]}>{t.genre}</Text>
                    <Text style={[styles.templateBadge, { color: badge === "FREE" ? colors.success : colors.foreground }]}>
                      {badge}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Recent Projects */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>RECENT PROJECTS</Text>
            <Text style={[styles.seeAll, { color: colors.primary }]} onPress={() => router.push("/(tabs)/projects")}>
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

          {/* Community Highlight */}
          <View style={[styles.communityBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.communityHeader}>
              <Feather name="users" size={15} color={colors.secondary} />
              <Text style={[styles.communityTitle, { color: colors.foreground }]}>Community Highlights</Text>
              <Text style={[styles.seeAll, { color: colors.primary }]} onPress={() => router.push("/community")}>
                View all
              </Text>
            </View>
            <Text style={[styles.communityText, { color: colors.mutedForeground }]}>
              2,341 developers are building games right now. "Dark Fantasy Starter" is trending this week.
            </Text>
          </View>

          {/* Tip */}
          <View style={[styles.tip, { backgroundColor: colors.muted }]}>
            <Feather name="zap" size={14} color={colors.accent} />
            <Text style={[styles.tipText, { color: colors.mutedForeground }]}>
              Tip: Describe your game in one sentence. The Master Game Director handles the rest.
            </Text>
          </View>
        </View>
      </ScrollView>
    </>
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
  menuBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  notifBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  notifBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  notifBadgeText: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  activeBanner: {
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    gap: 10,
  },
  activeBannerTop: { gap: 6 },
  liveChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#fff" },
  liveText: { fontSize: 10, fontFamily: "Inter_700Bold", color: "#fff", letterSpacing: 0.8 },
  activeBannerTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  progressBg: { height: 4, borderRadius: 2, overflow: "hidden" },
  progressFill: { height: 4, borderRadius: 2 },
  bannerFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  progressPct: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  bannerTap: { fontSize: 12, fontFamily: "Inter_400Regular" },
  quickRow: { marginHorizontal: -20, paddingHorizontal: 20 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 1.2 },
  seeAll: { fontSize: 13, fontFamily: "Inter_500Medium" },
  aiBox: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  aiBoxHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 2 },
  aiBoxTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", flex: 1 },
  onlineDot: { width: 6, height: 6, borderRadius: 3 },
  onlineText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  activityRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  actDot: { width: 6, height: 6, borderRadius: 3 },
  actText: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  templateRow: { marginHorizontal: -20, paddingHorizontal: 20 },
  templateCard: {
    width: 130,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 8,
    marginRight: 10,
  },
  templateIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  templateName: { fontSize: 13, fontFamily: "Inter_600SemiBold", lineHeight: 18 },
  templateFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  templateGenre: { fontSize: 11, fontFamily: "Inter_400Regular" },
  templateBadge: { fontSize: 11, fontFamily: "Inter_700Bold" },
  skeleton: { height: 100, borderRadius: 16 },
  emptyBox: {
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    gap: 10,
    paddingVertical: 32,
  },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", paddingHorizontal: 32 },
  communityBox: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8 },
  communityHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  communityTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", flex: 1 },
  communityText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
  tip: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, padding: 12, marginBottom: 8 },
  tipText: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
});
