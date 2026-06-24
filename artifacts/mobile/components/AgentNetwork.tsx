import { Feather } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { Animated, ScrollView, StyleSheet, Text, View } from "react-native";

import { AGENT_DEFS, PHASE_LABELS } from "@/constants/agents";
import { useColors } from "@/hooks/useColors";

export type AgentStatus = "idle" | "active" | "done" | "queued";

export interface AgentState {
  agentId: string;
  status: AgentStatus;
  progress?: number;
  output?: string;
}

interface Props {
  agentStates: AgentState[];
  compact?: boolean;
}

function AgentChip({
  agent,
  state,
}: {
  agent: (typeof AGENT_DEFS)[number];
  state: AgentState | undefined;
}) {
  const colors = useColors();
  const pulse = useRef(new Animated.Value(0.5)).current;
  const status = state?.status ?? "idle";

  useEffect(() => {
    if (status === "active") {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 0.5, duration: 600, useNativeDriver: true }),
        ])
      );
      anim.start();
      return () => anim.stop();
    } else {
      pulse.setValue(status === "done" ? 1 : 0.3);
    }
  }, [status, pulse]);

  const bgColor =
    status === "active"
      ? colors.primary + "33"
      : status === "done"
      ? colors.success + "22"
      : status === "queued"
      ? colors.secondary + "22"
      : colors.muted;

  const borderColor =
    status === "active"
      ? colors.primary
      : status === "done"
      ? colors.success
      : status === "queued"
      ? colors.secondary
      : colors.border;

  const iconColor =
    status === "active"
      ? colors.primary
      : status === "done"
      ? colors.success
      : status === "queued"
      ? colors.secondary
      : colors.mutedForeground;

  return (
    <Animated.View
      style={[
        styles.chip,
        { backgroundColor: bgColor, borderColor, opacity: status === "idle" ? 0.4 : pulse },
      ]}
    >
      <Feather name={agent.icon as any} size={12} color={iconColor} />
      <Text style={[styles.chipName, { color: status === "idle" ? colors.mutedForeground : colors.foreground }]}>
        {agent.name}
      </Text>
      {status === "done" && (
        <Feather name="check" size={10} color={colors.success} />
      )}
    </Animated.View>
  );
}

function PhaseRow({
  phase,
  agents,
  agentStates,
}: {
  phase: number;
  agents: typeof AGENT_DEFS;
  agentStates: AgentState[];
}) {
  const colors = useColors();
  const phaseAgents = agents.filter((a) => a.phase === phase);
  const states = phaseAgents.map((a) => agentStates.find((s) => s.agentId === a.id));
  const anyActive = states.some((s) => s?.status === "active");
  const allDone = states.every((s) => s?.status === "done");

  const phaseColor = allDone ? colors.success : anyActive ? colors.primary : colors.mutedForeground;

  return (
    <View style={styles.phaseBlock}>
      <View style={styles.phaseHeader}>
        <View style={[styles.phaseNum, { backgroundColor: phaseColor + "22", borderColor: phaseColor }]}>
          <Text style={[styles.phaseNumText, { color: phaseColor }]}>{phase}</Text>
        </View>
        <Text style={[styles.phaseLabel, { color: phaseColor }]}>{PHASE_LABELS[phase]}</Text>
        {anyActive && (
          <View style={[styles.parallelBadge, { backgroundColor: colors.primary + "22", borderColor: colors.primary }]}>
            <Text style={[styles.parallelText, { color: colors.primary }]}>PARALLEL</Text>
          </View>
        )}
        {allDone && (
          <Feather name="check-circle" size={14} color={colors.success} />
        )}
      </View>
      <View style={styles.chipsRow}>
        {phaseAgents.map((agent) => (
          <AgentChip
            key={agent.id}
            agent={agent}
            state={agentStates.find((s) => s.agentId === agent.id)}
          />
        ))}
      </View>
    </View>
  );
}

export function AgentNetwork({ agentStates, compact }: Props) {
  const colors = useColors();
  const phases = [1, 2, 3, 4, 5, 6];

  const totalAgents = AGENT_DEFS.length;
  const doneAgents = agentStates.filter((s) => s.status === "done").length;
  const activeAgents = agentStates.filter((s) => s.status === "active").length;

  const Wrapper = compact ? ScrollView : View;

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, { color: colors.foreground }]}>AI Agent Network</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
            {doneAgents}/{totalAgents} agents complete
            {activeAgents > 0 ? ` · ${activeAgents} running in parallel` : ""}
          </Text>
        </View>
        <View style={[styles.genlogicBadge, { backgroundColor: colors.secondary + "22", borderColor: colors.secondary }]}>
          <Feather name="cpu" size={11} color={colors.secondary} />
          <Text style={[styles.genlogicText, { color: colors.secondary }]}>GenLogic</Text>
        </View>
      </View>

      {/* Director status */}
      <View style={[styles.directorRow, { backgroundColor: colors.primary + "11", borderColor: colors.primary + "44" }]}>
        <Feather name="star" size={14} color={colors.primary} />
        <Text style={[styles.directorText, { color: colors.foreground }]}>Master Game Director</Text>
        <View style={[styles.onlineDot, { backgroundColor: colors.success }]} />
        <Text style={[styles.onlineText, { color: colors.success }]}>Coordinating</Text>
      </View>

      {phases.map((phase) => (
        <PhaseRow
          key={phase}
          phase={phase}
          agents={AGENT_DEFS}
          agentStates={agentStates}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  title: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  subtitle: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  genlogicBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  genlogicText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
  directorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  directorText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  onlineText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  phaseBlock: {
    gap: 8,
  },
  phaseHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  phaseNum: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  phaseNumText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
  },
  phaseLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  parallelBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
  },
  parallelText: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginLeft: 27,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  chipName: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
});
