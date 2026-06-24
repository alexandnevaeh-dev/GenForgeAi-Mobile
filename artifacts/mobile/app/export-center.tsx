import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
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

import { useColors } from "@/hooks/useColors";

type ExportTab = "queue" | "history" | "targets";

interface ExportJob {
  id: string;
  project: string;
  target: string;
  targetIcon: string;
  status: "building" | "validating" | "ready" | "error" | "queued";
  progress: number;
  size?: string;
  time?: string;
  errors?: number;
}

const JOBS: ExportJob[] = [
  {
    id: "1", project: "Shadow Rift Chronicles", target: "Godot 4.x",
    targetIcon: "layers", status: "building", progress: 67,
  },
  {
    id: "2", project: "Shadow Rift Chronicles", target: "HTML5",
    targetIcon: "globe", status: "queued", progress: 0,
  },
];

const HISTORY: ExportJob[] = [
  {
    id: "h1", project: "Neon Runners", target: "HTML5",
    targetIcon: "globe", status: "ready", progress: 100, size: "18.4 MB", time: "2h ago",
  },
  {
    id: "h2", project: "Neon Runners", target: "Android APK",
    targetIcon: "smartphone", status: "ready", progress: 100, size: "42.1 MB", time: "2h ago",
  },
  {
    id: "h3", project: "Void Prototype", target: "Unity",
    targetIcon: "box", status: "error", progress: 78, errors: 3, time: "Yesterday",
  },
];

const EXPORT_TARGETS = [
  { name: "Godot 4.x", icon: "layers", status: "official", description: "Full scene conversion, GDScript generation, auto-optimization." },
  { name: "Unity", icon: "box", status: "supported", description: "Asset conversion, prefab generation, C# scripting." },
  { name: "Unreal Engine", icon: "zap", status: "beta", description: "Blueprint generation, level design export, material conversion." },
  { name: "GameMaker", icon: "code", status: "supported", description: "GML generation, room export, sprite optimization." },
  { name: "HTML5", icon: "globe", status: "official", description: "Phaser.js output, optimized web bundle, itch.io ready." },
  { name: "Android APK", icon: "smartphone", status: "supported", description: "Signed APK with Play Store metadata." },
  { name: "Windows", icon: "monitor", status: "supported", description: "EXE installer with Steam compatibility." },
  { name: "macOS", icon: "airplay", status: "beta", description: "DMG with notarization support." },
  { name: "Linux", icon: "terminal", status: "supported", description: "AppImage and Flatpak formats." },
];

const STATUS_COLORS = {
  building: "#2B7FFF",
  validating: "#7B2FFF",
  ready: "#22C55E",
  error: "#EF4444",
  queued: "#6B6B80",
};

const PLATFORM_STATUS_COLOR = {
  official: "#22C55E",
  supported: "#2B7FFF",
  beta: "#F97316",
};

