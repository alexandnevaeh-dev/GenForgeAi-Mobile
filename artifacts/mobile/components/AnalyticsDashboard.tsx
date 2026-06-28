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

interface ProjectStats {
  status: string;
  progress: number;
  assetsGenerated: number;
  isPublic: boolean;
  lastGeneratedAt: string | null;
  createdAt: string | null;
}

interface AnalyticsData {
  published: boolean;
  message: string;
  projectStats: ProjectStats;
}

interface Props {
  projectId: string;
}

function fmtDate(value: string | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function AnalyticsDashboard({ projectId }: Props) {
  const colors = useColors();
  const { accessToken } = useAuth();

  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/publish/analytics`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error(`Server responded ${res.status}`);
      setData((await res.json()) as AnalyticsData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, [projectId, accessToken]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <View style={[styles.loadingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <ActivityIndicator color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Loading analytics…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.errorCard, { backgroundColor: colors.destructive + "18", borderColor: colors.destructive }]}>
        <Feather name="alert-triangle" size={14} color={colors.destructive} />
        <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
      </View>
    );
  }

  if (!data) return null;

  const stats = data.projectStats;
  const statRows: { label: string; value: string; icon: string; color: string }[] = [
    { label: "Status", value: stats.status.replace(/_/g, " "), icon: "flag", color: "#2B7FFF" },
    { label: "Progress", value: `${stats.progress}%`, icon: "trending-up", color: "#22C55E" },
    { label: "Assets generated", value: String(stats.assetsGenerated), icon: "image", color: "#F97316" },
    { label: "Visibility", value: stats.isPublic ? "Public" : "Private", icon: stats.isPublic ? "globe" : "lock", color: "#7B2FFF" },
    { label: "Last generated", value: fmtDate(stats.lastGeneratedAt), icon: "clock", color: "#00D4FF" },
    { label: "Created", value: fmtDate(stats.createdAt), icon: "calendar", color: "#FBBF24" },
  ];

  return (
    <View style={styles.root}>
      <View style={[styles.headerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name="bar-chart-2" size={20} color={colors.primary} />
        <View style={styles.headerText}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Analytics Dashboard</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            {data.published ? "Published — awaiting analytics provider" : "Not published yet"}
          </Text>
        </View>
        <Pressable onPress={load}>
          <Feather name="refresh-cw" size={16} color={colors.mutedForeground} />
        </Pressable>
      </View>

      {/* Honest unpublished / no-data state */}
      <View style={[styles.noticeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={[styles.noticeIcon, { backgroundColor: colors.primary + "20" }]}>
          <Feather name={data.published ? "link" : "upload-cloud"} size={18} color={colors.primary} />
        </View>
        <Text style={[styles.noticeTitle, { color: colors.foreground }]}>
          {data.published ? "Connect an analytics provider" : "No store analytics yet"}
        </Text>
        <Text style={[styles.noticeText, { color: colors.mutedForeground }]}>{data.message}</Text>
      </View>

      {/* Real project activity */}
      <View style={[styles.statsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.statsTitle, { color: colors.foreground }]}>Project Activity</Text>
        {statRows.map((row) => (
          <View key={row.label} style={[styles.statRow, { borderColor: colors.border }]}>
            <View style={styles.statLeft}>
              <View style={[styles.statIcon, { backgroundColor: row.color + "20" }]}>
                <Feather name={row.icon as any} size={13} color={row.color} />
              </View>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{row.label}</Text>
            </View>
            <Text style={[styles.statValue, { color: colors.foreground }]}>{row.value}</Text>
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
  errorCard:    { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 10, borderWidth: 1, padding: 12 },
  errorText:    { fontSize: 12, fontFamily: "Inter_400Regular", flex: 1 },
  headerCard:   { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, borderWidth: 1, padding: 14 },
  headerText:   { flex: 1, gap: 2 },
  headerTitle:  { fontSize: 15, fontFamily: "Inter_700Bold" },
  headerSub:    { fontSize: 12, fontFamily: "Inter_400Regular" },
  noticeCard:   { alignItems: "center", gap: 8, borderRadius: 14, borderWidth: 1, padding: 20 },
  noticeIcon:   { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  noticeTitle:  { fontSize: 15, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  noticeText:   { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 18 },
  statsCard:    { borderRadius: 14, borderWidth: 1, padding: 14, gap: 4 },
  statsTitle:   { fontSize: 14, fontFamily: "Inter_700Bold", marginBottom: 6 },
  statRow:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 10, borderTopWidth: 0.5 },
  statLeft:     { flexDirection: "row", alignItems: "center", gap: 10 },
  statIcon:     { width: 28, height: 28, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  statLabel:    { fontSize: 13, fontFamily: "Inter_400Regular" },
  statValue:    { fontSize: 13, fontFamily: "Inter_600SemiBold" },
});
