import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

import { type BackgroundJob, type JobStatus } from "@/components/JobStatusCard";
import { useAuth } from "@/context/AuthContext";
import { CrystalStatusBadge } from "./CrystalStatusBadge";
import { EnergyProgressBar } from "./EnergyProgressBar";
import { PipelineTimeline } from "./PipelineTimeline";

const JOB_TYPE_LABELS: Record<string, string> = {
  game_generation:   "Game Gen",
  asset_generation:  "Asset Gen",
  world_generation:  "World Gen",
  character_gen:     "Char Gen",
  audio_generation:  "Audio Gen",
};

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const isTerminal = (s: JobStatus) =>
  s === "completed" || s === "failed" || s === "cancelled";

interface Props {
  job: BackgroundJob;
  onJobUpdate?: (job: BackgroundJob) => void;
  onCancel?: (jobId: string) => void;
  poll?: boolean;
}

export const AICommandCard = memo(function AICommandCard({
  job: initialJob,
  onJobUpdate,
  onCancel,
  poll = true,
}: Props) {
  const { accessToken } = useAuth();
  const [job, setJob] = useState<BackgroundJob>(initialJob);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Identical polling logic to JobStatusCard ─────────────────────────────
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

  // Sync when parent pushes a new status
  useEffect(() => { setJob(initialJob); }, [initialJob.id, initialJob.status]);

  // ── Visual state ──────────────────────────────────────────────────────────
  const isActive = job.status === "pending" || job.status === "running";
  const isFailed = job.status === "failed";
  const isComplete = job.status === "completed";

  // Animated energy border overlay for active jobs
  const borderPulse = useRef(new Animated.Value(0.25)).current;
  const cardMount = useRef(new Animated.Value(0)).current;

  // Completion flash
  const completionFlash = useRef(new Animated.Value(0)).current;
  const prevStatus = useRef(job.status);

  useEffect(() => {
    Animated.timing(cardMount, { toValue: 1, duration: 400, useNativeDriver: true }).start();
  }, [cardMount]);

  useEffect(() => {
    if (!isActive) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(borderPulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
        Animated.timing(borderPulse, { toValue: 0.2, duration: 1200, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isActive, borderPulse]);

  useEffect(() => {
    if (
      job.status === "completed" &&
      prevStatus.current !== "completed"
    ) {
      Animated.sequence([
        Animated.timing(completionFlash, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(completionFlash, { toValue: 0, duration: 800, useNativeDriver: true }),
      ]).start();
    }
    prevStatus.current = job.status;
  }, [job.status, completionFlash]);

  const statusColor = isActive
    ? "#2B7FFF"
    : isComplete
    ? "#22C55E"
    : isFailed
    ? "#EF4444"
    : "#6B6B80";

  const typeLabel =
    JOB_TYPE_LABELS[job.type] ?? job.type.replace(/_/g, " ").toUpperCase();

  const phaseText = isActive
    ? job.label || `Phase ${job.phase}`
    : isComplete
    ? "Generation Complete"
    : isFailed
    ? job.error ?? "Job Failed"
    : "Cancelled";

  return (
    <Animated.View style={[styles.outerWrap, { opacity: cardMount }]}>
      {/* Card base */}
      <View style={styles.card}>
        <LinearGradient colors={["#0E0C1E", "#0C0A1A"]} style={StyleSheet.absoluteFill} />

        {/* Static border */}
        <View
          style={[
            styles.staticBorder,
            isFailed && styles.failedBorder,
            isComplete && styles.completeBorder,
          ]}
        />

        {/* Animated energy border (active jobs) */}
        {isActive && (
          <Animated.View
            style={[styles.energyBorder, { borderColor: statusColor, opacity: borderPulse }]}
            pointerEvents="none"
          />
        )}

        {/* Completion flash border */}
        <Animated.View
          style={[styles.completionFlash, { opacity: completionFlash }]}
          pointerEvents="none"
        />

        {/* Blueprint grid lines */}
        <View style={grid.v} pointerEvents="none" />
        <View style={grid.h} pointerEvents="none" />

        {/* Header row */}
        <View style={styles.header}>
          <CrystalStatusBadge status={job.status} />
          <Text style={styles.typeLabel} numberOfLines={1}>
            {typeLabel}
          </Text>
          {isActive && onCancel && (
            <Pressable onPress={() => onCancel(job.id)} style={styles.cancelBtn} hitSlop={6}>
              <View style={styles.cancelBg}>
                <LinearGradient colors={["#1A1628", "#110E1E"]} style={StyleSheet.absoluteFill} />
                <View style={styles.cancelBorder} />
                <Feather name="x" size={12} color="#5A5478" />
              </View>
            </Pressable>
          )}
        </View>

        {/* Phase / status label */}
        <Text
          style={[
            styles.phaseLabel,
            isFailed && styles.phaseFailed,
            isComplete && styles.phaseComplete,
          ]}
          numberOfLines={1}
        >
          {phaseText}
        </Text>

        {/* Energy progress bar */}
        {(isActive || isComplete) && (
          <EnergyProgressBar
            progress={job.progress}
            color={statusColor}
            isActive={isActive}
            showLabel
          />
        )}

        {/* Pipeline timeline — active jobs only */}
        {isActive && (
          <PipelineTimeline phase={job.phase} status={job.status} />
        )}

        {/* Error box — failed jobs */}
        {isFailed && job.error && (
          <View style={styles.errorBox}>
            <LinearGradient colors={["#2A0A0A", "#1A0808"]} style={StyleSheet.absoluteFill} />
            <View style={styles.errorBorder} />
            <Feather name="alert-circle" size={12} color="#EF4444" style={styles.errorIcon} />
            <Text style={styles.errorText} numberOfLines={3}>{job.error}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Feather name="clock" size={10} color="#2A2448" />
          <Text style={styles.footerText}>
            Started {timeAgo(job.createdAt)}
            {job.projectId ? " · project linked" : ""}
          </Text>
        </View>
      </View>
    </Animated.View>
  );
});

const grid = StyleSheet.create({
  v: {
    position: "absolute",
    right: "30%",
    top: 0,
    bottom: 0,
    width: 1,
    backgroundColor: "rgba(59,143,255,0.035)",
    pointerEvents: "none",
  },
  h: {
    position: "absolute",
    top: "55%",
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(59,143,255,0.035)",
    pointerEvents: "none",
  },
});

const styles = StyleSheet.create({
  outerWrap: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 7,
  },
  card: {
    borderRadius: 16,
    padding: 14,
    gap: 11,
    overflow: "hidden",
  },
  staticBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(42,38,64,0.8)",
  },
  failedBorder: { borderColor: "rgba(239,68,68,0.3)" },
  completeBorder: { borderColor: "rgba(34,197,94,0.25)" },
  energyBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    borderWidth: 1.5,
  },
  completionFlash: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#22C55E",
  },

  header: { flexDirection: "row", alignItems: "center", gap: 8 },
  typeLabel: {
    flex: 1,
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: "#3A3458",
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  cancelBtn: {},
  cancelBg: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  cancelBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(42,38,64,0.8)",
  },

  phaseLabel: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#C0B8E0",
  },
  phaseFailed: { color: "#EF4444" },
  phaseComplete: { color: "#22C55E" },

  errorBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 7,
    borderRadius: 10,
    padding: 9,
    overflow: "hidden",
  },
  errorBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.3)",
  },
  errorIcon: {
    marginTop: 1,
    flexShrink: 0,
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 5,
    elevation: 3,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#EF4444",
    lineHeight: 18,
    opacity: 0.85,
  },

  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: -3,
  },
  footerText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "#2A2448",
  },
});