function JobCard({ job }: { job: ExportJob }) {
  const colors = useColors();
  const [downloaded, setDownloaded] = useState(false);

  return (
    <View style={[styles.jobCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.jobHeader}>
        <View style={[styles.jobIcon, { backgroundColor: colors.muted }]}>
          <Feather name={job.targetIcon as any} size={18} color={colors.primary} />
        </View>
        <View style={styles.jobInfo}>
          <Text style={[styles.jobProject, { color: colors.foreground }]}>{job.project}</Text>
          <Text style={[styles.jobTarget, { color: colors.mutedForeground }]}>{job.target}</Text>
        </View>
        <View style={[styles.statusChip, { backgroundColor: STATUS_COLORS[job.status] + "22" }]}>
          <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[job.status] }]} />
          <Text style={[styles.statusText, { color: STATUS_COLORS[job.status] }]}>
            {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
          </Text>
        </View>
      </View>

      {(job.status === "building" || job.status === "validating") && (
        <View>
          <View style={[styles.progressBg, { backgroundColor: colors.muted }]}>
            <View style={[styles.progressFill, { backgroundColor: STATUS_COLORS[job.status], width: `${job.progress}%` as any }]} />
          </View>
          <Text style={[styles.progressPct, { color: STATUS_COLORS[job.status] }]}>{job.progress}%</Text>
        </View>
      )}

      {job.errors && (
        <View style={[styles.errorRow, { backgroundColor: colors.destructive + "11" }]}>
          <Feather name="alert-triangle" size={13} color={colors.destructive} />
          <Text style={[styles.errorText, { color: colors.destructive }]}>{job.errors} errors found — tap to view</Text>
        </View>
      )}

      {job.status === "ready" && (
        <View style={styles.readyRow}>
          {job.size && <Text style={[styles.sizeText, { color: colors.mutedForeground }]}>{job.size} · {job.time}</Text>}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setDownloaded(true);
            }}
            style={[styles.downloadBtn, { backgroundColor: downloaded ? colors.success : colors.primary }]}
          >
            <Feather name={downloaded ? "check" : "download"} size={14} color="#fff" />
            <Text style={styles.downloadText}>{downloaded ? "Downloaded" : "Download"}</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

export default function ExportCenterScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<ExportTab>("queue");

  const topPad = Platform.OS === "web" ? 67 : insets.top + 16;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 16;

  const TABS: { label: string; value: ExportTab; icon: string }[] = [
    { label: "Queue", value: "queue", icon: "list" },
    { label: "History", value: "history", icon: "clock" },
    { label: "Targets", value: "targets", icon: "upload" },
  ];

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
          { label: "In Queue", value: JOBS.filter((j) => j.status !== "ready" && j.status !== "error").length, color: colors.primary },
          { label: "Ready", value: HISTORY.filter((j) => j.status === "ready").length, color: colors.success },
          { label: "Errors", value: HISTORY.filter((j) => j.status === "error").length, color: colors.destructive },
          { label: "Targets", value: EXPORT_TARGETS.length, color: colors.accent },
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
            onPress={() => setActiveTab(tab.value)}
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
      >
        {activeTab === "queue" && (
          <>
            {JOBS.length === 0 ? (
              <View style={styles.empty}>
                <Feather name="upload" size={36} color={colors.mutedForeground} />
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>No active exports</Text>
              </View>
            ) : (
              JOBS.map((job) => <JobCard key={job.id} job={job} />)
            )}
          </>
        )}

        {activeTab === "history" && (
          HISTORY.map((job) => <JobCard key={job.id} job={job} />)
        )}

        {activeTab === "targets" && (
          EXPORT_TARGETS.map((target) => (
            <View key={target.name} style={[styles.targetCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
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
                <View style={[styles.platformChip, { backgroundColor: PLATFORM_STATUS_COLOR[target.status as keyof typeof PLATFORM_STATUS_COLOR] + "22" }]}>
                  <Text style={[styles.platformText, { color: PLATFORM_STATUS_COLOR[target.status as keyof typeof PLATFORM_STATUS_COLOR] }]}>
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
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  title: { fontSize: 20, fontFamily: "Inter_700Bold" },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  statItem: { flex: 1, alignItems: "center", gap: 2 },
  statValue: { fontSize: 22, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  tabBar: { flexDirection: "row", borderBottomWidth: 1, paddingHorizontal: 16 },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 11,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {},
  tabLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  jobCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  jobHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  jobIcon: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  jobInfo: { flex: 1 },
  jobProject: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  jobTarget: { fontSize: 12, fontFamily: "Inter_400Regular" },
  statusChip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 7 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  progressBg: { height: 5, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: 5, borderRadius: 3 },
  progressPct: { fontSize: 11, fontFamily: "Inter_600SemiBold", marginTop: 4 },
  errorRow: { flexDirection: "row", alignItems: "center", gap: 7, padding: 8, borderRadius: 8 },
  errorText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  readyRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sizeText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  downloadBtn: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 9 },
  downloadText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#fff" },
  empty: { alignItems: "center", paddingVertical: 60, gap: 12 },
  emptyText: { fontSize: 15, fontFamily: "Inter_400Regular" },
  targetCard: { borderRadius: 14, borderWidth: 1, padding: 14 },
  targetHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  targetIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  targetInfo: { flex: 1 },
  targetName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  targetDesc: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17, marginTop: 3 },
  platformChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  platformText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
});
