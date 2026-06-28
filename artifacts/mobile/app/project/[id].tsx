import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
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
import { ProjectChatPanel } from "@/components/ProjectChatPanel";
import { GenLogicPanel } from "@/components/GenLogicPanel";
import { AssetGenerationPanel } from "@/components/AssetGenerationPanel";
import { DownloadExportPanel } from "@/components/DownloadExportPanel";
import { ExportFrameworkPanel } from "@/components/ExportFrameworkPanel";
import { ExportValidationPanel } from "@/components/ExportValidationPanel";
import { ProceduralSystemsPanel } from "@/components/ProceduralSystemsPanel";
import { QualityGates } from "@/components/QualityGates";
import { QADashboard } from "@/components/QADashboard";
import { PlaytestPanel } from "@/components/PlaytestPanel";
import { BalanceTunerPanel } from "@/components/BalanceTunerPanel";
import { PublishingHub } from "@/components/PublishingHub";
import { StoreListingPanel } from "@/components/StoreListingPanel";
import { AnalyticsDashboard } from "@/components/AnalyticsDashboard";
import { LiveOpsPanel } from "@/components/LiveOpsPanel";
import { MonetizationPanel } from "@/components/MonetizationPanel";
import { TaskGraph } from "@/components/TaskGraph";
import {
  generateAnalysis,
  generateBlueprint,
  generateTaskGraph,
  type PipelineTask,
} from "@/constants/generation-pipeline";
import { AGENT_DEFS } from "@/constants/agents";
import type { AgentState } from "@/components/AgentNetwork";
import { useAuth } from "@/context/AuthContext";
import { useProjects } from "@/context/ProjectsContext";
import { useColors } from "@/hooks/useColors";
import { GenerationConsole, type LiveJob } from "@/components/GenerationConsole";
import { IntentAnalyzerPanel } from "@/components/IntentAnalyzerPanel";
import { ProjectMemoryPanel } from "@/components/ProjectMemoryPanel";

interface GeneratedAsset {
  id: string;
  name: string;
  category: string;
  url: string | null;
  createdAt: string;
}

type Tab = "overview" | "blueprint" | "tasks" | "systems" | "assets" | "export" | "quality" | "agents" | "memory" | "chat" | "publish";
type PublishPlatform = "google-play" | "app-store" | "steam" | "itch-io" | "epic" | "direct";

