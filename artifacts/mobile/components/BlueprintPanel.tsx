import { Feather } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { ProjectBlueprint } from "@/constants/generation-pipeline";
import { useColors } from "@/hooks/useColors";

interface Props {
  blueprint: ProjectBlueprint;
  compact?: boolean;
}

export function BlueprintPanel({ blueprint, compact }: Props) {
  const colors = useColors();

  return (
    <View style={styles.root}>
      {/* Vision */}
      <View style={[styles.visionBox, { backgroundColor: colors.primary + "18", borderColor: colors.primary }]}>
        <View style={styles.visionHeader}>
          <Feather name="eye" size={14} color={colors.primary} />
          <Text style={[styles.visionLabel, { color: colors.primary }]}>VISION STATEMENT</Text>
        </View>
        <Text style={[styles.visionText, { color: colors.foreground }]}>{blueprint.visionStatement}</Text>
      </View>

      {/* Design Pillars */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>DESIGN PILLARS</Text>
        <View style={styles.pillarsGrid}>
          {blueprint.designPillars.map((p) => (
            <View key={p.label} style={[styles.pillarCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.pillarLabel, { color: colors.primary }]}>{p.label}</Text>
              {!compact && <Text style={[styles.pillarDesc, { color: colors.mutedForeground }]}>{p.description}</Text>}
            </View>
          ))}
        </View>
      </View>

      {/* Architecture */}
      <View style={[styles.infoRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name="layers" size={14} color={colors.accent} />
        <Text style={[styles.infoText, { color: colors.foreground }]}>{blueprint.architectureSummary}</Text>
      </View>

      {compact ? null : (
        <>
          {/* World & Story */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>WORLD & STORY</Text>
            <View style={[styles.worldCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.worldRow}>
                <Feather name="map" size={13} color={colors.secondary} />
                <Text style={[styles.worldLabel, { color: colors.mutedForeground }]}>World</Text>
                <Text style={[styles.worldValue, { color: colors.foreground }]}>{blueprint.worldOutline}</Text>
              </View>
              <View style={[styles.worldDivider, { backgroundColor: colors.border }]} />
              <View style={styles.worldRow}>
                <Feather name="book-open" size={13} color={colors.secondary} />
                <Text style={[styles.worldLabel, { color: colors.mutedForeground }]}>Story</Text>
                <Text style={[styles.worldValue, { color: colors.foreground }]}>{blueprint.storyOutline}</Text>
              </View>
            </View>
          </View>

          {/* Gameplay Systems */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>GAMEPLAY SYSTEMS</Text>
            <View style={styles.systemsList}>
              {blueprint.gameplySystems.map((sys, i) => (
                <View key={i} style={styles.systemRow}>
                  <View style={[styles.systemDot, { backgroundColor: colors.primary }]} />
                  <Text style={[styles.systemText, { color: colors.foreground }]}>{sys}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Asset Requirements */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>ASSET REQUIREMENTS</Text>
            <View style={styles.assetGrid}>
              {blueprint.assetRequirements.map((a) => (
                <View key={a.category} style={[styles.assetCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.assetCount, { color: colors.primary }]}>{a.count}</Text>
                  <Text style={[styles.assetLabel, { color: colors.mutedForeground }]} numberOfLines={2}>{a.category}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Milestones */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>MILESTONES</Text>
            {blueprint.milestones.map((m, i) => (
              <View key={i} style={styles.milestoneRow}>
                <View style={[styles.milestoneDot, { backgroundColor: colors.success }]}>
                  <Text style={styles.milestoneNum}>{i + 1}</Text>
                </View>
                {i < blueprint.milestones.length - 1 && (
                  <View style={[styles.milestoneLine, { backgroundColor: colors.border }]} />
                )}
                <Text style={[styles.milestoneText, { color: colors.foreground }]}>{m}</Text>
              </View>
            ))}
          </View>
        </>
      )}

      {/* Stats footer */}
      <View style={styles.statsRow}>
        <View style={[styles.statChip, { backgroundColor: colors.muted }]}>
          <Feather name="list" size={11} color={colors.accent} />
          <Text style={[styles.statText, { color: colors.foreground }]}>{blueprint.taskCount} tasks</Text>
        </View>
        <View style={[styles.statChip, { backgroundColor: colors.muted }]}>
          <Feather name="clock" size={11} color={colors.accent} />
          <Text style={[styles.statText, { color: colors.foreground }]}>~{blueprint.estimatedGenerationSeconds}s</Text>
        </View>
        <View style={[styles.statChip, { backgroundColor: colors.muted }]}>
          <Feather name="cpu" size={11} color={colors.accent} />
          <Text style={[styles.statText, { color: colors.foreground }]}>23 agents</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 14 },
  visionBox: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 6 },
  visionHeader: { flexDirection: "row", alignItems: "center", gap: 6 },
  visionLabel: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 0.8 },
  visionText: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  section: { gap: 8 },
  sectionTitle: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1 },
  pillarsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  pillarCard: { width: "47%", borderRadius: 10, borderWidth: 1, padding: 10, gap: 4 },
  pillarLabel: { fontSize: 13, fontFamily: "Inter_700Bold" },
  pillarDesc: { fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 15 },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
  },
  infoText: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1, lineHeight: 19 },
  worldCard: { borderRadius: 12, borderWidth: 1, padding: 12, gap: 10 },
  worldRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  worldLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", width: 38 },
  worldValue: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  worldDivider: { height: 1 },
  systemsList: { gap: 6 },
  systemRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  systemDot: { width: 6, height: 6, borderRadius: 3 },
  systemText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  assetGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  assetCard: {
    width: "30%",
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    alignItems: "center",
    gap: 4,
  },
  assetCount: { fontSize: 20, fontFamily: "Inter_700Bold" },
  assetLabel: { fontSize: 10, fontFamily: "Inter_400Regular", textAlign: "center" },
  milestoneRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 2 },
  milestoneDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  milestoneLine: {
    position: "absolute",
    left: 10.5,
    top: 22,
    width: 1,
    height: 26,
  },
  milestoneNum: { fontSize: 10, fontFamily: "Inter_700Bold", color: "#fff" },
  milestoneText: { fontSize: 13, fontFamily: "Inter_400Regular", paddingTop: 3, flex: 1 },
  statsRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  statChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  statText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
});
