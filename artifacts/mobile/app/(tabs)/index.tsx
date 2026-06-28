import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Drawer } from "@/components/Drawer";
import { NotificationPanel } from "@/components/NotificationPanel";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { BlueprintProjectCard } from "@/components/home/BlueprintProjectCard";
import { ForgeAIConsole } from "@/components/home/ForgeAIConsole";
import { ForgeConsoleBanner } from "@/components/home/ForgeConsoleBanner";
import { ForgeHeader } from "@/components/home/ForgeHeader";
import { ForgeQuickAction } from "@/components/home/ForgeQuickAction";
import { GuildNoticeBoard } from "@/components/home/GuildNoticeBoard";
import { MagicScrollTip } from "@/components/home/MagicScrollTip";
import { ScrollTemplateCard } from "@/components/home/ScrollTemplateCard";
import { useNotifications } from "@/context/NotificationsContext";
import { useProjects } from "@/context/ProjectsContext";

type HomeTpl = { id: string; title: string; genre: string; priceCents: number; badge?: string };

const QUICK_ACTIONS = [
  { icon: "plus" as const,         label: "Create Game", route: "/new-game",           gradientColors: ["#0A2050", "#1A4090", "#3B8FFF"] as [string,string,string], glowColor: "#3B8FFF", floatDelay: 0 },
  { icon: "message-square" as const, label: "AI Studio",   route: "/(tabs)/chat",       gradientColors: ["#1E0A40", "#4A1A8A", "#9B4BFF"] as [string,string,string], glowColor: "#9B4BFF", floatDelay: 220 },
  { icon: "folder" as const,        label: "Projects",    route: "/(tabs)/projects",   gradientColors: ["#0A1A40", "#163070", "#1E5AB0"] as [string,string,string], glowColor: "#1E6AFF", floatDelay: 440 },
  { icon: "image" as const,         label: "Assets",      route: "/(tabs)/assets",     gradientColors: ["#061828", "#0E3850", "#1A6890"] as [string,string,string], glowColor: "#1A88AA", floatDelay: 660 },
  { icon: "shopping-bag" as const,  label: "Marketplace", route: "/marketplace",       gradientColors: ["#281408", "#6A3810", "#C07020"] as [string,string,string], glowColor: "#C07020", floatDelay: 880 },
  { icon: "upload" as const,        label: "Export",      route: "/export-center",     gradientColors: ["#06200E", "#124530", "#1A8050"] as [string,string,string], glowColor: "#1A9060", floatDelay: 1100 },
];

function ForgeSectionLabel({ text, onAction, actionLabel }: { text: string; onAction?: () => void; actionLabel?: string }) {
  return (
    <View style={s.sectionRow}>
      <View style={s.sectionDiamond} />
      <Text style={s.sectionTitle}>{text}</Text>
      {onAction && actionLabel && (
        <Pressable onPress={onAction} style={s.sectionAction}>
          <Text style={s.sectionActionText}>{actionLabel}</Text>
          <Feather name="chevron-right" size={11} color="#5BA8FF" />
        </Pressable>
      )}
    </View>
  );
}

function SkeletonBlueprint() {
  const shimmer = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 1, duration: 900, useNativeDriver: false }),
        Animated.timing(shimmer, { toValue: 0, duration: 900, useNativeDriver: false }),
      ])
    ).start();
  }, [shimmer]);
  const bg = shimmer.interpolate({ inputRange: [0, 1], outputRange: ["#0E0C1A", "#161430"] });
  return <Animated.View style={[s.skeleton, { backgroundColor: bg }]} />;
}

function EmptyBlueprint() {
  return (
    <View style={s.emptyWrap}>
      <LinearGradient colors={["#0A0E1C", "#0C1020"]} style={StyleSheet.absoluteFill} />
      <View style={s.emptyBorder} />
      <Feather name="folder" size={32} color="#2A3A5A" />
      <Text style={s.emptyTitle}>No blueprints yet</Text>
      <Text style={s.emptyBody}>Forge your first game to see it here.</Text>
    </View>
  );
}

