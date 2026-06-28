import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

type GateResult = "pass" | "fail" | "warning";

interface Gate {
  id: string;
  label: string;
  score: number;
  result: GateResult;
  notes: string;
}

interface QAReport {
  overallScore: number;
  buildReady: boolean;
  gates: Gate[];
}

interface Props {
  projectId?: string;
}

const RESULT_CONFIG: Record<GateResult, { color: string; icon: string; label: string }> = {
  pass: { color: "#22C55E", icon: "check-circle", label: "Passed" },
  fail: { color: "#EF4444", icon: "x-circle", label: "Failed" },
  warning: { color: "#F97316", icon: "alert-triangle", label: "Warning" },
};

export function QualityGates({ projectId }: Props) {
  const colors = useColors();
  const { accessToken, user } = useAuth();
  const isGuest = !accessToken || user?.id === "guest";

  const [report, setReport] = useState<QAReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  async function runGates() {
    if (!projectId || isGuest) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/qa/run`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      const data = (await res.json()) as QAReport;
      setReport(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Quality gate run failed");
    } finally {
      setLoading(false);
    }
  }

  // ── Guest / not signed in ──
  if (isGuest) {
    return (
      <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name="shield" size={22} color={colors.mutedForeground} />
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Sign in to run quality gates</Text>
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
          Quality gates evaluate your generated project on the server. Sign in with an account to run them.
        </Text>
      </View>
    );
  }

  // ── No project yet ──
  if (!projectId) {
    return (
      <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name="shield" size={22} color={colors.mutedForeground} />
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No project to evaluate yet</Text>
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
          Generate or open a project first, then run quality gates against it.
        </Text>
      </View>
    );
  }

  const passed = report?.gates.filter((g) => g.result === "pass").length ?? 0;
  const total = report?.gates.length ?? 0;
  const overall = report?.overallScore ?? 0;
  const overallColor = overall >= 80 ? colors.success : overall >= 60 ? colors.warning : colors.destructive;

  return (
    <View style={styles.root}>
      {/* Run / score header */}
      <View style={[styles.scoreCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.scoreLeft}>
          <Text style={[styles.scoreTitle, { color: colors.foreground }]}>Quality Gates</Text>
          <Text style={[styles.scoreSub, { color: colors.mutedForeground }]}>
            {report ? `${passed}/${total} gates passed` : "Run the gates to evaluate this project"}
          </Text>
        </View>
        {report && (
          <View style={[styles.scoreCircle, { borderColor: overallColor }]}>
            <Text style={[styles.scoreValue, { color: overallColor }]}>{overall}</Text>
          </View>
        )}
      </View>

      <Pressable
        onPress={runGates}
        disabled={loading}
        style={[styles.runBtn, { backgroundColor: colors.primary, opacity: loading ? 0.7 : 1 }]}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <>
            <Feather name={report ? "refresh-cw" : "play"} size={15} color="#fff" />
            <Text style={styles.runBtnText}>{report ? "Re-run Quality Gates" : "Run Quality Gates"}</Text>
          </>
        )}
      </Pressable>

      {/* Error */}
      {error && (
        <View style={[styles.errorCard, { backgroundColor: colors.destructive + "18", borderColor: colors.destructive }]}>
          <Feather name="alert-triangle" size={14} color={colors.destructive} />
          <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
        </View>
      )}

      {/* Empty (not yet run) */}
      {!report && !loading && !error && (
        <Text style={[styles.hintText, { color: colors.mutedForeground }]}>
          No results yet — quality gates have not been run for this project.
        </Text>
      )}

      {/* Build-ready banner */}
      {report && (
        <View
          style={[
            styles.readyBanner,
            {
              backgroundColor: (report.buildReady ? colors.success : colors.warning) + "18",
              borderColor: report.buildReady ? colors.success : colors.warning,
            },
          ]}
        >
          <Feather
            name={report.buildReady ? "check-circle" : "alert-triangle"}
            size={14}
            color={report.buildReady ? colors.success : colors.warning}
          />
          <Text style={[styles.readyText, { color: report.buildReady ? colors.success : colors.warning }]}>
            {report.buildReady ? "Build ready — all critical gates passed" : "Not build-ready — resolve flagged gates first"}
          </Text>
        </View>
      )}

      {/* Gate list */}
      {report?.gates.map((gate) => {
        const cfg = RESULT_CONFIG[gate.result] ?? RESULT_CONFIG.warning;
        const isExpanded = expanded === gate.id;
        return (
          <Pressable
            key={gate.id}
            onPress={() => setExpanded(isExpanded ? null : gate.id)}
            style={[styles.gateCard, { backgroundColor: colors.card, borderColor: isExpanded ? cfg.color : colors.border }]}
          >
            <View style={styles.gateHeader}>
              <View style={[styles.gateIcon, { backgroundColor: cfg.color + "22" }]}>
                <Feather name={cfg.icon as any} size={16} color={cfg.color} />
              </View>
              <View style={styles.gateInfo}>
                <Text style={[styles.gateLabel, { color: colors.foreground }]}>{gate.label}</Text>
                <View style={styles.scoreBar}>
                  <View style={[styles.scoreBarBg, { backgroundColor: colors.border }]}>
                    <View style={[styles.scoreBarFill, { width: `${gate.score}%` as any, backgroundColor: cfg.color }]} />
                  </View>
                  <Text style={[styles.scoreBarLabel, { color: cfg.color }]}>{gate.score}</Text>
                </View>
              </View>
              <View style={[styles.resultChip, { backgroundColor: cfg.color + "22" }]}>
                <Feather name={cfg.icon as any} size={12} color={cfg.color} />
                <Text style={[styles.resultText, { color: cfg.color }]}>{cfg.label}</Text>
              </View>
            </View>
            {isExpanded && gate.notes ? (
              <Text style={[styles.gateNotes, { color: colors.mutedForeground }]}>{gate.notes}</Text>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 10 },
  emptyCard: { alignItems: "center", gap: 8, borderRadius: 14, borderWidth: 1, padding: 24 },
  emptyTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  emptyText: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 18 },
  scoreCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  scoreLeft: { gap: 2, flex: 1 },
  scoreTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  scoreSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  scoreCircle: { width: 56, height: 56, borderRadius: 28, borderWidth: 2.5, alignItems: "center", justifyContent: "center" },
  scoreValue: { fontSize: 18, fontFamily: "Inter_700Bold" },
  runBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, borderRadius: 12, paddingVertical: 13 },
  runBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },
  errorCard: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, borderWidth: 1, padding: 12 },
  errorText: { fontSize: 12, fontFamily: "Inter_400Regular", flex: 1 },
  hintText: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center", paddingVertical: 8 },
  readyBanner: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, borderWidth: 1, padding: 12 },
  readyText: { fontSize: 12, fontFamily: "Inter_600SemiBold", flex: 1 },
  gateCard: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 10 },
  gateHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  gateIcon: { width: 34, height: 34, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  gateInfo: { flex: 1, gap: 5 },
  gateLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  scoreBar: { flexDirection: "row", alignItems: "center", gap: 6 },
  scoreBarBg: { flex: 1, height: 4, borderRadius: 2, overflow: "hidden" },
  scoreBarFill: { height: 4, borderRadius: 2 },
  scoreBarLabel: { fontSize: 10, fontFamily: "Inter_700Bold", width: 28 },
  resultChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  resultText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  gateNotes: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17, paddingTop: 4 },
});
