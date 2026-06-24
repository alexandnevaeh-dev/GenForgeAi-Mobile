import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import type { PipelineTask, TaskStatus } from "@/constants/generation-pipeline";
import { useColors } from "@/hooks/useColors";

interface Props {
  tasks: PipelineTask[];
  currentPhase?: number;
}

const STATUS_CONFIG: Record<TaskStatus, { color: string; icon: string }> = {
  pending: { color: "#6B6B80", icon: "circle" },
  queued: { color: "#F97316", icon: "clock" },
  running: { color: "#2B7FFF", icon: "loader" },
  waiting: { color: "#7B2FFF", icon: "pause-circle" },
  completed: { color: "#22C55E", icon: "check-circle" },
  failed: { color: "#EF4444", icon: "x-circle" },
};

const PHASE_LABELS = ["", "Foundation", "World & Story", "Content", "Assets", "QA & Balance", "Export"];

export function TaskGraph({ tasks, currentPhase = 0 }: Props) {
  const colors = useColors();
  const [activePhaseFilter, setActivePhaseFilter] = useState<number | null>(null);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);

  const phases = [1, 2, 3, 4, 5, 6];
  const filteredTasks = activePhaseFilter ? tasks.filter((t) => t.phase === activePhaseFilter) : tasks;

  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const runningCount = tasks.filter((t) => t.status === "running").length;
  const totalPct = Math.round((completedCount / tasks.length) * 100);

  return (
    <View style={styles.root}>
      {/* Header stats */}
      <View style={[styles.statsRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary }]}>{tasks.length}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Total</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.success }]}>{completedCount}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Done</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.primary }]}>{runningCount}</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Active</Text>
        </View>
        <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: colors.accent }]}>{totalPct}%</Text>
          <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>Complete</Text>
        </View>
      </View>

      {/* Phase filter tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.phaseRow}>
        <Pressable
          onPress={() => setActivePhaseFilter(null)}
          style={[
            styles.phaseChip,
            { backgroundColor: !activePhaseFilter ? colors.primary : colors.card, borderColor: !activePhaseFilter ? colors.primary : colors.border }
          ]}
        >
          <Text style={[styles.phaseChipText, { color: !activePhaseFilter ? "#fff" : colors.mutedForeground }]}>
            All
          </Text>
        </Pressable>
        {phases.map((ph) => {
          const phTasks = tasks.filter((t) => t.phase === ph);
          const phDone = phTasks.filter((t) => t.status === "completed").length;
          const isActive = activePhaseFilter === ph;
          return (
            <Pressable
              key={ph}
              onPress={() => setActivePhaseFilter(isActive ? null : ph)}
              style={[
                styles.phaseChip,
                { backgroundColor: isActive ? colors.primary : colors.card, borderColor: isActive ? colors.primary : colors.border }
              ]}
            >
              <Text style={[styles.phaseChipText, { color: isActive ? "#fff" : colors.mutedForeground }]}>
                P{ph}
              </Text>
              <Text style={[styles.phaseBadge, { color: isActive ? "#fff" : phDone === phTasks.length ? colors.success : colors.mutedForeground }]}>
                {phDone}/{phTasks.length}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* Phase groups */}
      {(activePhaseFilter ? [activePhaseFilter] : phases).map((ph) => {
        const phaseTasks = filteredTasks.filter((t) => t.phase === ph);
        if (!phaseTasks.length) return null;
        const phaseDone = phaseTasks.filter((t) => t.status === "completed").length;
        const phaseRunning = phaseTasks.filter((t) => t.status === "running").length;
        const isCurrentPhase = ph === currentPhase;

        return (
          <View key={ph} style={styles.phaseGroup}>
            {/* Phase header */}
            <View style={styles.phaseHeader}>
              <View style={[styles.phaseNumBadge, {
                backgroundColor: phaseDone === phaseTasks.length ? colors.success : isCurrentPhase ? colors.primary : colors.muted
              }]}>
                <Text style={styles.phaseNumText}>{ph}</Text>
              </View>
              <Text style={[styles.phaseGroupLabel, { color: colors.foreground }]}>{PHASE_LABELS[ph]}</Text>
              {phaseRunning > 0 && (
                <View style={[styles.runningChip, { backgroundColor: colors.primary + "22" }]}>
                  <View style={[styles.runningDot, { backgroundColor: colors.primary }]} />
                  <Text style={[styles.runningText, { color: colors.primary }]}>{phaseRunning} running</Text>
                </View>
              )}
              <Text style={[styles.phaseProgress, { color: colors.mutedForeground }]}>
                {phaseDone}/{phaseTasks.length}
              </Text>
            </View>

            {/* Tasks */}
            {phaseTasks.map((task) => {
              const cfg = STATUS_CONFIG[task.status];
              const isExpanded = expandedTask === task.id;

              return (
                <Pressable
                  key={task.id}
                  onPress={() => setExpandedTask(isExpanded ? null : task.id)}
                  style={[styles.taskRow, {
                    backgroundColor: task.status === "running" ? colors.primary + "0A" : colors.card,
                    borderColor: task.status === "running" ? colors.primary : colors.border,
                  }]}
                >
                  <Feather name={cfg.icon as any} size={14} color={cfg.color} />
                  <View style={styles.taskInfo}>
                    <Text style={[styles.taskLabel, { color: colors.foreground }]} numberOfLines={isExpanded ? undefined : 1}>
                      {task.label}
                    </Text>
                    {(task.status === "running" && task.progress > 0) && (
                      <View style={[styles.taskProgressBg, { backgroundColor: colors.border }]}>
                        <View style={[styles.taskProgressFill, { width: `${task.progress}%` as any, backgroundColor: cfg.color }]} />
                      </View>
                    )}
                    {isExpanded && (
                      <View style={styles.taskMeta}>
                        <Text style={[styles.taskMetaText, { color: colors.mutedForeground }]}>
                          <Text style={{ fontFamily: "Inter_600SemiBold" }}>Agent:</Text> {task.agentName}
                        </Text>
                        {task.dependsOn.length > 0 && (
                          <Text style={[styles.taskMetaText, { color: colors.mutedForeground }]}>
                            <Text style={{ fontFamily: "Inter_600SemiBold" }}>Depends on:</Text> {task.dependsOn.join(", ")}
                          </Text>
                        )}
                        <Text style={[styles.taskMetaText, { color: colors.mutedForeground }]}>
                          <Text style={{ fontFamily: "Inter_600SemiBold" }}>Priority:</Text> {task.priority}/10
                        </Text>
                        {task.output && (
                          <Text style={[styles.taskOutput, { color: colors.success }]}>{task.output}</Text>
                        )}
                      </View>
                    )}
                  </View>
                  <View style={[styles.taskStatus, { backgroundColor: cfg.color + "22" }]}>
                    <Text style={[styles.taskStatusText, { color: cfg.color }]}>{task.status}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 12 },
  statsRow: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  statItem: { flex: 1, alignItems: "center", gap: 2 },
  statValue: { fontSize: 18, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 10, fontFamily: "Inter_400Regular" },
  statDivider: { width: 1, marginVertical: 4 },
  phaseRow: { marginHorizontal: -4 },
  phaseChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 6,
  },
  phaseChipText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  phaseBadge: { fontSize: 10, fontFamily: "Inter_400Regular" },
  phaseGroup: { gap: 6 },
  phaseHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  phaseNumBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  phaseNumText: { fontSize: 11, fontFamily: "Inter_700Bold", color: "#fff" },
  phaseGroupLabel: { flex: 1, fontSize: 13, fontFamily: "Inter_600SemiBold" },
  runningChip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  runningDot: { width: 5, height: 5, borderRadius: 3 },
  runningText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  phaseProgress: { fontSize: 11, fontFamily: "Inter_400Regular" },
  taskRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 9,
    marginLeft: 15,
  },
  taskInfo: { flex: 1, gap: 4 },
  taskLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  taskProgressBg: { height: 3, borderRadius: 2, overflow: "hidden" },
  taskProgressFill: { height: 3, borderRadius: 2 },
  taskMeta: { gap: 3, paddingTop: 3 },
  taskMetaText: { fontSize: 11, fontFamily: "Inter_400Regular" },
  taskOutput: { fontSize: 11, fontFamily: "Inter_500Medium" },
  taskStatus: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5 },
  taskStatusText: { fontSize: 9, fontFamily: "Inter_600SemiBold", textTransform: "capitalize" },
});
