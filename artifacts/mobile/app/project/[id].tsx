import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
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

import { AgentNetwork } from "@/components/AgentNetwork";
import { AIProgressIndicator } from "@/components/AIProgressIndicator";
import { BlueprintPanel } from "@/components/BlueprintPanel";
import { GenLogicPanel } from "@/components/GenLogicPanel";
import { AssetGenerationPanel } from "@/components/AssetGenerationPanel";
import { ProceduralSystemsPanel } from "@/components/ProceduralSystemsPanel";
import { QualityGates } from "@/components/QualityGates";
import { TaskGraph } from "@/components/TaskGraph";
import {
  generateAnalysis,
  generateBlueprint,
  generateTaskGraph,
  type PipelineTask,
} from "@/constants/generation-pipeline";
import { useProjects } from "@/context/ProjectsContext";
import { useColors } from "@/hooks/useColors";

type Tab = "overview" | "blueprint" | "tasks" | "systems" | "assets" | "quality" | "agents" | "memory";

export default function ProjectDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { projects, deleteProject } = useProjects();
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const project = projects.find((p) => p.id === id);
  const topPad = Platform.OS === "web" ? 67 : insets.top + 12;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 16;

  // Derive blueprint & task graph from project data
  const { blueprint, tasks } = useMemo(() => {
    if (!project) return { blueprint: null, tasks: [] as PipelineTask[] };
    const params = {
      prompt: project.prompt,
      genre: project.genre,
      artStyle: project.artStyle,
      platform: project.tags.filter((t) => !["RPG","Action","Platformer","Strategy","Puzzle","Horror","Adventure","Simulation","Fighting","Shooter","Pixel Art","Low Poly","Realistic","Cartoon","Isometric","Voxel","Anime"].includes(t)),
      difficulty: "normal" as const,
      gameLength: "medium" as const,
      worldSize: "medium" as const,
      exportTarget: "Godot 4.x",
      numBosses: 3,
      narrativeFocus: "medium" as const,
      replayability: "medium" as const,
      mode: "autonomous" as const,
      perspective: "2D" as const,
      multiplayerMode: "none" as const,
      accessibility: true,
    };
    const analysis = generateAnalysis(params);
    const bp = generateBlueprint(analysis, params);
    const progress = project.progress ?? 0;
    const tg = generateTaskGraph(bp, params).map((t) => ({
      ...t,
      status: progress >= 100 ? "completed" as const
        : t.phase < Math.ceil((progress / 100) * 6) ? "completed" as const
        : t.phase === Math.ceil((progress / 100) * 6) ? "running" as const
        : "pending" as const,
      progress: progress >= 100 ? 100
        : t.phase < Math.ceil((progress / 100) * 6) ? 100
        : t.phase === Math.ceil((progress / 100) * 6) ? progress
        : 0,
    }));
    return { blueprint: bp, tasks: tg };
  }, [project?.id, project?.progress]);

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

  const TABS: { key: Tab; label: string; icon: string }[] = [
    { key: "overview", label: "Overview", icon: "home" },
    { key: "blueprint", label: "Blueprint", icon: "file-text" },
    { key: "tasks", label: "Tasks", icon: "list" },
    { key: "systems", label: "Systems", icon: "layers" },
    { key: "assets", label: "Assets", icon: "image" },
    { key: "quality", label: "Quality", icon: "shield" },
    { key: "agents", label: "Agents", icon: "cpu" },
    { key: "memory", label: "Memory", icon: "database" },
  ];

  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const runningTasks = tasks.filter((t) => t.status === "running").length;
  const currentPhase = tasks.find((t) => t.status === "running")?.phase ?? 0;

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

      {/* Status pill */}
      <View style={[styles.statusPill, { backgroundColor: statusColor + "18", borderColor: statusColor }]}>
        <View style={[styles.statusDotInline, { backgroundColor: statusColor }]} />
        <Text style={[styles.statusPillText, { color: statusColor }]}>
          {project.status.replace("_", " ").toUpperCase()}
        </Text>
        <Text style={[styles.statusPillPct, { color: statusColor }]}>{project.progress}%</Text>
        {runningTasks > 0 && (
          <Text style={[styles.statusPillMeta, { color: colors.mutedForeground }]}>
            · {completedTasks}/{tasks.length} tasks
          </Text>
        )}
      </View>

      {/* Tab bar — horizontal scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.tabBarScroll, { borderBottomColor: colors.border }]}
        contentContainerStyle={styles.tabBarContent}
      >
        {TABS.map((tab) => (
          <Pressable
            key={tab.key}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab(tab.key);
            }}
            style={[
              styles.tab,
              activeTab === tab.key && [styles.tabActive, { borderBottomColor: colors.primary }],
            ]}
          >
            <Feather
              name={tab.icon as any}
              size={13}
              color={activeTab === tab.key ? colors.primary : colors.mutedForeground}
            />
            <Text style={[styles.tabLabel, { color: activeTab === tab.key ? colors.primary : colors.mutedForeground }]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: bottomPad + 16 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── OVERVIEW ─── */}
        {activeTab === "overview" && (
          <View style={styles.tabContent}>
            {/* Progress bar */}
            <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.progressBg, { backgroundColor: colors.muted }]}>
                <View style={[styles.progressFill, { backgroundColor: statusColor, width: `${project.progress}%` as any }]} />
              </View>
              <View style={styles.progressMeta}>
                <Text style={[styles.progressLabel, { color: colors.mutedForeground }]}>Generation Progress</Text>
                <Text style={[styles.progressPct, { color: statusColor }]}>{project.progress}%</Text>
              </View>
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
                <View style={styles.detailItem}>
                  <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>Tasks</Text>
                  <Text style={[styles.detailValue, { color: colors.foreground }]}>{completedTasks}/{tasks.length}</Text>
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

            {/* Pipeline steps */}
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>GENERATION PIPELINE</Text>
            <AIProgressIndicator steps={project.steps} />

            {/* Quick actions */}
            <View style={styles.actionsGrid}>
              {[
                { icon: "message-square", label: "Continue in Chat", primary: true },
                { icon: "file-text", label: "View Blueprint", primary: false, onPress: () => setActiveTab("blueprint") },
                { icon: "list", label: "Task Graph", primary: false, onPress: () => setActiveTab("tasks") },
                { icon: "download", label: "Export", primary: false },
              ].map((action) => (
                <Pressable
                  key={action.label}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    if (action.label === "Continue in Chat") router.push("/(tabs)/chat");
                    if (action.onPress) action.onPress();
                  }}
                  style={[
                    styles.actionBtn,
                    { backgroundColor: action.primary ? colors.primary : colors.card, borderColor: action.primary ? colors.primary : colors.border },
                  ]}
                >
                  <Feather name={action.icon as any} size={18} color={action.primary ? "#fff" : colors.foreground} />
                  <Text style={[styles.actionLabel, { color: action.primary ? "#fff" : colors.foreground }]}>
                    {action.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* ─── BLUEPRINT ─── */}
        {activeTab === "blueprint" && blueprint && (
          <View style={styles.tabContent}>
            <View style={[styles.blueprintBanner, { backgroundColor: colors.primary + "12", borderColor: colors.primary }]}>
              <Feather name="file-text" size={14} color={colors.primary} />
              <Text style={[styles.blueprintBannerText, { color: colors.primary }]}>
                Source of truth · Generated by Master Game Director
              </Text>
            </View>
            <BlueprintPanel blueprint={blueprint} />
          </View>
        )}

        {/* ─── TASKS ─── */}
        {activeTab === "tasks" && (
          <View style={styles.tabContent}>
            <View style={[styles.tasksBanner, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="git-branch" size={14} color={colors.accent} />
              <Text style={[styles.tasksBannerText, { color: colors.mutedForeground }]}>
                {tasks.length} tasks across 6 phases · {completedTasks} complete · {runningTasks} running
              </Text>
            </View>
            <TaskGraph tasks={tasks} currentPhase={currentPhase} />
          </View>
        )}

        {/* ─── SYSTEMS ─── */}
        {activeTab === "systems" && (
          <View style={styles.tabContent}>
            <View style={[styles.blueprintBanner, { backgroundColor: colors.secondary + "12", borderColor: colors.secondary }]}>
              <Feather name="layers" size={14} color={colors.secondary} />
              <Text style={[styles.blueprintBannerText, { color: colors.secondary }]}>
                Procedural systems · World, Story, Combat, Enemies, Loot & Replayability
              </Text>
            </View>
            <ProceduralSystemsPanel />
          </View>
        )}

        {/* ─── ASSETS ─── */}
        {activeTab === "assets" && (
          <View style={styles.tabContent}>
            <View style={[styles.blueprintBanner, { backgroundColor: colors.accent + "12", borderColor: colors.accent }]}>
              <Feather name="image" size={14} color={colors.accent} />
              <Text style={[styles.blueprintBannerText, { color: colors.accent }]}>
                Asset pipeline · Art, Audio, Database & Living Asset System
              </Text>
            </View>
            <AssetGenerationPanel />
          </View>
        )}

        {/* ─── QUALITY ─── */}
        {activeTab === "quality" && (
          <View style={styles.tabContent}>
            <View style={[styles.blueprintBanner, { backgroundColor: colors.success + "12", borderColor: colors.success }]}>
              <Feather name="shield" size={14} color={colors.success} />
              <Text style={[styles.blueprintBannerText, { color: colors.success }]}>
                8 quality gates · Run after each generation phase
              </Text>
            </View>
            <QualityGates />
          </View>
        )}

        {/* ─── AGENTS ─── */}
        {activeTab === "agents" && (
          <View style={styles.tabContent}>
            <AgentNetwork agentStates={project.agentStates ?? []} />
          </View>
        )}

        {/* ─── MEMORY ─── */}
        {activeTab === "memory" && (
          <View style={styles.tabContent}>
            <GenLogicPanel genre={project.genre} artStyle={project.artStyle} prompt={project.prompt} />

            {/* Project Memory */}
            <View style={[styles.memoryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>PROJECT MEMORY</Text>
              {[
                { key: "Naming Convention", value: "Fantasy-Latin compound words for places, Anglo-Saxon for characters" },
                { key: "Visual Theme", value: `${project.artStyle} with dark palette and glowing particle accents` },
                { key: "Audio Theme", value: "Dynamic orchestral — calm exploration, intense combat layers" },
                { key: "World Rules", value: "Magic has energy cost, regions unlock sequentially, no fast travel in dungeons" },
                { key: "Approved Designs", value: "Protagonist: knight silhouette, 4 boss concepts confirmed" },
              ].map((item) => (
                <View key={item.key} style={[styles.memoryRow, { borderTopColor: colors.border }]}>
                  <Text style={[styles.memoryKey, { color: colors.primary }]}>{item.key}</Text>
                  <Text style={[styles.memoryVal, { color: colors.foreground }]}>{item.value}</Text>
                </View>
              ))}
            </View>

            {/* Agent communication log */}
            <View style={[styles.memoryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>AGENT COMMUNICATION LOG</Text>
              {[
                { agent: "World Architect", msg: "Overworld map generated. 6 biomes defined with distinct rules.", time: "3h ago" },
                { agent: "Story Architect", msg: "Main narrative arc finalized. 3 alternate endings written.", time: "3h ago" },
                { agent: "Enemy Designer", msg: "47 enemy variants with full behavior trees and loot tables.", time: "2h ago" },
                { agent: "Balance Agent", msg: "Combat simulation passed. Difficulty curve within tolerance.", time: "1h ago" },
                { agent: "QA Validator", msg: "7/8 quality gates passed. Export readiness: 74% (minor asset gap).", time: "45m ago" },
                { agent: "Master Game Director", msg: "Phase 5 complete. Initiating asset finalization and export prep.", time: "30m ago" },
              ].map((log, i) => (
                <View key={i} style={[styles.logRow, { borderTopColor: colors.border }]}>
                  <View style={[styles.logDot, { backgroundColor: colors.primary }]} />
                  <View style={styles.logBody}>
                    <Text style={[styles.logAgent, { color: colors.primary }]}>{log.agent}</Text>
                    <Text style={[styles.logMsg, { color: colors.foreground }]}>{log.msg}</Text>
                    <Text style={[styles.logTime, { color: colors.mutedForeground }]}>{log.time}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
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
  headerTitle: { flex: 1, fontSize: 16, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 2,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  statusDotInline: { width: 6, height: 6, borderRadius: 3 },
  statusPillText: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 0.6 },
  statusPillPct: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  statusPillMeta: { fontSize: 11, fontFamily: "Inter_400Regular" },
  tabBarScroll: { borderBottomWidth: 1, flexGrow: 0 },
  tabBarContent: { paddingHorizontal: 12, gap: 0 },
  tab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 11,
    paddingHorizontal: 10,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {},
  tabLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  tabContent: { gap: 16 },
  section: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 12 },
  sectionLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 1.2 },
  sectionTitle: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 1.2, marginBottom: -8 },
  sectionBody: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 21 },
  progressBg: { height: 6, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: 6, borderRadius: 3 },
  progressMeta: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  progressLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  progressPct: { fontSize: 13, fontFamily: "Inter_700Bold" },
  detailGrid: { flexDirection: "row", gap: 24, flexWrap: "wrap" },
  detailItem: { gap: 2 },
  detailLabel: { fontSize: 11, fontFamily: "Inter_500Medium" },
  detailValue: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  tagText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  actionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  actionBtn: {
    width: "47%",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionLabel: { fontSize: 12, fontFamily: "Inter_500Medium", flex: 1 },
  blueprintBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
  },
  blueprintBannerText: { fontSize: 12, fontFamily: "Inter_500Medium", flex: 1 },
  tasksBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
  },
  tasksBannerText: { fontSize: 12, fontFamily: "Inter_400Regular", flex: 1 },
  memoryCard: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 0 },
  memoryRow: { paddingVertical: 10, borderTopWidth: 1, gap: 3 },
  memoryKey: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  memoryVal: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  logRow: { flexDirection: "row", gap: 10, paddingTop: 10, borderTopWidth: 1 },
  logDot: { width: 6, height: 6, borderRadius: 3, marginTop: 5, flexShrink: 0 },
  logBody: { flex: 1, gap: 2 },
  logAgent: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  logMsg: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  logTime: { fontSize: 11, fontFamily: "Inter_400Regular" },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  notFoundText: { fontSize: 16, fontFamily: "Inter_400Regular" },
});
