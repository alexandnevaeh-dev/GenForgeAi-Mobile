import { Feather } from "@expo/vector-icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { AGENT_DEFS, PHASE_LABELS } from "@/constants/agents";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { AgentNetwork, type AgentState } from "@/components/AgentNetwork";

export type JobStatus = "pending" | "running" | "completed" | "failed" | "cancelled";

export interface LiveJob {
  id: string;
  type: string;
  status: JobStatus;
  phase: number;
  progress: number;
  label: string;
  error?: string | null;
  logs?: string[];
  projectId?: string | null;
  createdAt: string;
  completedAt?: string | null;
}

interface Props {
  job: LiveJob;
  onJobUpdate?: (job: LiveJob) => void;
  onCancel?: (jobId: string) => void;
}

const PHASE_COLORS: Record<number, string> = {
  1: "#2B7FFF",
  2: "#7B2FFF",
  3: "#00D4FF",
  4: "#F97316",
  5: "#22C55E",
  6: "#EF4444",
};

const PHASE_STEP_LABELS = ["", "Foundation", "World & Story", "Characters", "Image Gen", "QA & Balance", "Packaging"];

function deriveAgentStates(phase: number, status: JobStatus, progress: number): AgentState[] {
  const isComplete = status === "completed" || progress >= 100;
  return AGENT_DEFS.map((agent) => {
    if (isComplete) return { agentId: agent.id, status: "done" };
    if (agent.phase < phase) return { agentId: agent.id, status: "done" };
    if (agent.phase === phase) return { agentId: agent.id, status: "active" };
    return { agentId: agent.id, status: "queued" };
  });
}

function PulsingDot({ color }: { color: string }) {
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, { toValue: 1.5, duration: 600, useNativeDriver: true }),
        Animated.timing(scale, { toValue: 1, duration: 600, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [scale]);
  return <Animated.View style={[styles.pulseDot, { backgroundColor: color, transform: [{ scale }] }]} />;
}

