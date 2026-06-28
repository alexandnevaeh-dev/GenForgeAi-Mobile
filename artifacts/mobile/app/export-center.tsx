import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

type ExportTab = "projects" | "targets";

interface Project {
  id: string;
  title: string;
  genre: string;
  artStyle: string;
  progress: number;
  status: string;
  coverArt: string | null;
  lastGeneratedAt: string | null;
}

type ExportTarget = {
  name: string;
  icon: string;
  slug: string;
  status: "official" | "supported" | "beta";
  description: string;
};

const EXPORT_TARGETS: ExportTarget[] = [
  { name: "Godot 4.x",      slug: "godot",   icon: "layers",     status: "official",  description: "Full scene conversion, GDScript generation, auto-optimization." },
  { name: "Unity",          slug: "unity",   icon: "box",        status: "supported", description: "Asset conversion, prefab generation, C# scripting." },
  { name: "Unreal Engine",  slug: "unreal",  icon: "zap",        status: "beta",      description: "Blueprint generation, level design export, material conversion." },
  { name: "GameMaker",      slug: "gmaker",  icon: "code",       status: "supported", description: "GML generation, room export, sprite optimization." },
  { name: "HTML5",          slug: "html5",   icon: "globe",      status: "official",  description: "Phaser.js output, optimized web bundle, itch.io ready." },
  { name: "Android APK",    slug: "android", icon: "smartphone", status: "supported", description: "Signed APK with Play Store metadata." },
  { name: "Windows EXE",    slug: "windows", icon: "monitor",    status: "supported", description: "EXE installer with Steam compatibility." },
  { name: "Linux AppImage", slug: "linux",   icon: "terminal",   status: "supported", description: "AppImage and Flatpak formats." },
];

const PLATFORM_STATUS_COLOR: Record<string, string> = {
  official:  "#22C55E",
  supported: "#2B7FFF",
  beta:      "#F97316",
};

const PROJECT_STATUS_COLOR: Record<string, string> = {
  planning:    "#6B6B80",
  generating:  "#2B7FFF",
  in_progress: "#7B2FFF",
  complete:    "#22C55E",
  failed:      "#EF4444",
};

function TargetSelector({
  project,
  accessToken,
  onClose,
}: {
  project: Project;
  accessToken: string | null;
  onClose: () => void;
}) {
  const colors = useColors();
  const [exporting, setExporting] = useState<string | null>(null);

  async function doExport(target: ExportTarget) {
    if (!accessToken) { Alert.alert("Sign in required"); return; }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setExporting(target.slug);
    try {
      const res = await fetch(`/api/projects/${project.id}/export?target=${target.slug}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        const text = await res.text();
        Alert.alert("Export failed", text.slice(0, 200));
        return;
      }
      const blob = await res.blob();
      if (Platform.OS === "web") {
        const blobUrl = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = `${project.title.toLowerCase().replace(/\s+/g, "-")}-${target.slug}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(blobUrl);
        Alert.alert("Download started", `${project.title} → ${target.name} package downloading.`);
      } else {
        Alert.alert("Export ready", `${project.title} → ${target.name} package generated.`);
      }
      onClose();
    } catch (e) {
      Alert.alert("Export error", e instanceof Error ? e.message : "Unknown error");
    } finally {
      setExporting(null);
    }
  }

  return (
    <View style={[sel.root, { backgroundColor: colors.card, borderColor: colors.primary }]}>
      <View style={sel.header}>
        <Pressable onPress={onClose} style={sel.backBtn}>
          <Feather name="arrow-left" size={16} color={colors.mutedForeground} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[sel.title, { color: colors.foreground }]}>Export "{project.title}"</Text>
          <Text style={[sel.sub, { color: colors.mutedForeground }]}>Select target engine / platform</Text>
        </View>
      </View>
      {EXPORT_TARGETS.map((t) => (
        <Pressable
          key={t.slug}
          onPress={() => doExport(t)}
          disabled={!!exporting}
          style={[sel.row, { backgroundColor: colors.background, borderColor: colors.border }]}
        >
          <View style={[sel.icon, { backgroundColor: colors.muted }]}>
            <Feather name={t.icon as any} size={18} color={colors.primary} />
          </View>
          <View style={sel.info}>
            <Text style={[sel.name, { color: colors.foreground }]}>{t.name}</Text>
            <Text style={[sel.desc, { color: colors.mutedForeground }]} numberOfLines={1}>{t.description}</Text>
          </View>
          {exporting === t.slug
            ? <ActivityIndicator color={colors.primary} size="small" />
            : <View style={[sel.badge, { backgroundColor: PLATFORM_STATUS_COLOR[t.status] + "20" }]}>
                <Text style={[sel.badgeText, { color: PLATFORM_STATUS_COLOR[t.status] }]}>{t.status}</Text>
              </View>
          }
        </Pressable>
      ))}
    </View>
  );
}

