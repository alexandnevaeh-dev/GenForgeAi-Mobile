import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

type PlayStyle =
  | "beginner"
  | "casual"
  | "explorer"
  | "completionist"
  | "speedrunner"
  | "competitive"
  | "aggressive"
  | "defensive"
  | "accessibility";

interface PlayStyle_Config {
  label: string;
  icon: string;
  color: string;
  desc: string;
}

interface PlaytestIssue {
  area: string;
  severity: "critical" | "warning" | "info";
  note: string;
}

interface PlaytestResult {
  playStyle: string;
  sessionLength: string;
  progressReached: number;
  enjoymentScore: number;
  issuesFound: PlaytestIssue[];
  strengths: string[];
  improvements: string[];
  summary: string;
}

const PLAY_STYLES: Record<PlayStyle, PlayStyle_Config> = {
  beginner:      { label: "Beginner",       icon: "user",         color: "#22C55E", desc: "First-time player, needs guidance" },
  casual:        { label: "Casual",         icon: "coffee",       color: "#2B7FFF", desc: "Short sessions, prefers guidance" },
  explorer:      { label: "Explorer",       icon: "map",          color: "#7B2FFF", desc: "Exhausts every area, reads lore" },
  completionist: { label: "Completionist",  icon: "award",        color: "#FBBF24", desc: "Aims for 100%, finds edge cases" },
  speedrunner:   { label: "Speedrunner",    icon: "zap",          color: "#F97316", desc: "Skips dialogue, optimal routes" },
  competitive:   { label: "Competitive",    icon: "trending-up",  color: "#EF4444", desc: "Optimizes builds, seeks leaderboards" },
  aggressive:    { label: "Aggressive",     icon: "crosshair",    color: "#DC2626", desc: "Favors combat, rushes encounters" },
  defensive:     { label: "Defensive",      icon: "shield",       color: "#0EA5E9", desc: "Cautious, grinds levels before advancing" },
  accessibility: { label: "Accessibility",  icon: "eye",          color: "#00D4FF", desc: "Needs colorblind, larger text, remapping" },
};

const SEVERITY_COLOR: Record<string, string> = {
  critical: "#EF4444",
  warning:  "#FBBF24",
  info:     "#6B6B80",
};

interface Props {
  projectId: number;
}

