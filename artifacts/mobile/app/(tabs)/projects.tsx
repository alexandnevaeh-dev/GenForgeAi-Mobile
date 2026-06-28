import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import { Platform, ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { ArchiveHeader } from "@/components/projects/ArchiveHeader";
import { MagicSearchBar } from "@/components/projects/MagicSearchBar";
import { CrystalChip } from "@/components/projects/CrystalChip";
import { StatCrystalCard } from "@/components/projects/StatCrystalCard";
import { BlueprintCard } from "@/components/projects/BlueprintCard";
import { GridBlueprintCard } from "@/components/projects/GridBlueprintCard";
import { ArchiveEmptyState } from "@/components/projects/ArchiveEmptyState";
import { BlueprintSkeleton } from "@/components/projects/BlueprintSkeleton";
import { useProjects } from "@/context/ProjectsContext";
import { LinearGradient } from "expo-linear-gradient";

type Filter = "all" | "in_progress" | "complete" | "planning";
type ViewMode = "list" | "grid";

const FILTERS: { label: string; value: Filter }[] = [
  { label: "All", value: "all" },
  { label: "In Progress", value: "in_progress" },
  { label: "Complete", value: "complete" },
  { label: "Planning", value: "planning" },
];

export default function ProjectsScreen() {
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

  const activeCount = projects.filter(
    (p) => p.status === "in_progress" || p.status === "generating"
  ).length;
  const doneCount = projects.filter(
    (p) => p.status === "complete" || p.status === "exported"
  ).length;

  return (
    <View style={styles.root}>
      {/* Guild Archives background */}
      <AnimatedBackground />
      <LinearGradient
        colors={["rgba(11,9,20,0.94)", "rgba(11,9,20,0.82)"]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingTop: topPad, paddingBottom: bottomPad }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.inner}>
          {/* Header — metallic title + crystal view toggle + pulsing create */}
          <ArchiveHeader
            viewMode={viewMode}
            onToggleView={(mode) => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setViewMode(mode);
            }}
            onCreatePress={() => router.push("/new-game")}
          />

          {/* Archive search — magical glass */}
          <MagicSearchBar
            value={search}
            onChangeText={setSearch}
            onClear={() => setSearch("")}
            placeholder="Search the archives..."
          />

          {/* Enchanted category seals */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterRow}
            contentContainerStyle={styles.filterContent}
          >
            {FILTERS.map((f) => (
              <CrystalChip
                key={f.value}
                label={f.label}
                active={filter === f.value}
                onPress={() => setFilter(f.value)}
              />
            ))}
          </ScrollView>

          {/* Magical stat panels */}
          <View style={styles.statsRow}>
            <StatCrystalCard
              label="Total"
              value={projects.length}
              icon="layers"
              accentColor="#C0B8E0"
              accentGradient={["#2A2448", "#1A1640"]}
            />
            <StatCrystalCard
              label="Active"
              value={activeCount}
              icon="zap"
              accentColor="#3B8FFF"
              accentGradient={["#1A3A8A", "#0D2050"]}
            />
            <StatCrystalCard
              label="Done"
              value={doneCount}
              icon="check-circle"
              accentColor="#10B981"
              accentGradient={["#064E3B", "#022C22"]}
            />
          </View>

          {/* Divider rune line */}
          <View style={styles.runeDivider}>
            <View style={styles.runeLineLeft} />
            <View style={styles.runeDot} />
            <View style={styles.runeLineRight} />
          </View>

          {/* Content — loading / empty / list / grid */}
          {isLoading ? (
            <BlueprintSkeleton />
          ) : filtered.length === 0 ? (
            <ArchiveEmptyState
              hasSearch={search.length > 0}
              searchQuery={search}
            />
          ) : viewMode === "list" ? (
            filtered.map((p) => <BlueprintCard key={p.id} project={p} />)
          ) : (
            <View style={styles.gridContainer}>
              {filtered.map((p) => (
                <GridBlueprintCard key={p.id} project={p} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0B0914",
  },
  scroll: { flex: 1 },
  inner: { paddingHorizontal: 20, gap: 16 },
  filterRow: { marginHorizontal: -20 },
  filterContent: { paddingHorizontal: 20 },
  statsRow: { flexDirection: "row", gap: 10 },
  runeDivider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginVertical: 4,
  },
  runeLineLeft: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(42,38,64,0.6)",
  },
  runeDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#2A2448",
    transform: [{ rotate: "45deg" }],
  },
  runeLineRight: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(42,38,64,0.6)",
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
});
