import { Feather } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

interface MetricCard {
  value: string | number;
  trend: string;
  up: boolean;
}

interface DayPoint {
  label: string;
  dau: number;
  downloads: number;
}

interface AnalyticsData {
  overview: Record<string, MetricCard>;
  dailySeries: DayPoint[];
  topDevices: { device: string; share: number }[];
  topCountries: { country: string; share: number }[];
}

interface Props {
  projectId: string;
}

const METRIC_META: Record<string, { label: string; icon: string; color: string }> = {
  totalDownloads:     { label: "Total Downloads",    icon: "download",     color: "#2B7FFF" },
  dailyActiveUsers:   { label: "Daily Active Users", icon: "users",        color: "#22C55E" },
  avgSessionLength:   { label: "Avg Session",        icon: "clock",        color: "#7B2FFF" },
  day7Retention:      { label: "Day-7 Retention",    icon: "repeat",       color: "#00D4FF" },
  crashRate:          { label: "Crash Rate",         icon: "alert-triangle",color: "#EF4444" },
  revenue:            { label: "Revenue",            icon: "dollar-sign",  color: "#FBBF24" },
  conversionRate:     { label: "Conversion",         icon: "trending-up",  color: "#F97316" },
  tutorialCompletion: { label: "Tutorial Done",      icon: "check-circle", color: "#34A853" },
};

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <View style={miniBarStyles.root}>
      <View style={[miniBarStyles.bg]}>
        <View style={[miniBarStyles.fill, { width: `${pct}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={[miniBarStyles.label, { color }]}>{value}%</Text>
    </View>
  );
}

const miniBarStyles = StyleSheet.create({
  root:  { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  bg:    { flex: 1, height: 5, borderRadius: 3, backgroundColor: "#ffffff18", overflow: "hidden" },
  fill:  { height: 5, borderRadius: 3 },
  label: { fontSize: 12, fontFamily: "Inter_700Bold", minWidth: 34, textAlign: "right" },
});

export function AnalyticsDashboard({ projectId }: Props) {
  const colors = useColors();
  const { accessToken } = useAuth();

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeChart, setActiveChart] = useState<"dau" | "downloads">("dau");

  useEffect(() => {
    load();
  }, [projectId]);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/publish/analytics`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={[styles.loadingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <ActivityIndicator color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Loading analytics…</Text>
      </View>
    );
  }

  if (!data) return null;

  const series = data.dailySeries;
  const chartData = series.map((d) => (activeChart === "dau" ? d.dau : d.downloads));
  const chartMax  = Math.max(...chartData, 1);
  const chartMin  = Math.min(...chartData, 0);
  const chartRange = chartMax - chartMin || 1;
  const chartColor = activeChart === "dau" ? "#2B7FFF" : "#22C55E";

  return (
    <View style={styles.root}>
      <View style={[styles.headerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name="bar-chart-2" size={20} color={colors.primary} />
        <View style={styles.headerText}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Analytics Dashboard</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            Last 14 days · Simulated pre-launch data
          </Text>
        </View>
        <Pressable onPress={load}>
          <Feather name="refresh-cw" size={16} color={colors.mutedForeground} />
        </Pressable>
      </View>

      {/* Metric cards grid */}
      <View style={styles.metricsGrid}>
        {Object.entries(data.overview).map(([key, metric]) => {
          const meta = METRIC_META[key];
          if (!meta) return null;
          return (
            <View key={key} style={[styles.metricCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.metricIcon, { backgroundColor: meta.color + "20" }]}>
                <Feather name={meta.icon as any} size={14} color={meta.color} />
              </View>
              <Text style={[styles.metricValue, { color: colors.foreground }]}>{String(metric.value)}</Text>
              <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>{meta.label}</Text>
              <View style={[styles.trendChip, { backgroundColor: metric.up ? "#22C55E18" : "#EF444418" }]}>
                <Feather name={metric.up ? "trending-up" : "trending-down"} size={10} color={metric.up ? "#22C55E" : "#EF4444"} />
                <Text style={[styles.trendText, { color: metric.up ? "#22C55E" : "#EF4444" }]}>{metric.trend}</Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Mini chart */}
      <View style={[styles.chartCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.chartHeader}>
          <Text style={[styles.chartTitle, { color: colors.foreground }]}>14-Day Trend</Text>
          <View style={styles.chartToggle}>
            {(["dau", "downloads"] as const).map((t) => (
              <Pressable
                key={t}
                onPress={() => setActiveChart(t)}
                style={[styles.toggleChip, {
                  backgroundColor: activeChart === t ? chartColor + "20" : "transparent",
                  borderColor: activeChart === t ? chartColor : colors.border,
                }]}
              >
                <Text style={[styles.toggleText, { color: activeChart === t ? chartColor : colors.mutedForeground }]}>
                  {t === "dau" ? "DAU" : "Downloads"}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        <View style={styles.barChart}>
          {chartData.map((v, i) => {
            const heightPct = ((v - chartMin) / chartRange) * 100;
            const isLast = i === chartData.length - 1;
            return (
              <View key={i} style={styles.barCol}>
                <View style={styles.barSlot}>
                  <View style={[
                    styles.bar,
                    {
                      height: `${Math.max(6, heightPct)}%` as any,
                      backgroundColor: isLast ? chartColor : chartColor + "77",
                      borderRadius: 3,
                    }
                  ]} />
                </View>
                {(i === 0 || i === 6 || i === 13) && (
                  <Text style={[styles.barLabel, { color: colors.mutedForeground }]}>
                    {series[i]?.label.split(" ")[0] ?? ""}
                  </Text>
                )}
              </View>
            );
          })}
        </View>

        <View style={styles.chartLegend}>
          <Text style={[styles.legendMin, { color: colors.mutedForeground }]}>
            Min: {chartMin.toLocaleString()}
          </Text>
          <Text style={[styles.legendMax, { color: chartColor }]}>
            Peak: {chartMax.toLocaleString()}
          </Text>
        </View>
      </View>

      {/* Devices */}
      <View style={[styles.listCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.listTitle, { color: colors.foreground }]}>Top Devices</Text>
        {data.topDevices.map((d, i) => (
          <View key={i} style={styles.listRow}>
            <Text style={[styles.listLabel, { color: colors.foreground }]}>{d.device}</Text>
            <MiniBar value={d.share} max={data.topDevices[0]?.share ?? 100} color={colors.primary} />
          </View>
        ))}
      </View>

      {/* Countries */}
      <View style={[styles.listCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.listTitle, { color: colors.foreground }]}>Top Countries</Text>
        {data.topCountries.map((c, i) => (
          <View key={i} style={styles.listRow}>
            <Text style={[styles.listLabel, { color: colors.foreground }]}>{c.country}</Text>
            <MiniBar value={c.share} max={data.topCountries[0]?.share ?? 100} color="#7B2FFF" />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:         { gap: 12 },
  loadingCard:  { alignItems: "center", gap: 10, padding: 32, borderRadius: 14, borderWidth: 1 },
  loadingText:  { fontSize: 13, fontFamily: "Inter_400Regular" },
  headerCard:   { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, borderWidth: 1, padding: 14 },
  headerText:   { flex: 1, gap: 2 },
  headerTitle:  { fontSize: 15, fontFamily: "Inter_700Bold" },
  headerSub:    { fontSize: 12, fontFamily: "Inter_400Regular" },
  metricsGrid:  { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  metricCard:   { width: "47%", borderRadius: 12, borderWidth: 1, padding: 12, gap: 4, alignItems: "flex-start" },
  metricIcon:   { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  metricValue:  { fontSize: 18, fontFamily: "Inter_700Bold" },
  metricLabel:  { fontSize: 11, fontFamily: "Inter_400Regular" },
  trendChip:    { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 6, paddingVertical: 3, borderRadius: 5, marginTop: 2 },
  trendText:    { fontSize: 10, fontFamily: "Inter_700Bold" },
  chartCard:    { borderRadius: 14, borderWidth: 1, padding: 16, gap: 12 },
  chartHeader:  { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  chartTitle:   { fontSize: 14, fontFamily: "Inter_700Bold" },
  chartToggle:  { flexDirection: "row", gap: 6 },
  toggleChip:   { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 7, borderWidth: 1 },
  toggleText:   { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  barChart:     { flexDirection: "row", alignItems: "flex-end", height: 80, gap: 3 },
  barCol:       { flex: 1, alignItems: "center", gap: 4 },
  barSlot:      { flex: 1, width: "100%", justifyContent: "flex-end" },
  bar:          { width: "100%" },
  barLabel:     { fontSize: 9, fontFamily: "Inter_400Regular" },
  chartLegend:  { flexDirection: "row", justifyContent: "space-between" },
  legendMin:    { fontSize: 11, fontFamily: "Inter_400Regular" },
  legendMax:    { fontSize: 11, fontFamily: "Inter_700Bold" },
  listCard:     { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  listTitle:    { fontSize: 14, fontFamily: "Inter_700Bold" },
  listRow:      { flexDirection: "row", alignItems: "center", gap: 10 },
  listLabel:    { fontSize: 12, fontFamily: "Inter_400Regular", width: 120 },
});
