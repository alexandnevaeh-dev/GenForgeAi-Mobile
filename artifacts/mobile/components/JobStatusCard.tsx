import { Feather } from "@expo/vector-icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export type JobStatus = "pending" | "running" | "completed" | "failed" | "cancelled";

export interface BackgroundJob {
  id: string;
  type: string;
  status: JobStatus;
  phase: number;
  progress: number;
  label: string;
  error?: string | null;
  projectId?: string | null;
  createdAt: string;
  completedAt?: string | null;
}

const STATUS_META: Record<JobStatus, { icon: string; color: string; label: string }> = {
  pending:   { icon: "clock",        color: "#F97316", label: "Queued"     },
  running:   { icon: "zap",          color: "#2B7FFF", label: "Running"    },
  completed: { icon: "check-circle", color: "#22C55E", label: "Complete"   },
  failed:    { icon: "alert-circle", color: "#EF4444", label: "Failed"     },
  cancelled: { icon: "x-circle",     color: "#6B6B80", label: "Cancelled"  },
};

const PHASE_LABELS = ["", "Foundation", "World & Story", "Characters", "Image Gen", "QA & Balance", "Packaging"];

interface Props {
  job: BackgroundJob;
  onJobUpdate?: (job: BackgroundJob) => void;
  onCancel?: (jobId: string) => void;
  /** If true, poll the API until the job reaches a terminal state */
  poll?: boolean;
}

export function JobStatusCard({ job: initialJob, onJobUpdate, onCancel, poll = true }: Props) {
  const colors = useColors();
  const { accessToken } = useAuth();
  const [job, setJob] = useState<BackgroundJob>(initialJob);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isTerminal = (s: JobStatus) => s === "completed" || s === "failed" || s === "cancelled";

  const fetchJob = useCallback(async () => {
    if (!accessToken) return;
    try {
      const res = await fetch(`/api/jobs/${job.id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) return;
      const data = (await res.json()) as { job: BackgroundJob };
      setJob(data.job);
      onJobUpdate?.(data.job);
      if (isTerminal(data.job.status)) {
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    } catch {
      // non-fatal — keep polling
    }
  }, [accessToken, job.id, onJobUpdate]);

  useEffect(() => {
    if (!poll || isTerminal(job.status)) return;
    intervalRef.current = setInterval(() => void fetchJob(), 3000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [poll, fetchJob, job.status]);

  // sync if parent updates the initial job
  useEffect(() => { setJob(initialJob); }, [initialJob.id, initialJob.status]);

  const meta = STATUS_META[job.status] ?? STATUS_META.pending;
  const isActive = job.status === "pending" || job.status === "running";
  const currentPhaseLabel = job.label || PHASE_LABELS[job.phase] || "Processing…";

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: isActive ? meta.color + "55" : colors.border }]}>
      {/* Header row */}
      <View style={styles.header}>
        <View style={[styles.statusBadge, { backgroundColor: meta.color + "22" }]}>
          <Feather name={meta.icon as any} size={12} color={meta.color} />
          <Text style={[styles.statusText, { color: meta.color }]}>{meta.label.toUpperCase()}</Text>
        </View>

        <Text style={[styles.jobType, { color: colors.mutedForeground }]}>
          {job.type.toUpperCase()}
        </Text>

        {isActive && onCancel && (
          <Pressable onPress={() => onCancel(job.id)} style={styles.cancelBtn}>
            <Feather name="x" size={13} color={colors.mutedForeground} />
          </Pressable>
        )}
      </View>

      {/* Phase label */}
      <Text style={[styles.phaseLabel, { color: colors.foreground }]}>
        {isActive ? currentPhaseLabel : job.status === "completed" ? "Generation complete" : job.error ?? "Job ended"}
      </Text>

      {/* Progress bar */}
      {(isActive || job.status === "completed") && (
        <View style={styles.progressWrap}>
          <View style={[styles.progressBg, { backgroundColor: colors.muted }]}>
            <View
              style={[
                styles.progressFill,
                { backgroundColor: meta.color, width: `${job.progress}%` as any },
              ]}
            />
          </View>
          <View style={styles.progressMeta}>
            {isActive && <ActivityIndicator size="small" color={meta.color} />}
            <Text style={[styles.progressPct, { color: meta.color }]}>{job.progress}%</Text>
          </View>
        </View>
      )}

      {/* Phase dots */}
      {isActive && (
        <View style={styles.phases}>
          {[1, 2, 3, 4, 5, 6].map((ph) => {
            const done = ph < job.phase || (ph === job.phase && job.status === "completed");
            const active = ph === job.phase && job.status === "running";
            return (
              <View key={ph} style={styles.phaseItem}>
                <View
                  style={[
                    styles.phaseDot,
                    {
                      backgroundColor: done
                        ? colors.success
                        : active
                        ? meta.color
                        : colors.muted,
                      borderColor: active ? meta.color : "transparent",
                      borderWidth: active ? 2 : 0,
                    },
                  ]}
                />
                <Text style={[styles.phaseName, { color: done || active ? colors.foreground : colors.mutedForeground }]}>
                  {PHASE_LABELS[ph]}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Error */}
      {job.status === "failed" && job.error && (
        <View style={[styles.errorBox, { backgroundColor: "#EF444422", borderColor: "#EF444444" }]}>
          <Text style={styles.errorText}>{job.error}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusText: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
  jobType: { flex: 1, fontSize: 11, fontFamily: "Inter_500Medium" },
  cancelBtn: { padding: 4 },
  phaseLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  progressWrap: { gap: 6 },
  progressBg: { height: 5, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: 5, borderRadius: 3 },
  progressMeta: { flexDirection: "row", alignItems: "center", justifyContent: "flex-end", gap: 6 },
  progressPct: { fontSize: 12, fontFamily: "Inter_700Bold" },
  phases: { flexDirection: "row", gap: 10, flexWrap: "wrap" },
  phaseItem: { flexDirection: "row", alignItems: "center", gap: 5 },
  phaseDot: { width: 7, height: 7, borderRadius: 4 },
  phaseName: { fontSize: 10, fontFamily: "Inter_400Regular" },
  errorBox: { borderRadius: 8, borderWidth: 1, padding: 8 },
  errorText: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#EF4444" },
});
