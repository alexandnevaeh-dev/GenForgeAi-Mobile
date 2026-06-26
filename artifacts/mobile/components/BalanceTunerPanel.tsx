import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

type Difficulty = "easy" | "normal" | "hard" | "custom";

interface TuningChange {
  stat: string;
  current: number;
  suggested: number;
  reason: string;
}

interface BalanceReport {
  difficulty: string;
  enemyDifficulty: number;
  rewardPacing: number;
  economyBalance: number;
  progressionCurve: number;
  puzzleDifficulty: number;
  itemDropRate: number;
  bossEncounterScore: number;
  recommendations: string[];
  tuningChanges: TuningChange[];
}

const DIFFICULTY_CONFIG: Record<Difficulty, { label: string; color: string; icon: string; desc: string }> = {
  easy:   { label: "Easy",   color: "#22C55E", icon: "smile",    desc: "Forgiving experience, generous rewards" },
  normal: { label: "Normal", color: "#2B7FFF", icon: "target",   desc: "Balanced challenge for most players" },
  hard:   { label: "Hard",   color: "#F97316", icon: "zap",      desc: "Demanding encounters, scarce resources" },
  custom: { label: "Custom", color: "#7B2FFF", icon: "sliders",  desc: "Fine-tune individual balance sliders" },
};

const METRICS = [
  { key: "enemyDifficulty",   label: "Enemy Difficulty",    icon: "crosshair" },
  { key: "rewardPacing",      label: "Reward Pacing",       icon: "gift" },
  { key: "economyBalance",    label: "Economy Balance",     icon: "dollar-sign" },
  { key: "progressionCurve",  label: "Progression Curve",   icon: "trending-up" },
  { key: "puzzleDifficulty",  label: "Puzzle Difficulty",   icon: "grid" },
  { key: "itemDropRate",      label: "Item Drop Rate",      icon: "box" },
  { key: "bossEncounterScore",label: "Boss Encounters",     icon: "alert-triangle" },
] as const;

interface Props {
  projectId: number;
}

