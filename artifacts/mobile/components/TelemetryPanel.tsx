import { Feather } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

interface AgentRow {
  agentName: string;
  taskType: string;
  runs: number;
  avgMs: number;
  successRate: number;
}

interface TaskTypeRow {
  taskType: string;
  runs: number;
  share: number;
}

interface TelemetryResponse {
  hasData: boolean;
  metrics: {
    totalGenerations: number;
    totalTasks: number;
    avgGenTimeMs: number;
    successRate: number;
    failureRate: number;
    totalProjects: number;
    totalAssets: number;
  };
  agents: AgentRow[];
  taskTypes: TaskTypeRow[];
}

const TASK_COLOR: Record<string, string> = {
  foundation: "#2B7FFF", story: "#7B2FFF", characters: "#00D4FF",
  assets: "#F97316", balance: "#FBBF24", coding: "#22C55E",
  chat: "#EC4899", packaging: "#6B6B80", image: "#F97316", export: "#6B6B80",
};

type View_ = "metrics" | "agents" | "models";

function fmtMs(ms: number): string {
  if (!ms) return "—";
  return ms >= 1000 ? `${(ms / 1000).toFixed(1)}s` : `${ms}ms`;
}

export function TelemetryPanel() {
  const colors = useColors();
  const { accessToken, user } = useAuth();
  const isGuest = !accessToken || user?.id === "guest";

  const [data, setData] = useState<TelemetryResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeView, setActiveView] = useState<View_>("metrics");

  const load = useCallback(async () => {
    if (isGuest) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/telemetry`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      setData((await res.json()) as TelemetryResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load telemetry");
    } finally {
      setLoading(false);
    }
  }, [accessToken, isGuest]);

  useEffect(() => {
    load();
  }, [load]);

  // ── Guest ──
  if (isGuest) {
    return (
      <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name="bar-chart" size={22} color={colors.mutedForeground} />
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Sign in to see telemetry</Text>
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
          Generation telemetry is tracked per account. Sign in to view your real model and task stats.
        </Text>
      </View>
    );
  }

  const metrics = data?.metrics;
  const metricCards = metrics
    ? [
        { label: "Generated Projects", value: String(metrics.totalGenerations), icon: "zap", color: "#2B7FFF" },
        { label: "AI Tasks Run", value: String(metrics.totalTasks), icon: "cpu", color: "#7B2FFF" },
        { label: "Avg Task Time", value: fmtMs(metrics.avgGenTimeMs), icon: "clock", color: "#00D4FF" },
        { label: "Success Rate", value: `${metrics.successRate}%`, icon: "check-circle", color: "#22C55E" },
        { label: "Failure Rate", value: `${metrics.failureRate}%`, icon: "alert-triangle", color: "#EF4444" },
        { label: "Total Assets", value: String(metrics.totalAssets), icon: "image", color: "#F97316" },
      ]
    : [];

  return (
    <View style={styles.root}>
      <View style={[styles.headerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name="bar-chart" size={20} color="#00D4FF" />
        <View style={styles.headerText}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Telemetry & Analytics</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            Real generation stats from your account
          </Text>
        </View>
        <Pressable onPress={load} disabled={loading}>
          <Feather name="refresh-cw" size={16} color={colors.mutedForeground} />
        </Pressable>
      </View>

      {loading && (
        <View style={[styles.loadingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ActivityIndicator color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Loading telemetry…</Text>
        </View>
      )}

      {error && !loading && (
        <View style={[styles.errorCard, { backgroundColor: colors.destructive + "18", borderColor: colors.destructive }]}>
          <Feather name="alert-triangle" size={14} color={colors.destructive} />
          <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
        </View>
      )}

      {/* Empty — no generations yet */}
      {data && !data.hasData && !loading && (
        <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="activity" size={22} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No telemetry yet</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Telemetry appears here after you run a generation. Create a game and the pipeline will start recording real task timings, model usage, and success rates.
          </Text>
        </View>
      )}

      {/* Has data */}
      {data?.hasData && !loading && (
        <>
          {/* View toggle */}
          <View style={[styles.toggleRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {(["metrics", "agents", "models"] as View_[]).map((v) => (
              <Pressable
                key={v}
                onPress={() => setActiveView(v)}
                style={[styles.toggleBtn, {
                  backgroundColor: activeView === v ? "#00D4FF20" : "transparent",
                  borderColor: activeView === v ? "#00D4FF" : "transparent",
                }]}
              >
                <Text style={[styles.toggleBtnText, { color: activeView === v ? "#00D4FF" : colors.mutedForeground }]}>
                  {v.charAt(0).toUpperCase() + v.slice(1)}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Metrics grid */}
          {activeView === "metrics" && (
            <View style={styles.metricsGrid}>
              {metricCards.map((m) => (
                <View key={m.label} style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.metricIcon, { backgroundColor: m.color + "20" }]}>
                    <Feather name={m.icon as any} size={14} color={m.color} />
                  </View>
                  <Text style={[styles.metricValue, { color: colors.foreground }]}>{m.value}</Text>
                  <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>{m.label}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Agent performance */}
          {activeView === "agents" && (
            <View style={styles.agentTable}>
              <View style={[styles.tableHeader, { borderColor: colors.border }]}>
                <Text style={[styles.tableHeaderText, { color: colors.mutedForeground, flex: 2 }]}>Agent</Text>
                <Text style={[styles.tableHeaderText, { color: colors.mutedForeground, flex: 1 }]}>Avg</Text>
                <Text style={[styles.tableHeaderText, { color: colors.mutedForeground, flex: 1 }]}>Success</Text>
                <Text style={[styles.tableHeaderText, { color: colors.mutedForeground, flex: 1 }]}>Runs</Text>
              </View>
              {data.agents.map((a, i) => {
                const taskCol = TASK_COLOR[a.taskType] ?? colors.primary;
                const succCol = a.successRate >= 95 ? "#22C55E" : a.successRate >= 80 ? "#FBBF24" : "#EF4444";
                return (
                  <View
                    key={i}
                    style={[styles.tableRow, { borderColor: colors.border, backgroundColor: i % 2 === 0 ? "transparent" : colors.card + "80" }]}
                  >
                    <View style={[styles.tableCell, { flex: 2 }]}>
                      <View style={[styles.agentDot, { backgroundColor: taskCol }]} />
                      <Text style={[styles.tableCellText, { color: colors.foreground, fontSize: 11 }]} numberOfLines={1}>
                        {a.agentName.replace(" AI", "")}
                      </Text>
                    </View>
                    <Text style={[styles.tableCellText, { color: colors.mutedForeground, flex: 1 }]}>{fmtMs(a.avgMs)}</Text>
                    <Text style={[styles.tableCellText, { color: succCol, flex: 1 }]}>{a.successRate}%</Text>
                    <Text style={[styles.tableCellText, { color: colors.mutedForeground, flex: 1 }]}>{a.runs}</Text>
                  </View>
                );
              })}
            </View>
          )}

          {/* Task-type usage */}
          {activeView === "models" && (
            <View style={styles.modelsList}>
              <Text style={[styles.modelsTitle, { color: colors.foreground }]}>Usage by Task Type</Text>
              {data.taskTypes.map((t) => {
                const col = TASK_COLOR[t.taskType] ?? colors.primary;
                return (
                  <View key={t.taskType} style={styles.modelUsageRow}>
                    <View style={[styles.modelUsageDot, { backgroundColor: col }]} />
                    <Text style={[styles.modelUsageTask, { color: colors.foreground }]}>{t.taskType}</Text>
                    <View style={[styles.modelUsageBarBg, { backgroundColor: colors.border }]}>
                      <View style={[styles.modelUsageBarFill, { width: `${t.share}%` as any, backgroundColor: col }]} />
                    </View>
                    <Text style={[styles.modelUsageShare, { color: col }]}>{t.share}%</Text>
                  </View>
                );
              })}

              <View style={[styles.infoBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Feather name="info" size={13} color={colors.mutedForeground} />
                <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
                  Shares are computed from the AI tasks your generations have actually recorded — not estimates.
                </Text>
              </View>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root:               { gap: 12 },
  headerCard:         { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, borderWidth: 1, padding: 14 },
  headerText:         { flex: 1, gap: 2 },
  headerTitle:        { fontSize: 15, fontFamily: "Inter_700Bold" },
  headerSub:          { fontSize: 12, fontFamily: "Inter_400Regular" },
  loadingCard:        { alignItems: "center", gap: 10, padding: 28, borderRadius: 14, borderWidth: 1 },
  loadingText:        { fontSize: 13, fontFamily: "Inter_400Regular" },
  errorCard:          { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, borderWidth: 1, padding: 12 },
  errorText:          { fontSize: 12, fontFamily: "Inter_400Regular", flex: 1 },
  emptyCard:          { alignItems: "center", gap: 8, borderRadius: 14, borderWidth: 1, padding: 24 },
  emptyTitle:         { fontSize: 15, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  emptyText:          { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 18 },
  toggleRow:          { flexDirection: "row", borderRadius: 10, borderWidth: 1, padding: 4, gap: 4 },
  toggleBtn:          { flex: 1, paddingVertical: 8, borderRadius: 7, borderWidth: 1, alignItems: "center" },
  toggleBtnText:      { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  metricsGrid:        { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  metricCard:         { width: "47%", borderRadius: 12, borderWidth: 1, padding: 12, gap: 4, alignItems: "flex-start" },
  metricIcon:         { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center", marginBottom: 2 },
  metricValue:        { fontSize: 17, fontFamily: "Inter_700Bold" },
  metricLabel:        { fontSize: 11, fontFamily: "Inter_400Regular" },
  agentTable:         { borderRadius: 12, overflow: "hidden" },
  tableHeader:        { flexDirection: "row", borderBottomWidth: 1, paddingVertical: 8, paddingHorizontal: 12 },
  tableHeaderText:    { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
  tableRow:           { flexDirection: "row", alignItems: "center", paddingVertical: 10, paddingHorizontal: 12, borderBottomWidth: 0.5 },
  tableCell:          { flexDirection: "row", alignItems: "center", gap: 6 },
  tableCellText:      { fontSize: 12, fontFamily: "Inter_400Regular" },
  agentDot:           { width: 6, height: 6, borderRadius: 3 },
  modelsList:         { gap: 10 },
  modelsTitle:        { fontSize: 14, fontFamily: "Inter_700Bold" },
  modelUsageRow:      { flexDirection: "row", alignItems: "center", gap: 8 },
  modelUsageDot:      { width: 8, height: 8, borderRadius: 4 },
  modelUsageTask:     { fontSize: 12, fontFamily: "Inter_500Medium", width: 90 },
  modelUsageBarBg:    { flex: 1, height: 5, borderRadius: 3, overflow: "hidden" },
  modelUsageBarFill:  { height: 5, borderRadius: 3 },
  modelUsageShare:    { fontSize: 11, fontFamily: "Inter_700Bold", minWidth: 32, textAlign: "right" },
  infoBox:            { flexDirection: "row", alignItems: "flex-start", gap: 8, borderRadius: 10, borderWidth: 1, padding: 12 },
  infoText:           { fontSize: 11, fontFamily: "Inter_400Regular", flex: 1, lineHeight: 17 },
});
