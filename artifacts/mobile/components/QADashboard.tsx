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

interface GateResult {
  id: string;
  label: string;
  score: number;
  result: "pass" | "warning" | "fail";
  notes: string;
}

interface Bug {
  type: string;
  severity: "critical" | "high" | "medium" | "low";
  description: string;
  steps: string[];
  autoFixable: boolean;
}

interface QAReport {
  overallScore: number;
  grade: "A" | "B" | "C" | "D" | "F";
  gates: GateResult[];
  bugs: Bug[];
  performance: {
    profile: string;
    cpuScore: number;
    gpuScore: number;
    memScore: number;
    estimatedFPS: number;
    loadTimeMs: number;
    suggestions: string[];
  };
  accessibility: {
    score: number;
    issues: Array<{ area: string; note: string; severity: string }>;
  };
  buildReady: boolean;
  generatedAt: string;
}

interface Props {
  projectId: number;
}

const SEVERITY_COLOR: Record<string, string> = {
  critical: "#EF4444",
  high:     "#F97316",
  medium:   "#FBBF24",
  low:      "#6B6B80",
};

const GRADE_COLOR: Record<string, string> = {
  A: "#22C55E",
  B: "#2B7FFF",
  C: "#FBBF24",
  D: "#F97316",
  F: "#EF4444",
};

const RESULT_ICON: Record<string, string> = {
  pass:    "check-circle",
  warning: "alert-triangle",
  fail:    "x-circle",
};

const RESULT_COLOR: Record<string, string> = {
  pass:    "#22C55E",
  warning: "#FBBF24",
  fail:    "#EF4444",
};

