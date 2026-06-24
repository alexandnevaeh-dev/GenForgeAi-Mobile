import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ProjectCard } from "@/components/ProjectCard";
import { useProjects } from "@/context/ProjectsContext";
import { useColors } from "@/hooks/useColors";

type Filter = "all" | "in_progress" | "complete" | "planning";
type ViewMode = "list" | "grid";

const FILTERS: { label: string; value: Filter }[] = [
  { label: "All", value: "all" },
  { label: "In Progress", value: "in_progress" },
  { label: "Complete", value: "complete" },
  { label: "Planning", value: "planning" },
];

const STATUS_COLOR: Record<string, string> = {
  in_progress: "#2B7FFF",
  generating: "#2B7FFF",
  complete: "#22C55E",
  exported: "#00D4FF",
  planning: "#6B6B80",
};

function GridCard({ project }: { project: ReturnType<typeof useProjects>["projects"][number] }) {
  const colors = useColors();
  const isActive = project.status === "generating" || project.status === "in_progress";
  const statusColor = STATUS_COLOR[project.status] ?? colors.mutedForeground;

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push(`/project/${project.id}`);
      }}
      style={[styles.gridCard, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={[styles.gridThumb, { backgroundColor: colors.muted }]}>
        <Feather name="layers" size={28} color={colors.primary} />
        {isActive && (
          <View style={[styles.gridLiveBadge, { backgroundColor: colors.primary }]}>
            <View style={styles.gridLiveDot} />
          </View>
        )}
      </View>
      <View style={styles.gridInfo}>
        <Text style={[styles.gridTitle, { color: colors.foreground }]} numberOfLines={1}>
          {project.title}
        </Text>
        <Text style={[styles.gridMeta, { color: colors.mutedForeground }]} numberOfLines={1}>
          {project.genre} · {project.artStyle}
        </Text>
        {isActive && (
          <View style={[styles.gridProgressBg, { backgroundColor: colors.border }]}>
            <View style={[styles.gridProgressFill, { backgroundColor: statusColor, width: `${project.progress}%` as any }]} />
          </View>
        )}
        <View style={styles.gridStatusRow}>
          <View style={[styles.gridDot, { backgroundColor: statusColor }]} />
          <Text style={[styles.gridStatus, { color: statusColor }]}>
            {project.status.replace("_", " ")}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function ProjectsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { projects, isLoading } = useProjects();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("list");

  const topPad = Platform.OS === "web" ? 67 : insets.top + 16;
  const bottomPad = Platform.OS === "web" ? 34 + 84 : insets.bottom + 84;

  const filtered = projects.filter((p) => {
    const matchesSearch =
      !search ||
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.description.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filter === "all" ||
      p.status === filter ||
      (filter === "in_progress" && p.status === "generating");
    return matchesSearch && matchesFilter;
  });

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: topPad, paddingBottom: bottomPad }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.inner}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.foreground }]}>Projects</Text>
          <View style={styles.headerActions}>
            {/* View mode toggle */}
            <View style={[styles.viewToggle, { backgroundColor: colors.muted }]}>
              <Pressable
                onPress={() => setViewMode("list")}
                style={[styles.viewBtn, viewMode === "list" && [styles.viewBtnActive, { backgroundColor: colors.card }]]}
              >
                <Feather name="list" size={15} color={viewMode === "list" ? colors.primary : colors.mutedForeground} />
              </Pressable>
              <Pressable
                onPress={() => setViewMode("grid")}
                style={[styles.viewBtn, viewMode === "grid" && [styles.viewBtnActive, { backgroundColor: colors.card }]]}
              >
                <Feather name="grid" size={15} color={viewMode === "grid" ? colors.primary : colors.mutedForeground} />
              </Pressable>
            </View>
            <Pressable onPress={() => router.push("/new-game")} style={[styles.newBtn, { backgroundColor: colors.primary }]}>
              <Feather name="plus" size={18} color="#fff" />
            </Pressable>
          </View>
        </View>

        {/* Search */}
        <View style={[styles.searchWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search projects..."
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")}>
              <Feather name="x" size={16} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>

        {/* Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {FILTERS.map((f) => (
            <Pressable
              key={f.value}
              onPress={() => setFilter(f.value)}
              style={[
                styles.filterChip,
                {
                  backgroundColor: filter === f.value ? colors.primary : colors.card,
                  borderColor: filter === f.value ? colors.primary : colors.border,
                },
              ]}
            >
              <Text style={[styles.filterText, { color: filter === f.value ? "#fff" : colors.mutedForeground }]}>
                {f.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Stats row */}
        <View style={styles.statsRow}>
          {[
            { label: "Total", value: projects.length },
            {
              label: "Active",
              value: projects.filter((p) => p.status === "in_progress" || p.status === "generating").length,
            },
            {
              label: "Done",
              value: projects.filter((p) => p.status === "complete" || p.status === "exported").length,
            },
          ].map((stat) => (
            <View key={stat.label} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.statValue, { color: colors.foreground }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {/* List / Grid */}
        {isLoading ? (
          [1, 2, 3].map((i) => (
            <View key={i} style={[styles.skeleton, { backgroundColor: colors.card }]} />
          ))
        ) : filtered.length === 0 ? (
          <View style={[styles.emptyBox, { borderColor: colors.border }]}>
            <Feather name="folder" size={40} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No projects found</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              {search ? "Try a different search term" : "Create your first game to get started"}
            </Text>
          </View>
        ) : viewMode === "list" ? (
          filtered.map((p) => <ProjectCard key={p.id} project={p} />)
        ) : (
          <View style={styles.gridContainer}>
            {filtered.map((p) => <GridCard key={p.id} project={p} />)}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  inner: { paddingHorizontal: 20, gap: 16 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", letterSpacing: -0.3 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },
  viewToggle: {
    flexDirection: "row",
    borderRadius: 10,
    padding: 3,
    gap: 2,
  },
  viewBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  viewBtnActive: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  newBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  filterRow: { marginHorizontal: -20, paddingHorizontal: 20 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  filterText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: { flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: 12, borderWidth: 1, gap: 2 },
  statValue: { fontSize: 22, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 11, fontFamily: "Inter_500Medium" },
  skeleton: { height: 120, borderRadius: 16, marginBottom: 12 },
  emptyBox: {
    alignItems: "center",
    gap: 10,
    paddingVertical: 48,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
  },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  emptyText: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", paddingHorizontal: 32 },
  gridContainer: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  gridCard: {
    width: "47%",
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  gridThumb: {
    height: 90,
    alignItems: "center",
    justifyContent: "center",
  },
  gridLiveBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  gridLiveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#fff" },
  gridInfo: { padding: 10, gap: 4 },
  gridTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  gridMeta: { fontSize: 11, fontFamily: "Inter_400Regular" },
  gridProgressBg: { height: 3, borderRadius: 2, overflow: "hidden", marginTop: 2 },
  gridProgressFill: { height: 3, borderRadius: 2 },
  gridStatusRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  gridDot: { width: 5, height: 5, borderRadius: 3 },
  gridStatus: { fontSize: 10, fontFamily: "Inter_500Medium", textTransform: "capitalize" },
});
