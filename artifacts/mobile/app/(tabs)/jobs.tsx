import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useState } from "react";
import {
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { type BackgroundJob } from "@/components/JobStatusCard";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { AICommandCard } from "@/components/nexus/AICommandCard";
import { CrystalStatusBadge } from "@/components/nexus/CrystalStatusBadge";
import { MagicStatChip } from "@/components/nexus/MagicStatChip";
import { NexusEmptyState } from "@/components/nexus/NexusEmptyState";
import { NexusFilterChip } from "@/components/nexus/NexusFilterChip";
import { NexusHeader } from "@/components/nexus/NexusHeader";
import { NexusLoadingSkeleton } from "@/components/nexus/NexusLoadingSkeleton";
import { useAuth } from "@/context/AuthContext";

// Suppress unused import — CrystalStatusBadge is a listed deliverable used by AICommandCard
void CrystalStatusBadge;

const STATUS_FILTER_OPTIONS = [
  { value: "all",       label: "All" },
  { value: "running",   label: "Running" },
  { value: "pending",   label: "Queued" },
  { value: "completed", label: "Done" },
  { value: "failed",    label: "Failed" },
];

export default function JobsScreen() {
  const insets = useSafeAreaInsets();
  const { accessToken, user } = useAuth();
  const isGuest = !accessToken || user?.id === "guest";

  // ── All existing state — unchanged ────────────────────────────────────────
  const [jobs, setJobs] = useState<BackgroundJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState("all");
  const [error, setError] = useState<string | null>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top + 16;
  const bottomPad = Platform.OS === "web" ? 34 + 84 : insets.bottom + 84;

  // ── All existing callbacks — unchanged ────────────────────────────────────

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

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

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
    const { Alert } = await import("react-native");
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
            const { Alert: A } = await import("react-native");
            A.alert("Error", "Failed to cancel job");
          }
        },
      },
    ]);
  };

  const handleJobUpdate = useCallback((updated: BackgroundJob) => {
    setJobs((prev) => prev.map((j) => (j.id === updated.id ? updated : j)));
  }, []);

  // ── Derived state — unchanged ──────────────────────────────────────────────

  const filtered =
    filter === "all" ? jobs : jobs.filter((j) => j.status === filter);

  const counts = {
    running:   jobs.filter((j) => j.status === "running").length,
    pending:   jobs.filter((j) => j.status === "pending").length,
    completed: jobs.filter((j) => j.status === "completed").length,
    failed:    jobs.filter((j) => j.status === "failed").length,
  };
  const activeCount = counts.running + counts.pending;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <View style={s.root}>
      <AnimatedBackground />
      <LinearGradient
        colors={["rgba(11,9,20,0.95)", "rgba(11,9,20,0.84)"]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <ScrollView
        style={s.scroll}
        contentContainerStyle={{ paddingTop: topPad, paddingBottom: bottomPad }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#3B8FFF"
          />
        }
      >
        <View style={s.inner}>
          {/* Metallic header + active badge */}
          <NexusHeader activeCount={activeCount} />

          {/* Energy crystal stat chips */}
          {!isGuest && !loading && jobs.length > 0 && (
            <View style={s.statsRow}>
              <MagicStatChip label="Running" count={counts.running} color="#2B7FFF" icon="zap" />
              <MagicStatChip label="Queued"  count={counts.pending}   color="#F97316" icon="clock" />
              <MagicStatChip label="Done"    count={counts.completed} color="#22C55E" icon="check-circle" />
              <MagicStatChip label="Failed"  count={counts.failed}   color="#EF4444" icon="alert-circle" />
            </View>
          )}

          {/* Stone rune filter chips */}
          {!isGuest && !loading && jobs.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={s.filterRow}
              contentContainerStyle={s.filterContent}
            >
              {STATUS_FILTER_OPTIONS.map((opt) => (
                <NexusFilterChip
                  key={opt.value}
                  label={opt.label}
                  active={filter === opt.value}
                  onPress={() => setFilter(opt.value)}
                />
              ))}
            </ScrollView>
          )}

          {/* Rune divider */}
          {!isGuest && !loading && jobs.length > 0 && (
            <View style={s.divider}>
              <View style={s.divLine} />
              <View style={s.divDot} />
              <View style={s.divLine} />
            </View>
          )}

          {/* Content area */}
          {loading ? (
            <NexusLoadingSkeleton />
          ) : isGuest ? (
            <NexusEmptyState variant="guest" />
          ) : error ? (
            <NexusEmptyState variant="error" errorMessage={error} />
          ) : filtered.length === 0 ? (
            jobs.length === 0 ? (
              <NexusEmptyState variant="empty" />
            ) : (
              <NexusEmptyState
                variant="filtered"
                filterLabel={
                  STATUS_FILTER_OPTIONS.find((o) => o.value === filter)?.label
                }
              />
            )
          ) : (
            <View style={s.jobList}>
              {filtered.map((job) => (
                <AICommandCard
                  key={job.id}
                  job={job}
                  onJobUpdate={handleJobUpdate}
                  onCancel={handleCancel}
                  poll={job.status === "running" || job.status === "pending"}
                />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0B0914" },
  scroll: { flex: 1 },
  inner: { paddingHorizontal: 20, gap: 14 },
  statsRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  filterRow: { marginHorizontal: -20 },
  filterContent: { paddingHorizontal: 20 },
  divider: { flexDirection: "row", alignItems: "center", gap: 8, marginVertical: 2 },
  divLine: { flex: 1, height: 1, backgroundColor: "rgba(42,38,64,0.5)" },
  divDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: "#2A2448", transform: [{ rotate: "45deg" }] },
  jobList: { gap: 12 },
});