export function QADashboard({ projectId }: Props) {
  const colors = useColors();
  const { accessToken: token } = useAuth();

  const [report, setReport] = useState<QAReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedGate, setExpandedGate] = useState<string | null>(null);
  const [expandedBug, setExpandedBug] = useState<number | null>(null);

  async function runQA() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/qa/run`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(await res.text());
      setReport(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "QA run failed");
    } finally {
      setLoading(false);
    }
  }

  const grade = report?.grade ?? null;
  const gradeColor = grade ? GRADE_COLOR[grade] ?? colors.primary : colors.primary;

  return (
    <View style={styles.root}>
      {/* Header card */}
      <View style={[styles.headerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>QA Dashboard</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            {report
              ? `Last run: ${new Date(report.generatedAt).toLocaleTimeString()}`
              : "Run a full AI-powered quality analysis"}
          </Text>
        </View>
        {report && (
          <View style={[styles.gradeCircle, { borderColor: gradeColor }]}>
            <Text style={[styles.gradeText, { color: gradeColor }]}>{report.grade}</Text>
          </View>
        )}
      </View>

      {/* Run button */}
      <Pressable
        onPress={runQA}
        disabled={loading}
        style={[styles.runBtn, { backgroundColor: loading ? colors.border : colors.primary }]}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Feather name="play" size={16} color="#fff" />
        )}
        <Text style={styles.runBtnText}>
          {loading ? "Analyzing…" : report ? "Re-run QA" : "Run Full QA"}
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
          <Feather name="shield" size={32} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No QA Report Yet</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Run a full QA analysis to see your game's quality score, bugs, performance metrics, and accessibility report.
          </Text>
        </View>
      )}

      {report && (
        <>
          {/* Score overview */}
          <View style={[styles.scoreRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.scoreItem}>
              <Text style={[styles.scoreValue, { color: colors.primary }]}>{report.overallScore}</Text>
              <Text style={[styles.scoreLabel, { color: colors.mutedForeground }]}>Overall</Text>
            </View>
            <View style={[styles.scoreDivider, { backgroundColor: colors.border }]} />
            <View style={styles.scoreItem}>
              <Text style={[styles.scoreValue, { color: "#22C55E" }]}>
                {report.gates.filter((g) => g.result === "pass").length}
              </Text>
              <Text style={[styles.scoreLabel, { color: colors.mutedForeground }]}>Gates Pass</Text>
            </View>
            <View style={[styles.scoreDivider, { backgroundColor: colors.border }]} />
            <View style={styles.scoreItem}>
              <Text style={[styles.scoreValue, { color: "#EF4444" }]}>{report.bugs.length}</Text>
              <Text style={[styles.scoreLabel, { color: colors.mutedForeground }]}>Bugs</Text>
            </View>
            <View style={[styles.scoreDivider, { backgroundColor: colors.border }]} />
            <View style={styles.scoreItem}>
              <Text style={[styles.scoreValue, { color: "#00D4FF" }]}>{report.accessibility.score}</Text>
              <Text style={[styles.scoreLabel, { color: colors.mutedForeground }]}>A11y</Text>
            </View>
          </View>

          {/* Build readiness */}
          <View style={[styles.readinessBanner, {
            backgroundColor: report.buildReady ? "#22C55E18" : "#EF444418",
            borderColor: report.buildReady ? "#22C55E" : "#EF4444",
          }]}>
            <Feather
              name={report.buildReady ? "check-circle" : "alert-circle"}
              size={15}
              color={report.buildReady ? "#22C55E" : "#EF4444"}
            />
            <Text style={[styles.readinessText, { color: report.buildReady ? "#22C55E" : "#EF4444" }]}>
              {report.buildReady ? "Build Ready — all critical gates passed" : "Not build-ready — resolve critical issues first"}
            </Text>
          </View>

          {/* ── Quality Gates ── */}
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Quality Gates</Text>
          {report.gates.map((gate) => {
            const isExp = expandedGate === gate.id;
            const col = RESULT_COLOR[gate.result] ?? colors.primary;
            return (
              <Pressable
                key={gate.id}
                onPress={() => setExpandedGate(isExp ? null : gate.id)}
                style={[styles.gateCard, { backgroundColor: colors.card, borderColor: isExp ? col : colors.border }]}
              >
                <View style={styles.gateRow}>
                  <View style={[styles.gateIcon, { backgroundColor: col + "22" }]}>
                    <Feather name={RESULT_ICON[gate.result] as any} size={15} color={col} />
                  </View>
                  <View style={styles.gateInfo}>
                    <Text style={[styles.gateLabel, { color: colors.foreground }]}>{gate.label}</Text>
                    <View style={styles.gateBar}>
                      <View style={[styles.gateBarBg, { backgroundColor: colors.border }]}>
                        <View style={[styles.gateBarFill, { width: `${gate.score}%` as any, backgroundColor: col }]} />
                      </View>
                      <Text style={[styles.gateScore, { color: col }]}>{gate.score}</Text>
                    </View>
                  </View>
                  <Feather name={isExp ? "chevron-up" : "chevron-down"} size={14} color={colors.mutedForeground} />
                </View>
                {isExp && (
                  <Text style={[styles.gateNotes, { color: colors.mutedForeground }]}>{gate.notes}</Text>
                )}
              </Pressable>
            );
          })}

          {/* ── Bugs ── */}
          {report.bugs.length > 0 && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Detected Issues</Text>
              {report.bugs.map((bug, i) => {
                const isExp = expandedBug === i;
                const col = SEVERITY_COLOR[bug.severity] ?? colors.mutedForeground;
                return (
                  <Pressable
                    key={i}
                    onPress={() => setExpandedBug(isExp ? null : i)}
                    style={[styles.bugCard, { backgroundColor: colors.card, borderColor: isExp ? col : colors.border }]}
                  >
                    <View style={styles.bugRow}>
                      <View style={[styles.severityDot, { backgroundColor: col }]} />
                      <View style={styles.bugInfo}>
                        <Text style={[styles.bugType, { color: colors.foreground }]}>{bug.type}</Text>
                        <Text style={[styles.bugDesc, { color: colors.mutedForeground }]} numberOfLines={isExp ? undefined : 1}>
                          {bug.description}
                        </Text>
                      </View>
                      <View style={styles.bugRight}>
                        {bug.autoFixable && (
                          <View style={[styles.autoFixChip, { backgroundColor: "#22C55E22" }]}>
                            <Text style={styles.autoFixText}>Auto-fix</Text>
                          </View>
                        )}
                        <Feather name={isExp ? "chevron-up" : "chevron-down"} size={14} color={colors.mutedForeground} />
                      </View>
                    </View>
                    {isExp && (
                      <View style={styles.bugSteps}>
                        {bug.steps.map((step, si) => (
                          <View key={si} style={styles.bugStep}>
                            <Text style={[styles.bugStepNum, { color: colors.primary }]}>{si + 1}.</Text>
                            <Text style={[styles.bugStepText, { color: colors.mutedForeground }]}>{step}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </>
          )}

          {/* ── Performance ── */}
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Performance</Text>
          <View style={[styles.perfCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.perfRow}>
              {[
                { label: "CPU", value: report.performance.cpuScore },
                { label: "GPU", value: report.performance.gpuScore },
                { label: "MEM", value: report.performance.memScore },
              ].map((m) => {
                const col = m.value >= 80 ? "#22C55E" : m.value >= 60 ? "#FBBF24" : "#EF4444";
                return (
                  <View key={m.label} style={styles.perfMeter}>
                    <Text style={[styles.perfMeterValue, { color: col }]}>{m.value}</Text>
                    <View style={[styles.perfMeterBar, { backgroundColor: colors.border }]}>
                      <View style={[styles.perfMeterFill, { height: `${m.value}%` as any, backgroundColor: col }]} />
                    </View>
                    <Text style={[styles.perfMeterLabel, { color: colors.mutedForeground }]}>{m.label}</Text>
                  </View>
                );
              })}
              <View style={styles.perfStats}>
                <Text style={[styles.perfStat, { color: colors.foreground }]}>
                  <Text style={{ color: colors.primary }}>{report.performance.estimatedFPS}</Text> FPS
                </Text>
                <Text style={[styles.perfStat, { color: colors.foreground }]}>
                  <Text style={{ color: colors.primary }}>{(report.performance.loadTimeMs / 1000).toFixed(1)}s</Text> load
                </Text>
                <Text style={[styles.perfProfile, { color: colors.mutedForeground }]}>
                  {report.performance.profile} profile
                </Text>
              </View>
            </View>
            {report.performance.suggestions.map((s, i) => (
              <View key={i} style={styles.suggRow}>
                <Feather name="arrow-right" size={12} color={colors.primary} />
                <Text style={[styles.suggText, { color: colors.mutedForeground }]}>{s}</Text>
              </View>
            ))}
          </View>

          {/* ── Accessibility ── */}
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Accessibility</Text>
          <View style={[styles.a11yCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.a11yHeader}>
              <Feather name="eye" size={18} color="#00D4FF" />
              <Text style={[styles.a11yScore, { color: "#00D4FF" }]}>{report.accessibility.score}/100</Text>
              <Text style={[styles.a11yLabel, { color: colors.mutedForeground }]}>Accessibility Score</Text>
            </View>
            {report.accessibility.issues.map((issue, i) => {
              const col = issue.severity === "critical" ? "#EF4444" : issue.severity === "warning" ? "#FBBF24" : "#6B6B80";
              return (
                <View key={i} style={[styles.a11yIssue, { borderLeftColor: col, borderLeftWidth: 3 }]}>
                  <Text style={[styles.a11yArea, { color: colors.foreground }]}>{issue.area}</Text>
                  <Text style={[styles.a11yNote, { color: colors.mutedForeground }]}>{issue.note}</Text>
                </View>
              );
            })}
            {report.accessibility.issues.length === 0 && (
              <Text style={[styles.a11yPerfect, { color: "#22C55E" }]}>✓ No accessibility issues found</Text>
            )}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root:             { gap: 12 },
  headerCard:       { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 14, borderWidth: 1, padding: 16 },
  headerLeft:       { gap: 3 },
  headerTitle:      { fontSize: 16, fontFamily: "Inter_700Bold" },
  headerSub:        { fontSize: 12, fontFamily: "Inter_400Regular" },
  gradeCircle:      { width: 52, height: 52, borderRadius: 26, borderWidth: 2.5, alignItems: "center", justifyContent: "center" },
  gradeText:        { fontSize: 22, fontFamily: "Inter_700Bold" },
  runBtn:           { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 12 },
  runBtnText:       { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
  errorBanner:      { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 10, borderWidth: 1 },
  errorText:        { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  emptyCard:        { alignItems: "center", gap: 10, padding: 32, borderRadius: 14, borderWidth: 1 },
  emptyTitle:       { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  emptyText:        { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  scoreRow:         { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1, padding: 16 },
  scoreItem:        { flex: 1, alignItems: "center", gap: 4 },
  scoreValue:       { fontSize: 22, fontFamily: "Inter_700Bold" },
  scoreLabel:       { fontSize: 10, fontFamily: "Inter_500Medium" },
  scoreDivider:     { width: 1, height: 36, marginHorizontal: 4 },
  readinessBanner:  { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 10, borderWidth: 1 },
  readinessText:    { fontSize: 13, fontFamily: "Inter_600SemiBold", flex: 1 },
  sectionTitle:     { fontSize: 14, fontFamily: "Inter_700Bold", marginTop: 4 },
  gateCard:         { borderRadius: 12, borderWidth: 1, padding: 14, gap: 8 },
  gateRow:          { flexDirection: "row", alignItems: "center", gap: 10 },
  gateIcon:         { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  gateInfo:         { flex: 1, gap: 5 },
  gateLabel:        { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  gateBar:          { flexDirection: "row", alignItems: "center", gap: 8 },
  gateBarBg:        { flex: 1, height: 4, borderRadius: 2 },
  gateBarFill:      { height: 4, borderRadius: 2 },
  gateScore:        { fontSize: 12, fontFamily: "Inter_700Bold", minWidth: 28, textAlign: "right" },
  gateNotes:        { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18, paddingTop: 4 },
  bugCard:          { borderRadius: 12, borderWidth: 1, padding: 14, gap: 8 },
  bugRow:           { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  severityDot:      { width: 8, height: 8, borderRadius: 4, marginTop: 5 },
  bugInfo:          { flex: 1, gap: 3 },
  bugType:          { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  bugDesc:          { fontSize: 12, fontFamily: "Inter_400Regular" },
  bugRight:         { alignItems: "flex-end", gap: 4 },
  autoFixChip:      { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5 },
  autoFixText:      { fontSize: 10, color: "#22C55E", fontFamily: "Inter_600SemiBold" },
  bugSteps:         { gap: 6, paddingTop: 4, paddingLeft: 18 },
  bugStep:          { flexDirection: "row", gap: 6 },
  bugStepNum:       { fontSize: 12, fontFamily: "Inter_700Bold", minWidth: 16 },
  bugStepText:      { fontSize: 12, fontFamily: "Inter_400Regular", flex: 1, lineHeight: 18 },
  perfCard:         { borderRadius: 14, borderWidth: 1, padding: 16, gap: 12 },
  perfRow:          { flexDirection: "row", alignItems: "flex-end", gap: 16 },
  perfMeter:        { alignItems: "center", gap: 4 },
  perfMeterValue:   { fontSize: 14, fontFamily: "Inter_700Bold" },
  perfMeterBar:     { width: 28, height: 60, borderRadius: 6, justifyContent: "flex-end", overflow: "hidden" },
  perfMeterFill:    { width: "100%", borderRadius: 6 },
  perfMeterLabel:   { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  perfStats:        { flex: 1, gap: 6 },
  perfStat:         { fontSize: 14, fontFamily: "Inter_400Regular" },
  perfProfile:      { fontSize: 11, fontFamily: "Inter_400Regular" },
  suggRow:          { flexDirection: "row", alignItems: "flex-start", gap: 6 },
  suggText:         { fontSize: 12, fontFamily: "Inter_400Regular", flex: 1, lineHeight: 18 },
  a11yCard:         { borderRadius: 14, borderWidth: 1, padding: 16, gap: 12 },
  a11yHeader:       { flexDirection: "row", alignItems: "center", gap: 10 },
  a11yScore:        { fontSize: 20, fontFamily: "Inter_700Bold" },
  a11yLabel:        { fontSize: 13, fontFamily: "Inter_400Regular" },
  a11yIssue:        { paddingLeft: 10, paddingVertical: 6, gap: 2 },
  a11yArea:         { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  a11yNote:         { fontSize: 12, fontFamily: "Inter_400Regular" },
  a11yPerfect:      { fontSize: 13, fontFamily: "Inter_600SemiBold" },
});