const sel = StyleSheet.create({
  root:      { borderRadius: 16, borderWidth: 1.5, padding: 14, gap: 10 },
  header:    { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 4 },
  backBtn:   { padding: 4 },
  title:     { fontSize: 14, fontFamily: "Inter_700Bold" },
  sub:       { fontSize: 11, fontFamily: "Inter_400Regular" },
  row:       { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, borderWidth: 1, padding: 12 },
  icon:      { width: 36, height: 36, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  info:      { flex: 1 },
  name:      { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  desc:      { fontSize: 11, fontFamily: "Inter_400Regular" },
  badge:     { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5 },
  badgeText: { fontSize: 9, fontFamily: "Inter_700Bold" },
});

export default function ExportCenterScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { accessToken } = useAuth();

  const [activeTab, setActiveTab]           = useState<ExportTab>("projects");
  const [projects, setProjects]             = useState<Project[]>([]);
  const [loading, setLoading]               = useState(true);
  const [refreshing, setRefreshing]         = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const topPad    = Platform.OS === "web" ? 67 : insets.top + 16;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 16;

  const TABS: { label: string; value: ExportTab; icon: string }[] = [
    { label: "My Projects", value: "projects", icon: "list" },
    { label: "Targets",     value: "targets",  icon: "upload" },
  ];

  const fetchProjects = useCallback(async () => {
    if (!accessToken) { setLoading(false); return; }
    try {
      const res = await fetch("/api/projects", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = (await res.json()) as { projects: Project[] };
        setProjects(data.projects);
      }
    } catch { /* ignore */ } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [accessToken]);

  useEffect(() => { void fetchProjects(); }, [fetchProjects]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    void fetchProjects();
  }, [fetchProjects]);

  const readyCount  = projects.filter((p) => p.progress >= 50 || p.status === "complete").length;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>Export Center</Text>
        <View style={{ width: 22 }} />
      </View>

      {/* Stats */}
      <View style={[styles.statsRow, { borderBottomColor: colors.border }]}>
        {[
          { label: "Projects",  value: projects.length,   color: colors.primary },
          { label: "Ready",     value: readyCount,         color: "#22C55E" },
          { label: "Targets",   value: EXPORT_TARGETS.length, color: colors.accent },
          { label: "Platforms", value: 4,                  color: "#7B2FFF" },
        ].map((stat) => (
          <View key={stat.label} style={styles.statItem}>
            <Text style={[styles.statValue, { color: stat.color }]}>{stat.value}</Text>
            <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{stat.label}</Text>
          </View>
        ))}
      </View>

      {/* Tabs */}
      <View style={[styles.tabBar, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        {TABS.map((tab) => (
          <Pressable
            key={tab.value}
            onPress={() => { setActiveTab(tab.value); setSelectedProject(null); }}
            style={[styles.tab, activeTab === tab.value && [styles.tabActive, { borderBottomColor: colors.primary }]]}
          >
            <Feather name={tab.icon as any} size={14} color={activeTab === tab.value ? colors.primary : colors.mutedForeground} />
            <Text style={[styles.tabLabel, { color: activeTab === tab.value ? colors.primary : colors.mutedForeground }]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: bottomPad, gap: 12 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        {activeTab === "projects" && (
          <>
            {selectedProject ? (
              <TargetSelector
                project={selectedProject}
                accessToken={accessToken}
                onClose={() => setSelectedProject(null)}
              />
            ) : loading ? (
              <View style={styles.empty}>
                <ActivityIndicator color={colors.primary} />
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Loading projects…</Text>
              </View>
            ) : projects.length === 0 ? (
              <View style={styles.empty}>
                <Feather name="upload" size={36} color={colors.mutedForeground} />
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No projects yet</Text>
                <Pressable
                  onPress={() => router.push("/new-game" as any)}
                  style={[styles.createBtn, { backgroundColor: colors.primary }]}
                >
                  <Feather name="plus" size={14} color="#fff" />
                  <Text style={styles.createBtnText}>Create a project</Text>
                </Pressable>
              </View>
            ) : (
              projects.map((project) => {
                const canExport = project.progress >= 50 || project.status === "complete";
                const statusCol = PROJECT_STATUS_COLOR[project.status] ?? colors.mutedForeground;
                return (
                  <View
                    key={project.id}
                    style={[styles.projectCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  >
                    <View style={styles.projectHeader}>
                      <View style={[styles.projectIcon, { backgroundColor: statusCol + "20" }]}>
                        <Feather name="layers" size={18} color={statusCol} />
                      </View>
                      <View style={styles.projectInfo}>
                        <Text style={[styles.projectTitle, { color: colors.foreground }]} numberOfLines={1}>
                          {project.title}
                        </Text>
                        <Text style={[styles.projectMeta, { color: colors.mutedForeground }]}>
                          {project.genre} · {project.artStyle} · {project.progress}%
                        </Text>
                      </View>
                      <View style={[styles.statusChip, { backgroundColor: statusCol + "20" }]}>
                        <Text style={[styles.statusText, { color: statusCol }]}>{project.status}</Text>
                      </View>
                    </View>

                    <View style={[styles.progressBg, { backgroundColor: colors.border }]}>
                      <View style={[styles.progressFill, { width: `${project.progress}%` as any, backgroundColor: statusCol }]} />
                    </View>

                    <View style={styles.projectActions}>
                      <Pressable
                        onPress={() => router.push(`/project/${project.id}` as any)}
                        style={[styles.viewBtn, { borderColor: colors.border }]}
                      >
                        <Feather name="eye" size={13} color={colors.mutedForeground} />
                        <Text style={[styles.viewBtnText, { color: colors.mutedForeground }]}>Open</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => {
                          if (!canExport) {
                            Alert.alert("Not ready yet", "Generate at least 50% of your project first.");
                            return;
                          }
                          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                          setSelectedProject(project);
                        }}
                        style={[styles.exportBtn, { backgroundColor: canExport ? colors.primary : colors.muted }]}
                      >
                        <Feather name="upload" size={13} color={canExport ? "#fff" : colors.mutedForeground} />
                        <Text style={[styles.exportBtnText, { color: canExport ? "#fff" : colors.mutedForeground }]}>
                          {canExport ? "Export" : "Not ready"}
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })
            )}
          </>
        )}

        {activeTab === "targets" && (
          EXPORT_TARGETS.map((target) => (
            <View key={target.slug} style={[styles.targetCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.targetHeader}>
                <View style={[styles.targetIcon, { backgroundColor: colors.muted }]}>
                  <Feather name={target.icon as any} size={20} color={colors.primary} />
                </View>
                <View style={styles.targetInfo}>
                  <Text style={[styles.targetName, { color: colors.foreground }]}>{target.name}</Text>
                  <Text style={[styles.targetDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
                    {target.description}
                  </Text>
                </View>
                <View style={[styles.platformChip, { backgroundColor: PLATFORM_STATUS_COLOR[target.status] + "22" }]}>
                  <Text style={[styles.platformText, { color: PLATFORM_STATUS_COLOR[target.status] }]}>
                    {target.status.charAt(0).toUpperCase() + target.status.slice(1)}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:           { flex: 1 },
  header:         { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 12, borderBottomWidth: 1 },
  title:          { fontSize: 20, fontFamily: "Inter_700Bold" },
  statsRow:       { flexDirection: "row", paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1 },
  statItem:       { flex: 1, alignItems: "center", gap: 2 },
  statValue:      { fontSize: 22, fontFamily: "Inter_700Bold" },
  statLabel:      { fontSize: 11, fontFamily: "Inter_400Regular" },
  tabBar:         { flexDirection: "row", borderBottomWidth: 1, paddingHorizontal: 16 },
  tab:            { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5, paddingVertical: 11, borderBottomWidth: 2, borderBottomColor: "transparent" },
  tabActive:      {},
  tabLabel:       { fontSize: 13, fontFamily: "Inter_500Medium" },
  empty:          { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyText:      { fontSize: 15, fontFamily: "Inter_400Regular" },
  createBtn:      { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 12, marginTop: 4 },
  createBtnText:  { color: "#fff", fontSize: 14, fontFamily: "Inter_600SemiBold" },
  projectCard:    { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  projectHeader:  { flexDirection: "row", alignItems: "center", gap: 10 },
  projectIcon:    { width: 42, height: 42, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  projectInfo:    { flex: 1 },
  projectTitle:   { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  projectMeta:    { fontSize: 12, fontFamily: "Inter_400Regular" },
  statusChip:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText:     { fontSize: 10, fontFamily: "Inter_700Bold" },
  progressBg:     { height: 4, borderRadius: 2, overflow: "hidden" },
  progressFill:   { height: 4, borderRadius: 2 },
  projectActions: { flexDirection: "row", gap: 10 },
  viewBtn:        { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 9, borderRadius: 10, borderWidth: 1 },
  viewBtnText:    { fontSize: 13, fontFamily: "Inter_500Medium" },
  exportBtn:      { flex: 2, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 9, borderRadius: 10 },
  exportBtnText:  { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  targetCard:     { borderRadius: 14, borderWidth: 1, padding: 14 },
  targetHeader:   { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  targetIcon:     { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  targetInfo:     { flex: 1 },
  targetName:     { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  targetDesc:     { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17, marginTop: 3 },
  platformChip:   { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  platformText:   { fontSize: 10, fontFamily: "Inter_600SemiBold" },
});