export function GenerationConsole({ job: initialJob, onJobUpdate, onCancel }: Props) {
  const colors = useColors();
  const { accessToken } = useAuth();
  const [job, setJob] = useState<LiveJob>(initialJob);
  const [showAgents, setShowAgents] = useState(false);
  const logScrollRef = useRef<ScrollView>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isTerminal = (s: JobStatus) => s === "completed" || s === "failed" || s === "cancelled";
  const isActive = job.status === "pending" || job.status === "running";

  const fetchJob = useCallback(async () => {
    if (!accessToken) return;
    try {
      const res = await fetch(`/api/jobs/${job.id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) return;
      const data = (await res.json()) as { job: LiveJob };
      setJob(data.job);
      onJobUpdate?.(data.job);
      if (isTerminal(data.job.status)) {
        if (intervalRef.current) clearInterval(intervalRef.current);
      }
    } catch {
      // non-fatal
    }
  }, [accessToken, job.id, onJobUpdate]);

  useEffect(() => {
    if (isTerminal(job.status)) return;
    void fetchJob();
    intervalRef.current = setInterval(() => void fetchJob(), 2000);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [job.id]);

  useEffect(() => {
    setJob(initialJob);
  }, [initialJob.id, initialJob.status]);

  const logs = job.logs ?? [];
  const phaseColor = PHASE_COLORS[job.phase] ?? colors.primary;
  const agentStates = deriveAgentStates(job.phase, job.status, job.progress);
  const phaseLabel = job.label || PHASE_STEP_LABELS[job.phase] || "Processing…";

  const statusIcon = job.status === "completed" ? "check-circle"
    : job.status === "failed" ? "alert-circle"
    : job.status === "cancelled" ? "x-circle"
    : job.status === "running" ? "zap"
    : "clock";

  const statusColor = job.status === "completed" ? colors.success
    : job.status === "failed" ? colors.destructive
    : job.status === "cancelled" ? colors.mutedForeground
    : phaseColor;

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: isActive ? phaseColor + "55" : colors.border }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {isActive ? <PulsingDot color={phaseColor} /> : (
            <Feather name={statusIcon as any} size={14} color={statusColor} />
          )}
          <View>
            <Text style={[styles.statusLabel, { color: statusColor }]}>
              {job.status === "pending" ? "Queued" : job.status === "running" ? "Generating" : job.status === "completed" ? "Complete" : job.status === "failed" ? "Failed" : "Cancelled"}
            </Text>
            <Text style={[styles.phaseLabel, { color: colors.foreground }]}>{phaseLabel}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <Text style={[styles.pct, { color: statusColor }]}>{job.progress}%</Text>
          {isActive && onCancel && (
            <Pressable onPress={() => onCancel(job.id)} style={[styles.cancelBtn, { borderColor: colors.border }]}>
              <Feather name="x" size={13} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Progress bar */}
      <View style={[styles.progressBg, { backgroundColor: colors.muted }]}>
        <View style={[styles.progressFill, { backgroundColor: statusColor, width: `${job.progress}%` as any }]} />
      </View>

      {/* Phase timeline */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.phaseScroll} contentContainerStyle={styles.phaseRow}>
        {[1, 2, 3, 4, 5, 6].map((ph) => {
          const done = ph < job.phase || job.status === "completed" || job.progress >= 100;
          const active = ph === job.phase && isActive;
          const c = PHASE_COLORS[ph] ?? colors.primary;
          return (
            <View key={ph} style={styles.phaseItem}>
              <View style={[styles.phaseDot, {
                backgroundColor: done ? colors.success : active ? c : colors.muted,
                borderColor: active ? c : "transparent",
                borderWidth: active ? 2 : 0,
              }]}>
                {done && <Feather name="check" size={7} color="#fff" />}
              </View>
              <Text style={[styles.phaseName, { color: done ? colors.success : active ? c : colors.mutedForeground }]}>
                {PHASE_STEP_LABELS[ph]}
              </Text>
              {ph < 6 && <View style={[styles.phaseConnector, { backgroundColor: done ? colors.success : colors.muted }]} />}
            </View>
          );
        })}
      </ScrollView>

      {/* Generation log */}
      {logs.length > 0 && (
        <View style={[styles.logBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <View style={styles.logHeader}>
            <Feather name="terminal" size={11} color={colors.mutedForeground} />
            <Text style={[styles.logHeaderText, { color: colors.mutedForeground }]}>GENERATION LOG</Text>
            {isActive && <ActivityIndicator size="small" color={phaseColor} style={styles.logSpinner} />}
          </View>
          <ScrollView
            ref={logScrollRef}
            style={styles.logScroll}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => logScrollRef.current?.scrollToEnd({ animated: true })}
          >
            {logs.map((line, i) => {
              const isPhaseStart = line.includes("▶ Phase") || line.includes("✔ Phase") || line.includes("🏁");
              const isAsset = line.includes("✅ Asset");
              const isModel = line.includes("🔀 Model");
              const lineColor = isPhaseStart ? phaseColor : isAsset ? colors.success : isModel ? colors.secondary : colors.mutedForeground;
              return (
                <Text key={i} style={[styles.logLine, { color: lineColor, fontFamily: isPhaseStart ? "Inter_600SemiBold" : "Inter_400Regular" }]}>
                  {line}
                </Text>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Agent network toggle */}
      <Pressable
        onPress={() => setShowAgents((v) => !v)}
        style={[styles.agentsToggle, { backgroundColor: colors.muted }]}
      >
        <Feather name="cpu" size={13} color={colors.primary} />
        <Text style={[styles.agentsToggleText, { color: colors.primary }]}>
          {showAgents ? "Hide" : "Show"} Agent Network
        </Text>
        <Feather name={showAgents ? "chevron-up" : "chevron-down"} size={13} color={colors.primary} />
      </Pressable>

      {showAgents && (
        <AgentNetwork agentStates={agentStates} compact />
      )}

      {/* Error */}
      {job.status === "failed" && job.error && (
        <View style={[styles.errorBox, { backgroundColor: "#EF444415", borderColor: "#EF444433" }]}>
          <Feather name="alert-circle" size={13} color="#EF4444" />
          <Text style={styles.errorText}>{job.error}</Text>
        </View>
      )}

      {/* Complete celebration */}
      {job.status === "completed" && (
        <View style={[styles.completeRow, { backgroundColor: colors.success + "15", borderColor: colors.success + "33" }]}>
          <Feather name="check-circle" size={14} color={colors.success} />
          <Text style={[styles.completeText, { color: colors.success }]}>Project generated successfully! Check the Blueprint, Tasks, and Assets tabs.</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pulseDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  statusLabel: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  phaseLabel: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    marginTop: 1,
  },
  pct: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  cancelBtn: {
    padding: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  progressBg: {
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: 4,
    borderRadius: 2,
  },
  phaseScroll: { flexGrow: 0 },
  phaseRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 0,
  },
  phaseItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  phaseDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  phaseName: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
  },
  phaseConnector: {
    width: 10,
    height: 1.5,
    marginHorizontal: 3,
    borderRadius: 1,
  },
  logBox: {
    borderRadius: 10,
    borderWidth: 1,
    overflow: "hidden",
  },
  logHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  logHeaderText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
    flex: 1,
  },
  logSpinner: { marginLeft: "auto" },
  logScroll: {
    maxHeight: 180,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  logLine: {
    fontSize: 11,
    lineHeight: 18,
  },
  agentsToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  agentsToggleText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
  },
  errorText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#EF4444",
    flex: 1,
    lineHeight: 17,
  },
  completeRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
  },
  completeText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    flex: 1,
    lineHeight: 17,
  },
});
