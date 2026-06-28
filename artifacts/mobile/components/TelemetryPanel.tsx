import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";

interface TelemetryMetric {
  label: string;
  value: string;
  trend: string;
  up: boolean;
  icon: string;
  color: string;
}

interface AgentPerf {
  label: string;
  taskType: string;
  avgMs: number;
  successRate: number;
  tokens: number;
  runs: number;
}

const AGENT_PERF: AgentPerf[] = [
  { label: "Project Manager AI", taskType: "foundation", avgMs: 2100, successRate: 98, tokens: 480, runs: 24  },
  { label: "Narrative AI",       taskType: "story",      avgMs: 3800, successRate: 94, tokens: 1240, runs: 18 },
  { label: "Code Generation AI", taskType: "coding",     avgMs: 5200, successRate: 91, tokens: 1840, runs: 32 },
  { label: "Game Design AI",     taskType: "foundation", avgMs: 2900, successRate: 96, tokens: 820, runs: 21  },
  { label: "Art Director AI",    taskType: "assets",     avgMs: 1600, successRate: 99, tokens: 340, runs: 15  },
  { label: "QA AI",              taskType: "balance",    avgMs: 4100, successRate: 89, tokens: 1100, runs: 28 },
  { label: "Architecture AI",    taskType: "coding",     avgMs: 3200, successRate: 93, tokens: 920, runs: 19  },
  { label: "Deployment AI",      taskType: "packaging",  avgMs: 1200, successRate: 99, tokens: 220, runs: 12  },
];

const TASK_COLOR: Record<string, string> = {
  foundation: "#2B7FFF", story: "#7B2FFF", characters: "#00D4FF",
  assets: "#F97316", balance: "#FBBF24", coding: "#22C55E",
  chat: "#EC4899", packaging: "#6B6B80",
};

const METRICS: TelemetryMetric[] = [
  { label: "Total Generations",  value: "1,284",  trend: "+18%",   up: true,  icon: "zap",          color: "#2B7FFF" },
  { label: "Avg Gen Time",       value: "38.4s",  trend: "-12%",   up: false, icon: "clock",         color: "#22C55E" },
  { label: "Token Budget Used",  value: "84.2M",  trend: "+24%",   up: true,  icon: "hash",          color: "#7B2FFF" },
  { label: "Success Rate",       value: "94.1%",  trend: "+2.3%",  up: true,  icon: "check-circle",  color: "#22C55E" },
  { label: "Failure Rate",       value: "5.9%",   trend: "-2.3%",  up: false, icon: "alert-triangle",color: "#EF4444" },
  { label: "Est. Cost (30d)",    value: "$0.00",  trend: "Free",   up: true,  icon: "dollar-sign",   color: "#FBBF24" },
  { label: "Parallel Efficiency",value: "84%",    trend: "+6%",    up: true,  icon: "git-branch",    color: "#00D4FF" },
  { label: "Cache Hit Rate",     value: "31%",    trend: "+9%",    up: true,  icon: "database",      color: "#F97316" },
];

type View_ = "metrics" | "agents" | "models";