export default function ProjectDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { projects, deleteProject } = useProjects();
  const { accessToken, user } = useAuth();
  const isGuest = !accessToken || user?.id === "guest";
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [publishPlatform, setPublishPlatform] = useState<PublishPlatform | null>(null);

  const [projectAssets, setProjectAssets] = useState<GeneratedAsset[]>([]);
  const [assetsLoading, setAssetsLoading] = useState(false);
  const [activeJob, setActiveJob] = useState<LiveJob | null>(null);
  const [startingJob, setStartingJob] = useState(false);

  const project = projects.find((p) => p.id === id);

  const startBackgroundGeneration = useCallback(async () => {
    if (!accessToken || !id || startingJob) return;
    setStartingJob(true);
    try {
      const res = await fetch(`/api/projects/${id}/generate-async`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          prompt: project?.prompt ?? "",
          genre: project?.genre ?? "RPG",
          artStyle: project?.artStyle ?? "Pixel Art",
          difficulty: "normal",
          gameLength: "medium",
          worldSize: "medium",
          numBosses: 3,
        }),
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        Alert.alert("Error", err.error ?? "Failed to start generation");
        return;
      }
      const data = (await res.json()) as { jobId: string; status: string };
      setActiveJob({
        id: data.jobId,
        type: "generate",
        status: "pending",
        phase: 1,
        progress: 0,
        label: "Queued…",
        logs: [],
        projectId: id,
        createdAt: new Date().toISOString(),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      Alert.alert("Error", "Could not reach the server");
    } finally {
      setStartingJob(false);
    }
  }, [accessToken, id, startingJob, project]);

  const fetchProjectAssets = useCallback(async () => {
    if (isGuest || !id || !accessToken) return;
    setAssetsLoading(true);
    try {
      const res = await fetch(`/api/projects/${id}/assets`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = (await res.json()) as { assets: GeneratedAsset[] };
        setProjectAssets(data.assets);
      }
    } catch {
      // ignore
    } finally {
      setAssetsLoading(false);
    }
  }, [id, isGuest, accessToken]);

  useEffect(() => {
    if (activeTab === "assets") fetchProjectAssets();
  }, [activeTab, fetchProjectAssets]);

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
    { key: "chat", label: "AI Chat", icon: "message-circle" },
    { key: "blueprint", label: "Blueprint", icon: "file-text" },
    { key: "tasks", label: "Tasks", icon: "list" },
    { key: "systems", label: "Systems", icon: "layers" },
    { key: "assets", label: "Assets", icon: "image" },
    { key: "export", label: "Export", icon: "upload" },
    { key: "quality", label: "Quality", icon: "shield" },
    { key: "agents", label: "Agents", icon: "cpu" },
    { key: "memory",  label: "Memory",  icon: "database" },
    { key: "publish", label: "Publish", icon: "send" },
  ];

  const completedTasks = tasks.filter((t) => t.status === "completed").length;
  const runningTasks = tasks.filter((t) => t.status === "running").length;
  const currentPhase = tasks.find((t) => t.status === "running")?.phase ?? 0;

  const liveAgentStates = useMemo((): AgentState[] => {
    if (!activeJob) return (project?.agentStates ?? []) as AgentState[];
    const ph = activeJob.phase;
    const done = activeJob.status === "completed" || activeJob.progress >= 100;
    return AGENT_DEFS.map((a) => ({
      agentId: a.id,
      status: (done ? "done" : a.phase < ph ? "done" : a.phase === ph ? "active" : "queued") as AgentState["status"],
    }));
  }, [activeJob, project?.agentStates]);

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

      {/* ─── CHAT (outside scroll — owns its own FlatList) ─── */}
      {activeTab === "chat" && (
        <ProjectChatPanel
          projectId={project.id}
          projectTitle={project.title}
          projectGenre={project.genre}
          hasGeneratedData={(project.progress ?? 0) > 0}
        />
      )}

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: bottomPad + 16 }}
        showsVerticalScrollIndicator={false}
        style={activeTab === "chat" ? { display: "none" } : undefined}
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

            {/* Intent Analyzer */}
            {!isGuest && (
              <IntentAnalyzerPanel
                projectId={project.id}
                prompt={project.prompt}
                genre={project.genre}
                artStyle={project.artStyle}
              />
            )}

            {/* Pipeline steps */}
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>GENERATION PIPELINE</Text>
            <AIProgressIndicator steps={project.steps} />

            {/* Active background job — live generation console */}
            {activeJob && (
              <GenerationConsole
                job={activeJob}
                onJobUpdate={(updated) => setActiveJob(updated)}
                onCancel={(jobId) => {
                  fetch(`/api/jobs/${jobId}`, {
                    method: "DELETE",
                    headers: { Authorization: `Bearer ${accessToken}` },
                  }).catch(() => {});
                  setActiveJob((j) => j ? { ...j, status: "cancelled" } : null);
                }}
              />
            )}

            {/* Quick actions */}
            <View style={styles.actionsGrid}>
              {[
                { icon: "message-square", label: "Continue in Chat", primary: true },
                { icon: "file-text", label: "View Blueprint", primary: false, onPress: () => setActiveTab("blueprint") },
                { icon: "list", label: "Task Graph", primary: false, onPress: () => setActiveTab("tasks") },
                { icon: "download", label: "Export", primary: false, onPress: () => setActiveTab("export") },
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

            {/* Background generate button */}
            {!isGuest && !activeJob && (
              <Pressable
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  void startBackgroundGeneration();
                }}
                disabled={startingJob}
                style={[
                  styles.asyncGenBtn,
                  { backgroundColor: "#7B2FFF22", borderColor: "#7B2FFF" },
                  startingJob && { opacity: 0.6 },
                ]}
              >
                {startingJob ? (
                  <ActivityIndicator size="small" color="#7B2FFF" />
                ) : (
                  <Feather name="cpu" size={18} color="#7B2FFF" />
                )}
                <View style={{ flex: 1 }}>
                  <Text style={[styles.asyncGenLabel, { color: "#7B2FFF" }]}>
                    {startingJob ? "Starting…" : "Generate in Background"}
                  </Text>
                  <Text style={[styles.asyncGenSub, { color: "#7B2FFF99" }]}>
                    Run the full pipeline without staying on this screen
                  </Text>
                </View>
                <Feather name="arrow-right" size={16} color="#7B2FFF" />
              </Pressable>
            )}
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

            {/* Generated images gallery */}
            {!isGuest && (
              <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>GENERATED IMAGES</Text>
                  <Pressable onPress={fetchProjectAssets} style={styles.refreshBtn}>
                    <Feather name="refresh-cw" size={13} color={colors.mutedForeground} />
                  </Pressable>
                </View>
                {assetsLoading ? (
                  <View style={styles.assetsLoading}>
                    <ActivityIndicator color={colors.primary} size="small" />
                    <Text style={[styles.assetsLoadingText, { color: colors.mutedForeground }]}>Loading images…</Text>
                  </View>
                ) : projectAssets.length === 0 ? (
                  <View style={styles.assetsEmpty}>
                    <Feather name="image" size={22} color={colors.mutedForeground} />
                    <Text style={[styles.assetsEmptyText, { color: colors.mutedForeground }]}>
                      {project.status === "in_progress" || project.status === "complete"
                        ? "No images generated yet. Tap Generate to create artwork."
                        : "Images appear here after AI generation runs."}
                    </Text>
                  </View>
                ) : (
                  <View style={styles.imageGrid}>
                    {projectAssets.map((asset) => (
                      <AssetImageCard key={asset.id} asset={asset} colors={colors} />
                    ))}
                  </View>
                )}
              </View>
            )}

            <AssetGenerationPanel />
          </View>
        )}

        {/* ─── EXPORT ─── */}
        {activeTab === "export" && (
          <View style={styles.tabContent}>
            <View style={[styles.blueprintBanner, { backgroundColor: colors.primary + "12", borderColor: colors.primary }]}>
              <Feather name="upload" size={14} color={colors.primary} />
              <Text style={[styles.blueprintBannerText, { color: colors.primary }]}>
                8 engines · Godot · Unity · Unreal · GameMaker · Construct · RPG Maker · Phaser · Generic
              </Text>
            </View>
            <ExportValidationPanel projectId={project.id} />
            <DownloadExportPanel
              projectId={project.id}
              projectTitle={project.title}
              progress={project.progress}
            />
            <ExportFrameworkPanel />
          </View>
        )}

        {/* ─── QUALITY ─── */}
        {activeTab === "quality" && (
          <View style={styles.tabContent}>
            <View style={[styles.blueprintBanner, { backgroundColor: colors.success + "12", borderColor: colors.success }]}>
              <Feather name="shield" size={14} color={colors.success} />
              <Text style={[styles.blueprintBannerText, { color: colors.success }]}>
                AI QA · 8 gates · Playtesting · Balance tuner · A11y
              </Text>
            </View>
            <QADashboard projectId={project.id as unknown as number} />
            <PlaytestPanel projectId={project.id as unknown as number} />
            <BalanceTunerPanel projectId={project.id as unknown as number} />
            <QualityGates />
          </View>
        )}

        {/* ─── AGENTS ─── */}
        {activeTab === "agents" && (
          <View style={styles.tabContent}>
            {activeJob && (
              <View style={[styles.blueprintBanner, { backgroundColor: colors.primary + "12", borderColor: colors.primary }]}>
                <Feather name="zap" size={14} color={colors.primary} />
                <Text style={[styles.blueprintBannerText, { color: colors.primary }]}>
                  Live · Phase {activeJob.phase} · {activeJob.progress}% · {activeJob.label}
                </Text>
              </View>
            )}
            <AgentNetwork agentStates={liveAgentStates} />
          </View>
        )}

        {/* ─── MEMORY ─── */}
        {activeTab === "memory" && (
          <View style={styles.tabContent}>
            <View style={[styles.blueprintBanner, { backgroundColor: colors.primary + "12", borderColor: colors.primary }]}>
              <Feather name="database" size={14} color={colors.primary} />
              <Text style={[styles.blueprintBannerText, { color: colors.primary }]}>
                Agent memory · Decisions persist across generation runs
              </Text>
            </View>
            <ProjectMemoryPanel projectId={project.id} />
          </View>
        )}

        {/* ─── PUBLISH ─── */}
        {activeTab === "publish" && (
          <View style={styles.tabContent}>
            <View style={[styles.blueprintBanner, { backgroundColor: "#22C55E12", borderColor: "#22C55E" }]}>
              <Feather name="send" size={14} color="#22C55E" />
              <Text style={[styles.blueprintBannerText, { color: "#22C55E" }]}>
                6 storefronts · Store listing · Analytics · LiveOps · Monetization
              </Text>
            </View>
            {publishPlatform ? (
              <StoreListingPanel
                projectId={project.id}
                platform={publishPlatform}
                onBack={() => setPublishPlatform(null)}
              />
            ) : (
              <PublishingHub
                projectId={project.id}
                onSelectPlatform={(p) => setPublishPlatform(p)}
              />
            )}
            <AnalyticsDashboard projectId={project.id} />
            <LiveOpsPanel projectId={project.id} />
            <MonetizationPanel />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const ASSET_CAT_COLOR: Record<string, string> = {
  cover: "#7B2FFF",
  character: "#2B7FFF",
  boss: "#EF4444",
  environment: "#22C55E",
};
const ASSET_CAT_ICON: Record<string, string> = {
  cover: "image",
  character: "user",
  boss: "shield",
  environment: "map",
};

function AssetImageCard({
  asset,
  colors,
}: {
  asset: GeneratedAsset;
  colors: ReturnType<typeof useColors>;
}) {
  const [imgErr, setImgErr] = useState(false);
  const color = ASSET_CAT_COLOR[asset.category] ?? "#2B7FFF";
  const icon = ASSET_CAT_ICON[asset.category] ?? "image";
  const hasImg = !!asset.url && !imgErr;

  return (
    <View style={[imgStyles.card, { backgroundColor: colors.muted, borderColor: colors.border }]}>
      {hasImg ? (
        <Image
          source={{ uri: asset.url! }}
          style={imgStyles.image}
          resizeMode="cover"
          onError={() => setImgErr(true)}
        />
      ) : (
        <View style={[imgStyles.placeholder, { backgroundColor: color + "22" }]}>
          <Feather name={icon as any} size={22} color={color} />
        </View>
      )}
      <View style={imgStyles.meta}>
        <View style={[imgStyles.catChip, { backgroundColor: color + "22" }]}>
          <Text style={[imgStyles.catText, { color }]}>{asset.category.toUpperCase()}</Text>
        </View>
        <Text style={[imgStyles.name, { color: colors.foreground }]} numberOfLines={2}>
          {asset.name}
        </Text>
      </View>
    </View>
  );
}

const imgStyles = StyleSheet.create({
  card: {
    width: "47%",
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  image: { width: "100%", aspectRatio: 1 },
  placeholder: { width: "100%", aspectRatio: 1, alignItems: "center", justifyContent: "center" },
  meta: { padding: 8, gap: 4 },
  catChip: { alignSelf: "flex-start", borderRadius: 4, paddingHorizontal: 5, paddingVertical: 2 },
  catText: { fontSize: 9, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
  name: { fontSize: 11, fontFamily: "Inter_500Medium", lineHeight: 15 },
});

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
  sectionHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  refreshBtn: { padding: 4 },
  assetsLoading: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12 },
  assetsLoadingText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  assetsEmpty: { alignItems: "center", gap: 8, paddingVertical: 20 },
  assetsEmptyText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 19 },
  imageGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  asyncGenBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
  },
  asyncGenLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  asyncGenSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
});