export default function HomeScreen() {
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
      // non-fatal
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
    <View style={s.root}>
      {/* Layered animated background */}
      <AnimatedBackground />

      {/* Top gradient veil — blends content with background */}
      <LinearGradient
        colors={["rgba(11,9,20,0.92)", "rgba(11,9,20,0.6)", "rgba(11,9,20,0)"]}
        style={[s.topVeil, { height: topPad + 60 }]}
        pointerEvents="none"
      />

      <Drawer visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
      <NotificationPanel visible={notifOpen} onClose={() => setNotifOpen(false)} />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={{ paddingTop: topPad, paddingBottom: bottomPad }}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.inner}>
          {/* Header */}
          <ForgeHeader
            onMenuPress={() => setDrawerOpen(true)}
            onBellPress={() => setNotifOpen(true)}
            unreadCount={unreadCount}
          />

          {/* Active Project — Forge Console Banner */}
          {activeProject && (
            <ForgeConsoleBanner
              title={activeProject.title}
              progress={activeProject.progress}
              onPress={() => router.push(`/project/${activeProject.id}`)}
            />
          )}

          {/* Quick Actions — Enchanted Crystals */}
          <ForgeSectionLabel text="QUICK ACTIONS" />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={s.quickRow}
            contentContainerStyle={s.quickContent}
          >
            {QUICK_ACTIONS.map((qa) => (
              <ForgeQuickAction
                key={qa.label}
                icon={qa.icon}
                label={qa.label}
                gradientColors={qa.gradientColors}
                glowColor={qa.glowColor}
                floatDelay={qa.floatDelay}
                onPress={() => router.push(qa.route as any)}
              />
            ))}
          </ScrollView>

          {/* AI Activity — Control Console */}
          <ForgeAIConsole />

          {/* Trending Templates — Magic Scrolls */}
          <ForgeSectionLabel
            text="TRENDING TEMPLATES"
            onAction={() => router.push("/marketplace")}
            actionLabel="Browse all"
          />
          {trendingTemplates.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={s.tplRow}
              contentContainerStyle={s.tplContent}
            >
              {trendingTemplates.map((t) => {
                const badge = t.badge ?? (t.priceCents === 0 ? "FREE" : `$${(t.priceCents / 100).toFixed(2)}`);
                return <ScrollTemplateCard key={t.id} title={t.title} genre={t.genre} badge={badge} />;
              })}
            </ScrollView>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={s.tplRow}
              contentContainerStyle={s.tplContent}
            >
              {[
                { id: "1", title: "Metroidvania Starter", genre: "Platformer", priceCents: 0 },
                { id: "2", title: "Cozy Farm Sim", genre: "Simulation", priceCents: 0 },
                { id: "3", title: "Match-3 Puzzle Kit", genre: "Puzzle", priceCents: 999 },
                { id: "4", title: "Dark Fantasy RPG", genre: "RPG", priceCents: 0 },
              ].map((t) => (
                <ScrollTemplateCard
                  key={t.id}
                  title={t.title}
                  genre={t.genre}
                  badge={t.priceCents === 0 ? "FREE" : `$${(t.priceCents / 100).toFixed(2)}`}
                />
              ))}
            </ScrollView>
          )}

          {/* Recent Projects — Blueprint Tables */}
          <ForgeSectionLabel
            text="RECENT BLUEPRINTS"
            onAction={() => router.push("/(tabs)/projects")}
            actionLabel="See all"
          />
          {isLoading ? (
            <SkeletonBlueprint />
          ) : recentProjects.length === 0 ? (
            <EmptyBlueprint />
          ) : (
            recentProjects.map((p) => <BlueprintProjectCard key={p.id} project={p} />)
          )}

          {/* Community — Guild Notice Board */}
          <GuildNoticeBoard />

          {/* Tip — Magic Scroll */}
          <MagicScrollTip />
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0B0914",
  },
  topVeil: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 0,
  },
  scroll: {
    flex: 1,
    backgroundColor: "transparent",
  },
  inner: {
    paddingHorizontal: 20,
    gap: 20,
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionDiamond: {
    width: 7,
    height: 7,
    backgroundColor: "#3B8FFF",
    transform: [{ rotate: "45deg" }],
    shadowColor: "#3B8FFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
    elevation: 2,
  },
  sectionTitle: {
    flex: 1,
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    color: "#4A4A6A",
    letterSpacing: 1.4,
  },
  sectionAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  sectionActionText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: "#5BA8FF",
  },
  quickRow: {
    marginHorizontal: -20,
  },
  quickContent: {
    paddingHorizontal: 20,
    gap: 10,
    paddingBottom: 8,
  },
  tplRow: {
    marginHorizontal: -20,
  },
  tplContent: {
    paddingHorizontal: 20,
    paddingBottom: 4,
  },
  skeleton: {
    height: 110,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#1E1E40",
  },
  emptyWrap: {
    borderRadius: 16,
    overflow: "hidden",
    alignItems: "center",
    gap: 10,
    paddingVertical: 36,
    paddingHorizontal: 24,
  },
  emptyBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "#1E2E4A",
  },
  emptyTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    color: "#2A3A5A",
  },
  emptyBody: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#1E2840",
    textAlign: "center",
  },
});