export function TelemetryPanel() {
  const colors = useColors();
  const [activeView, setActiveView] = useState<View_>("metrics");

  return (
    <View style={styles.root}>
      <View style={[styles.headerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name="bar-chart" size={20} color="#00D4FF" />
        <View style={styles.headerText}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Telemetry & Analytics</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            Generation stats · Model performance · Token usage
          </Text>
        </View>
      </View>

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
          {METRICS.map((m) => (
            <View key={m.label} style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.metricIcon, { backgroundColor: m.color + "20" }]}>
                <Feather name={m.icon as any} size={14} color={m.color} />
              </View>
              <Text style={[styles.metricValue, { color: colors.foreground }]}>{m.value}</Text>
              <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>{m.label}</Text>
              <View style={[styles.trendChip, { backgroundColor: m.up ? "#22C55E18" : "#EF444418" }]}>
                <Feather
                  name={m.trend === "Free" ? "gift" : m.up ? "trending-up" : "trending-down"}
                  size={10}
                  color={m.trend === "Free" ? "#FBBF24" : m.up ? "#22C55E" : "#EF4444"}
                />
                <Text style={[
                  styles.trendText,
                  { color: m.trend === "Free" ? "#FBBF24" : m.up ? "#22C55E" : "#EF4444" }
                ]}>{m.trend}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Agent performance */}
      {activeView === "agents" && (
        <View style={styles.agentTable}>
          <View style={[styles.tableHeader, { borderColor: colors.border }]}>
            <Text style={[styles.tableHeaderText, { color: colors.mutedForeground, flex: 2 }]}>Agent</Text>
            <Text style={[styles.tableHeaderText, { color: colors.mutedForeground, flex: 1 }]}>Avg ms</Text>
            <Text style={[styles.tableHeaderText, { color: colors.mutedForeground, flex: 1 }]}>Success</Text>
            <Text style={[styles.tableHeaderText, { color: colors.mutedForeground, flex: 1 }]}>Tokens</Text>
          </View>
          {AGENT_PERF.map((a, i) => {
            const taskCol = TASK_COLOR[a.taskType] ?? colors.primary;
            const succCol = a.successRate >= 95 ? "#22C55E" : a.successRate >= 88 ? "#FBBF24" : "#EF4444";
            return (
              <View
                key={i}
                style={[styles.tableRow, { borderColor: colors.border, backgroundColor: i % 2 === 0 ? "transparent" : colors.card + "80" }]}
              >
                <View style={[styles.tableCell, { flex: 2 }]}>
                  <View style={[styles.agentDot, { backgroundColor: taskCol }]} />
                  <Text style={[styles.tableCellText, { color: colors.foreground, fontSize: 11 }]} numberOfLines={1}>
                    {a.label.replace(" AI", "")}
                  </Text>
                </View>
                <Text style={[styles.tableCellText, { color: colors.mutedForeground, flex: 1 }]}>{a.avgMs}ms</Text>
                <Text style={[styles.tableCellText, { color: succCol, flex: 1 }]}>{a.successRate}%</Text>
                <Text style={[styles.tableCellText, { color: colors.mutedForeground, flex: 1 }]}>{a.tokens}</Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Model usage */}
      {activeView === "models" && (
        <View style={styles.modelsList}>
          <Text style={[styles.modelsTitle, { color: colors.foreground }]}>Model Usage by Task Type</Text>
          {Object.entries(TASK_COLOR).map(([task, col]) => {
            const share = Math.round(Math.random() * 20 + 5);
            return (
              <View key={task} style={styles.modelUsageRow}>
                <View style={[styles.modelUsageDot, { backgroundColor: col }]} />
                <Text style={[styles.modelUsageTask, { color: colors.foreground }]}>{task}</Text>
                <View style={[styles.modelUsageBarBg, { backgroundColor: colors.border }]}>
                  <View style={[styles.modelUsageBarFill, { width: `${share}%` as any, backgroundColor: col }]} />
                </View>
                <Text style={[styles.modelUsageShare, { color: col }]}>{share}%</Text>
              </View>
            );
          })}

          <View style={[styles.infoBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="info" size={13} color={colors.mutedForeground} />
            <Text style={[styles.infoText, { color: colors.mutedForeground }]}>
              All models are free-tier via OpenRouter. Token usage contributes to quality scoring and future routing optimization. Telemetry is collected anonymously and only with user opt-in.
            </Text>
          </View>
        </View>
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
  toggleRow:          { flexDirection: "row", borderRadius: 10, borderWidth: 1, padding: 4, gap: 4 },
  toggleBtn:          { flex: 1, paddingVertical: 8, borderRadius: 7, borderWidth: 1, alignItems: "center" },
  toggleBtnText:      { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  metricsGrid:        { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  metricCard:         { width: "47%", borderRadius: 12, borderWidth: 1, padding: 12, gap: 4, alignItems: "flex-start" },
  metricIcon:         { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center", marginBottom: 2 },
  metricValue:        { fontSize: 17, fontFamily: "Inter_700Bold" },
  metricLabel:        { fontSize: 11, fontFamily: "Inter_400Regular" },
  trendChip:          { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 5, marginTop: 2 },
  trendText:          { fontSize: 10, fontFamily: "Inter_700Bold" },
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
  modelUsageTask:     { fontSize: 12, fontFamily: "Inter_500Medium", width: 80 },
  modelUsageBarBg:    { flex: 1, height: 5, borderRadius: 3, overflow: "hidden" },
  modelUsageBarFill:  { height: 5, borderRadius: 3 },
  modelUsageShare:    { fontSize: 11, fontFamily: "Inter_700Bold", minWidth: 32, textAlign: "right" },
  infoBox:            { flexDirection: "row", alignItems: "flex-start", gap: 8, borderRadius: 10, borderWidth: 1, padding: 12 },
  infoText:           { fontSize: 11, fontFamily: "Inter_400Regular", flex: 1, lineHeight: 17 },
});
