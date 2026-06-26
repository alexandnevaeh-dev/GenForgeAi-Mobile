import { Feather } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { JobStatusCard, type BackgroundJob } from "@/components/JobStatusCard";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

const STATUS_FILTER_OPTIONS = [
  { value: "all",       label: "All" },
  { value: "running",   label: "Running" },
  { value: "pending",   label: "Queued" },
  { value: "completed", label: "Done" },
  { value: "failed",    label: "Failed" },
];

export default function JobsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { accessToken, user } = useAuth();
  const isGuest = !accessToken || user?.id === "guest";

  const [jobs, setJobs] = useState<BackgroundJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState<string | null>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top + 16;
  const bottomPad = Platform.OS === "web" ? 34 + 84 : insets.bottom + 84;

  const fetchJobs = useCallback(async () => {
    if (isGuest) { setLoading(false); return; }
    try {
      const res = await fetch("/api/jobs?limit=50", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error("Failed to fetch jobs");
      const data = (await res.json()) as { jobs: BackgroundJob[] };
      setJobs(data.jobs);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load jobs");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isGuest, accessToken]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  // Auto-refresh while any job is active
  useEffect(() => {
    const hasActive = jobs.some((j) => j.status === "pending" || j.status === "running");
    if (!hasActive) return;
    const id = setInterval(() => void fetchJobs(), 4000);
    return () => clearInterval(id);
  }, [jobs, fetchJobs]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchJobs();
  }, [fetchJobs]);

  const handleCancel = async (jobId: string) => {
    Alert.alert("Cancel Job", "Stop this generation job?", [
      { text: "Keep Running", style: "cancel" },
      {
        text: "Cancel Job",
        style: "destructive",
        onPress: async () => {
          try {
            await fetch(`/api/jobs/${jobId}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${accessToken}` },
            });
            setJobs((prev) =>
              prev.map((j) => (j.id === jobId ? { ...j, status: "cancelled" } : j))
            );
          } catch {
            Alert.alert("Error", "Failed to cancel job");
          }
        },
      },
    ]);
  };

  const handleJobUpdate = useCallback((updated: BackgroundJob) => {
    setJobs((prev) => prev.map((j) => (j.id === updated.id ? updated : j)));
  }, []);

  const filtered =
    filter === "all" ? jobs : jobs.filter((j) => j.status === filter);

  const counts = {
    running:   jobs.filter((j) => j.status === "running").length,
    pending:   jobs.filter((j) => j.status === "pending").length,
    completed: jobs.filter((j) => j.status === "completed").length,
    failed:    jobs.filter((j) => j.status === "failed").length,
  };
  const activeCount = counts.running + counts.pending;

  function timeAgo(iso: string): string {
    const ms = Date.now() - new Date(iso).getTime();
    const m = Math.floor(ms / 60000);
    if (m < 1) return "just now";
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    return `${Math.floor(h / 24)}d ago`;
  }

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: topPad, paddingBottom: bottomPad }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      <View style={styles.inner}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.foreground }]}>Jobs</Text>
          {activeCount > 0 && (
            <View style={[styles.activeBadge, { backgroundColor: colors.primary + "22" }]}>
              <View style={[styles.activeDot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.activeBadgeText, { color: colors.primary }]}>
                {activeCount} active
              </Text>
            </View>
          )}
        </View>

        {/* Stats row */}
        {!isGuest && !loading && jobs.length > 0 && (
          <View style={styles.statsRow}>
            {[
              { label: "Running",   count: counts.running,   color: "#2B7FFF" },
              { label: "Queued",    count: counts.pending,   color: "#F97316" },
              { label: "Done",      count: counts.completed, color: "#22C55E" },
              { label: "Failed",    count: counts.failed,    color: "#EF4444" },
            ].map((s) => (
              <View key={s.label} style={[styles.statChip, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.statDot, { backgroundColor: s.color }]} />
                <Text style={[styles.statCount, { color: colors.foreground }]}>{s.count}</Text>
                <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Filters */}
        {!isGuest && !loading && jobs.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            {STATUS_FILTER_OPTIONS.map((opt) => (
              <Pressable
                key={opt.value}
                onPress={() => setFilter(opt.value)}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: filter === opt.value ? colors.primary : colors.card,
                    borderColor: filter === opt.value ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text style={[styles.filterText, { color: filter === opt.value ? "#fff" : colors.mutedForeground }]}>
                  {opt.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {/* Content */}
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : isGuest ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="lock" size={28} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Sign in to see your jobs</Text>
            <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>
              Background generation jobs appear here. Create a game project to get started.
            </Text>
          </View>
        ) : error ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="alert-circle" size={28} color="#EF4444" />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Couldn't load jobs</Text>
            <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>{error}</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="cpu" size={28} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              {jobs.length === 0 ? "No jobs yet" : "No jobs in this filter"}
            </Text>
            <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>
              {jobs.length === 0
                ? "Start generating a game project. Jobs run in the background so you can keep using the app."
                : "Try a different filter."}
            </Text>
          </View>
        ) : (
          <View style={styles.jobList}>
            {filtered.map((job) => (
              <View key={job.id}>
                <JobStatusCard
                  job={job}
                  onJobUpdate={handleJobUpdate}
                  onCancel={handleCancel}
                  poll={job.status === "running" || job.status === "pending"}
                />
                <Text style={[styles.jobTime, { color: colors.mutedForeground }]}>
                  Started {timeAgo(job.createdAt)}
                  {job.projectId ? " · project linked" : ""}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  inner: { paddingHorizontal: 20, gap: 16 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", letterSpacing: -0.3, flex: 1 },
  activeBadge: { flexDirection: "row", alignItems: "center", gap: 6, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 },
  activeDot: { width: 6, height: 6, borderRadius: 3 },
  activeBadgeText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  statsRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  statChip: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 10, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 6 },
  statDot: { width: 6, height: 6, borderRadius: 3 },
  statCount: { fontSize: 13, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  filterScroll: { marginHorizontal: -20, paddingHorizontal: 20 },
  filterChip: { borderRadius: 20, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 7, marginRight: 8 },
  filterText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  center: { alignItems: "center", paddingVertical: 60 },
  emptyCard: { borderRadius: 16, borderWidth: 1, padding: 32, alignItems: "center", gap: 12 },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  emptyBody: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  jobList: { gap: 4 },
  jobTime: { fontSize: 11, fontFamily: "Inter_400Regular", paddingLeft: 4, paddingBottom: 8 },
});