function BarMeter({ value, color }: { value: number; color: string }) {
  return (
    <View style={styles.barOuter}>
      <View style={[styles.barBg, { backgroundColor: color + "20" }]}>
        <View style={[styles.barFill, { width: `${value}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={[styles.barValue, { color }]}>{value}</Text>
    </View>
  );
}

export function BalanceTunerPanel({ projectId }: Props) {
  const colors = useColors();
  const { accessToken: token } = useAuth();

  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [report, setReport] = useState<BalanceReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runBalance() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/qa/balance`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ difficulty }),
      });
      if (!res.ok) throw new Error(await res.text());
      setReport(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Balance tuning failed");
    } finally {
      setLoading(false);
    }
  }

  const cfg = DIFFICULTY_CONFIG[difficulty];

  return (
    <View style={styles.root}>
      <View style={[styles.headerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name="sliders" size={20} color={colors.secondary} />
        <View style={styles.headerText}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Gameplay Balance Tuner</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            AI-powered difficulty calibration for your game
          </Text>
        </View>
      </View>

      {/* Difficulty selector */}
      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>TARGET DIFFICULTY</Text>
      <View style={styles.diffRow}>
        {(Object.keys(DIFFICULTY_CONFIG) as Difficulty[]).map((key) => {
          const c = DIFFICULTY_CONFIG[key];
          const isSelected = difficulty === key;
          return (
            <Pressable
              key={key}
              onPress={() => setDifficulty(key)}
              style={[
                styles.diffChip,
                {
                  flex: 1,
                  backgroundColor: isSelected ? c.color + "20" : colors.card,
                  borderColor: isSelected ? c.color : colors.border,
                },
              ]}
            >
              <Feather name={c.icon as any} size={15} color={isSelected ? c.color : colors.mutedForeground} />
              <Text style={[styles.diffLabel, { color: isSelected ? c.color : colors.mutedForeground }]}>
                {c.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={[styles.diffDetail, { backgroundColor: cfg.color + "12", borderColor: cfg.color }]}>
        <Text style={[styles.diffDetailText, { color: cfg.color }]}>{cfg.desc}</Text>
      </View>

      {/* Run button */}
      <Pressable
        onPress={runBalance}
        disabled={loading}
        style={[styles.runBtn, { backgroundColor: loading ? colors.border : cfg.color }]}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Feather name="activity" size={16} color="#fff" />
        )}
        <Text style={styles.runBtnText}>
          {loading ? "Tuning…" : `Tune for ${cfg.label}`}
        </Text>
      </Pressable>

      {error && (
        <View style={[styles.errorBanner, { backgroundColor: colors.destructive + "18", borderColor: colors.destructive }]}>
          <Feather name="alert-circle" size={13} color={colors.destructive} />
          <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
        </View>
      )}

      {!report && !loading && (
        <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="activity" size={28} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Balance Report Yet</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Select a difficulty preset and run the tuner to get AI-generated balance recommendations.
          </Text>
        </View>
      )}

      {report && (
        <>
          {/* Metrics grid */}
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>BALANCE METRICS</Text>
          <View style={[styles.metricsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {METRICS.map((m) => {
              const val = (report as any)[m.key] as number ?? 0;
              const col = val >= 75 ? "#22C55E" : val >= 50 ? cfg.color : "#EF4444";
              return (
                <View key={m.key} style={styles.metricRow}>
                  <View style={styles.metricLeft}>
                    <Feather name={m.icon as any} size={13} color={col} />
                    <Text style={[styles.metricLabel, { color: colors.foreground }]}>{m.label}</Text>
                  </View>
                  <BarMeter value={val} color={col} />
                </View>
              );
            })}
          </View>

          {/* Tuning changes */}
          {report.tuningChanges.length > 0 && (
            <>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>SUGGESTED CHANGES</Text>
              {report.tuningChanges.map((change, i) => {
                const delta = Number(change.suggested) - Number(change.current);
                const deltaCol = delta > 0 ? "#22C55E" : delta < 0 ? "#EF4444" : colors.mutedForeground;
                const deltaSign = delta > 0 ? "+" : "";
                return (
                  <View key={i} style={[styles.changeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <View style={styles.changeHeader}>
                      <Text style={[styles.changeStat, { color: colors.foreground }]}>{change.stat}</Text>
                      <View style={styles.changeValues}>
                        <Text style={[styles.changeOld, { color: colors.mutedForeground }]}>
                          {Number(change.current).toFixed(change.current < 1 ? 2 : 0)}
                        </Text>
                        <Feather name="arrow-right" size={12} color={colors.mutedForeground} />
                        <Text style={[styles.changeNew, { color: cfg.color }]}>
                          {Number(change.suggested).toFixed(change.suggested < 1 ? 2 : 0)}
                        </Text>
                        <Text style={[styles.changeDelta, { color: deltaCol }]}>
                          ({deltaSign}{typeof delta === "number" ? delta.toFixed(delta < 1 && delta > -1 ? 2 : 0) : delta})
                        </Text>
                      </View>
                    </View>
                    <Text style={[styles.changeReason, { color: colors.mutedForeground }]}>{change.reason}</Text>
                  </View>
                );
              })}
            </>
          )}

          {/* Recommendations */}
          {report.recommendations.length > 0 && (
            <>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>RECOMMENDATIONS</Text>
              <View style={[styles.recsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {report.recommendations.map((rec, i) => (
                  <View key={i} style={styles.recRow}>
                    <Feather name="arrow-right" size={12} color={cfg.color} />
                    <Text style={[styles.recText, { color: colors.mutedForeground }]}>{rec}</Text>
                  </View>
                ))}
              </View>
            </>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root:             { gap: 12 },
  headerCard:       { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, borderWidth: 1, padding: 14 },
  headerText:       { gap: 2 },
  headerTitle:      { fontSize: 15, fontFamily: "Inter_700Bold" },
  headerSub:        { fontSize: 12, fontFamily: "Inter_400Regular" },
  sectionLabel:     { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1 },
  diffRow:          { flexDirection: "row", gap: 8 },
  diffChip:         { alignItems: "center", gap: 5, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  diffLabel:        { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  diffDetail:       { padding: 10, borderRadius: 8, borderWidth: 1 },
  diffDetailText:   { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  runBtn:           { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 12 },
  runBtnText:       { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
  errorBanner:      { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 10, borderWidth: 1 },
  errorText:        { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  emptyCard:        { alignItems: "center", gap: 10, padding: 28, borderRadius: 14, borderWidth: 1 },
  emptyTitle:       { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  emptyText:        { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 18 },
  metricsCard:      { borderRadius: 14, borderWidth: 1, padding: 16, gap: 12 },
  metricRow:        { flexDirection: "row", alignItems: "center", gap: 10 },
  metricLeft:       { flexDirection: "row", alignItems: "center", gap: 6, width: 150 },
  metricLabel:      { fontSize: 12, fontFamily: "Inter_500Medium", flex: 1 },
  barOuter:         { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  barBg:            { flex: 1, height: 6, borderRadius: 3, overflow: "hidden" },
  barFill:          { height: 6, borderRadius: 3 },
  barValue:         { fontSize: 12, fontFamily: "Inter_700Bold", minWidth: 28, textAlign: "right" },
  changeCard:       { borderRadius: 12, borderWidth: 1, padding: 14, gap: 6 },
  changeHeader:     { flexDirection: "row", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 4 },
  changeStat:       { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  changeValues:     { flexDirection: "row", alignItems: "center", gap: 6 },
  changeOld:        { fontSize: 13, fontFamily: "Inter_400Regular" },
  changeNew:        { fontSize: 13, fontFamily: "Inter_700Bold" },
  changeDelta:      { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  changeReason:     { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  recsCard:         { borderRadius: 12, borderWidth: 1, padding: 14, gap: 8 },
  recRow:           { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  recText:          { fontSize: 12, fontFamily: "Inter_400Regular", flex: 1, lineHeight: 18 },
});