export function PlaytestPanel({ projectId }: Props) {
  const colors = useColors();
  const { accessToken: token } = useAuth();

  const [selected, setSelected] = useState<PlayStyle>("casual");
  const [result, setResult] = useState<PlaytestResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runPlaytest() {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/qa/playtest`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ playStyle: selected }),
      });
      if (!res.ok) throw new Error(await res.text());
      setResult(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Playtest failed");
    } finally {
      setLoading(false);
    }
  }

  const cfg = PLAY_STYLES[selected];
  const enjoyCol = result
    ? result.enjoymentScore >= 80 ? "#22C55E"
    : result.enjoymentScore >= 60 ? "#FBBF24" : "#EF4444"
    : colors.primary;

  return (
    <View style={styles.root}>
      <View style={[styles.headerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name="play-circle" size={20} color={colors.primary} />
        <View style={styles.headerText}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Autonomous Playtesting</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            AI simulates a player archetype and reports findings
          </Text>
        </View>
      </View>

      {/* Play style grid */}
      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>SELECT PLAY STYLE</Text>
      <View style={styles.styleGrid}>
        {(Object.keys(PLAY_STYLES) as PlayStyle[]).map((key) => {
          const c = PLAY_STYLES[key];
          const isSelected = selected === key;
          return (
            <Pressable
              key={key}
              onPress={() => setSelected(key)}
              style={[
                styles.styleChip,
                {
                  backgroundColor: isSelected ? c.color + "22" : colors.card,
                  borderColor: isSelected ? c.color : colors.border,
                },
              ]}
            >
              <Feather name={c.icon as any} size={14} color={isSelected ? c.color : colors.mutedForeground} />
              <Text style={[styles.styleChipLabel, { color: isSelected ? c.color : colors.mutedForeground }]}>
                {c.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Selected style detail */}
      <View style={[styles.styleDetail, { backgroundColor: cfg.color + "12", borderColor: cfg.color }]}>
        <Feather name={cfg.icon as any} size={16} color={cfg.color} />
        <View style={styles.styleDetailText}>
          <Text style={[styles.styleDetailLabel, { color: cfg.color }]}>{cfg.label}</Text>
          <Text style={[styles.styleDetailDesc, { color: colors.mutedForeground }]}>{cfg.desc}</Text>
        </View>
      </View>

      {/* Run button */}
      <Pressable
        onPress={runPlaytest}
        disabled={loading}
        style={[styles.runBtn, { backgroundColor: loading ? colors.border : cfg.color }]}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Feather name="play" size={16} color="#fff" />
        )}
        <Text style={styles.runBtnText}>
          {loading ? "Simulating…" : `Simulate ${cfg.label}`}
        </Text>
      </Pressable>

      {error && (
        <View style={[styles.errorBanner, { backgroundColor: colors.destructive + "18", borderColor: colors.destructive }]}>
          <Feather name="alert-circle" size={13} color={colors.destructive} />
          <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
        </View>
      )}

      {/* Result */}
      {result && (
        <View style={styles.resultSection}>
          {/* Scores */}
          <View style={[styles.resultScores, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.resultScoreItem}>
              <Text style={[styles.resultScoreValue, { color: enjoyCol }]}>{result.enjoymentScore}</Text>
              <Text style={[styles.resultScoreLabel, { color: colors.mutedForeground }]}>Enjoyment</Text>
            </View>
            <View style={[styles.scoreDivider, { backgroundColor: colors.border }]} />
            <View style={styles.resultScoreItem}>
              <Text style={[styles.resultScoreValue, { color: colors.primary }]}>{result.progressReached}%</Text>
              <Text style={[styles.resultScoreLabel, { color: colors.mutedForeground }]}>Progress</Text>
            </View>
            <View style={[styles.scoreDivider, { backgroundColor: colors.border }]} />
            <View style={styles.resultScoreItem}>
              <Text style={[styles.resultScoreValue, { color: colors.foreground }]}>{result.sessionLength}</Text>
              <Text style={[styles.resultScoreLabel, { color: colors.mutedForeground }]}>Session</Text>
            </View>
          </View>

          {/* Summary */}
          <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.summaryText, { color: colors.mutedForeground }]}>{result.summary}</Text>
          </View>

          {/* Issues */}
          {result.issuesFound.length > 0 && (
            <>
              <Text style={[styles.subTitle, { color: colors.foreground }]}>Issues Found</Text>
              {result.issuesFound.map((issue, i) => {
                const col = SEVERITY_COLOR[issue.severity] ?? colors.mutedForeground;
                return (
                  <View key={i} style={[styles.issueCard, { backgroundColor: colors.card, borderLeftColor: col, borderColor: colors.border }]}>
                    <View style={styles.issueHeader}>
                      <Text style={[styles.issueArea, { color: colors.foreground }]}>{issue.area}</Text>
                      <View style={[styles.severityChip, { backgroundColor: col + "22" }]}>
                        <Text style={[styles.severityText, { color: col }]}>{issue.severity}</Text>
                      </View>
                    </View>
                    <Text style={[styles.issueNote, { color: colors.mutedForeground }]}>{issue.note}</Text>
                  </View>
                );
              })}
            </>
          )}

          {/* Strengths */}
          {result.strengths.length > 0 && (
            <>
              <Text style={[styles.subTitle, { color: colors.foreground }]}>Strengths</Text>
              {result.strengths.map((s, i) => (
                <View key={i} style={styles.bulletRow}>
                  <Feather name="check" size={13} color="#22C55E" />
                  <Text style={[styles.bulletText, { color: colors.mutedForeground }]}>{s}</Text>
                </View>
              ))}
            </>
          )}

          {/* Improvements */}
          {result.improvements.length > 0 && (
            <>
              <Text style={[styles.subTitle, { color: colors.foreground }]}>Improvements</Text>
              {result.improvements.map((s, i) => (
                <View key={i} style={styles.bulletRow}>
                  <Feather name="arrow-up-right" size={13} color={colors.primary} />
                  <Text style={[styles.bulletText, { color: colors.mutedForeground }]}>{s}</Text>
                </View>
              ))}
            </>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root:               { gap: 12 },
  headerCard:         { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, borderWidth: 1, padding: 14 },
  headerText:         { gap: 2 },
  headerTitle:        { fontSize: 15, fontFamily: "Inter_700Bold" },
  headerSub:          { fontSize: 12, fontFamily: "Inter_400Regular" },
  sectionLabel:       { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1 },
  styleGrid:          { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  styleChip:          { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 11, paddingVertical: 7, borderRadius: 8, borderWidth: 1 },
  styleChipLabel:     { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  styleDetail:        { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 10, borderWidth: 1, padding: 12 },
  styleDetailText:    { gap: 2 },
  styleDetailLabel:   { fontSize: 13, fontFamily: "Inter_700Bold" },
  styleDetailDesc:    { fontSize: 12, fontFamily: "Inter_400Regular" },
  runBtn:             { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 12 },
  runBtnText:         { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
  errorBanner:        { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 10, borderWidth: 1 },
  errorText:          { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  resultSection:      { gap: 10 },
  resultScores:       { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1, padding: 16 },
  resultScoreItem:    { flex: 1, alignItems: "center", gap: 4 },
  resultScoreValue:   { fontSize: 20, fontFamily: "Inter_700Bold" },
  resultScoreLabel:   { fontSize: 10, fontFamily: "Inter_500Medium" },
  scoreDivider:       { width: 1, height: 32, marginHorizontal: 4 },
  summaryCard:        { borderRadius: 12, borderWidth: 1, padding: 14 },
  summaryText:        { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  subTitle:           { fontSize: 13, fontFamily: "Inter_700Bold", marginTop: 2 },
  issueCard:          { borderRadius: 10, borderWidth: 1, borderLeftWidth: 3, padding: 12, gap: 6 },
  issueHeader:        { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  issueArea:          { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  severityChip:       { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  severityText:       { fontSize: 10, fontFamily: "Inter_700Bold" },
  issueNote:          { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  bulletRow:          { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  bulletText:         { fontSize: 12, fontFamily: "Inter_400Regular", flex: 1, lineHeight: 18 },
});
