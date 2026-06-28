import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

type AgentRole = string;
type AgentStatus = "pending" | "queued" | "running" | "complete" | "failed" | "skipped";

interface AgentResult {
  role: AgentRole;
  label: string;
  status: AgentStatus;
  confidence: number;
  riskLevel: "low" | "medium" | "high";
  reasoningDepth: number;
  estimatedAccuracy: number;
  validationStatus: "passed" | "warning" | "failed";
  outputSummary: string;
  tokensUsed: number;
  durationMs: number;
  model: string;
  taskType: string;
}

interface OrchestrationPlan {
  orchestrationId: string;
  projectId: string;
  overallConfidence: number;
  parallelGroups: AgentRole[][];
  agents: AgentResult[];
  telemetry: {
    totalTokens: number;
    totalDurationMs: number;
    estimatedCostUsd: number;
    parallelEfficiency: number;
    successRate: number;
  };
  warnings: string[];
  generatedAt: string;
}

interface Props {
  projectId: string;
}

const RISK_COLOR: Record<string, string> = {
  low: "#22C55E", medium: "#FBBF24", high: "#EF4444",
};

const VALIDATION_COLOR: Record<string, string> = {
  passed: "#22C55E", warning: "#FBBF24", failed: "#EF4444",
};

const TASK_COLOR: Record<string, string> = {
  foundation: "#2B7FFF",
  story:      "#7B2FFF",
  characters: "#00D4FF",
  assets:     "#F97316",
  balance:    "#FBBF24",
  coding:     "#22C55E",
  chat:       "#EC4899",
  packaging:  "#6B6B80",
};

const PHASE_LABELS: Record<number, string> = {
  1: "Phase 1 — Planning",
  2: "Phase 2 — Design",
  3: "Phase 3 — Generation",
  4: "Phase 4 — Assets",
  5: "Phase 5 — Systems",
  6: "Phase 6 — QA & Deploy",
};

const AGENT_PHASE: Record<string, number> = {
  project_manager: 1, research: 1,
  game_design: 2, narrative: 2, architecture: 2,
  code_generation: 3, ui_ux: 3, art_director: 3,
  pixel_art: 4, animation: 4, audio: 4, ai_behavior: 4, physics: 4, multiplayer: 4,
  economy: 5, procedural: 5,
  performance: 6, qa: 6, security: 6, deployment: 6,
};

function ConfidenceRing({ value, color }: { value: number; color: string }) {
  const grade = value >= 90 ? "A" : value >= 80 ? "B" : value >= 70 ? "C" : "D";
  return (
    <View style={[ringStyles.root, { borderColor: color }]}>
      <Text style={[ringStyles.value, { color }]}>{value}</Text>
      <Text style={[ringStyles.grade, { color }]}>{grade}</Text>
    </View>
  );
}

const ringStyles = StyleSheet.create({
  root:  { width: 48, height: 48, borderRadius: 24, borderWidth: 2.5, alignItems: "center", justifyContent: "center" },
  value: { fontSize: 13, fontFamily: "Inter_700Bold", lineHeight: 14 },
  grade: { fontSize: 9,  fontFamily: "Inter_600SemiBold" },
});

export function OrchestratorDashboard({ projectId }: Props) {
  const colors = useColors();
  const { accessToken } = useAuth();

  const [plan, setPlan] = useState<OrchestrationPlan | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);

  async function runOrchestration() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/orchestrate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error(await res.text());
      setPlan(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Orchestration failed");
    } finally {
      setLoading(false);
    }
  }

  const confColor = plan
    ? plan.overallConfidence >= 88 ? "#22C55E"
    : plan.overallConfidence >= 75 ? "#2B7FFF" : "#FBBF24"
    : colors.primary;

  // Group agents by phase for rendering
  const phaseGroups = plan
    ? Array.from({ length: 6 }, (_, i) => i + 1).map((phase) => ({
        phase,
        label: PHASE_LABELS[phase] ?? `Phase ${phase}`,
        agents: plan.agents.filter((a) => (AGENT_PHASE[a.role] ?? 6) === phase),
      })).filter((g) => g.agents.length > 0)
    : [];

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.headerCard, { backgroundColor: colors.card, borderColor: colors.primary }]}>
        <View style={styles.headerLeft}>
          <View style={styles.headerTitleRow}>
            <View style={[styles.headerDot, { backgroundColor: loading ? "#FBBF24" : plan ? "#22C55E" : colors.primary }]} />
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>Master Orchestrator</Text>
          </View>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            {plan
              ? `${plan.agents.length} agents · ${plan.telemetry.successRate}% success · ID: ${plan.orchestrationId.slice(-8)}`
              : "Coordinates 20 specialist AI agents across 6 parallel phases"}
          </Text>
        </View>
        {plan && (
          <ConfidenceRing value={plan.overallConfidence} color={confColor} />
        )}
      </View>

      {/* Pipeline diagram */}
      <View style={[styles.pipelineCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.pipelineTitle, { color: colors.mutedForeground }]}>AI PIPELINE</Text>
        <View style={styles.pipeline}>
          {["User Prompt", "Intent Analyzer", "20 Specialists", "Validation", "Playable Build"].map((step, i, arr) => (
            <React.Fragment key={step}>
              <View style={[styles.pipelineStep, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "44" }]}>
                <Text style={[styles.pipelineStepText, { color: colors.primary }]}>{step}</Text>
              </View>
              {i < arr.length - 1 && (
                <Feather name="arrow-down" size={12} color={colors.mutedForeground} />
              )}
            </React.Fragment>
          ))}
        </View>
      </View>

      {/* Run button */}
      <Pressable
        onPress={runOrchestration}
        disabled={loading}
        style={[styles.runBtn, { backgroundColor: loading ? colors.border : colors.primary }]}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Feather name="play" size={16} color="#fff" />
        )}
        <Text style={styles.runBtnText}>
          {loading ? "Orchestrating…" : plan ? "Re-run Orchestration" : "Run Full Orchestration"}
        </Text>
      </Pressable>

      {error && (
        <View style={[styles.errorBanner, { backgroundColor: colors.destructive + "18", borderColor: colors.destructive }]}>
          <Feather name="alert-circle" size={13} color={colors.destructive} />
          <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
        </View>
      )}

      {plan && (
        <>
          {/* Telemetry summary */}
          <View style={[styles.telemRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            {[
              { label: "Tokens",    value: plan.telemetry.totalTokens.toLocaleString(), color: "#2B7FFF" },
              { label: "Duration",  value: `${(plan.telemetry.totalDurationMs / 1000).toFixed(1)}s`, color: "#7B2FFF" },
              { label: "Cost",      value: `$${plan.telemetry.estimatedCostUsd}`, color: "#FBBF24" },
              { label: "Parallel",  value: `${plan.telemetry.parallelEfficiency}%`, color: "#22C55E" },
            ].map((m, i) => (
              <React.Fragment key={m.label}>
                <View style={styles.telemItem}>
                  <Text style={[styles.telemValue, { color: m.color }]}>{m.value}</Text>
                  <Text style={[styles.telemLabel, { color: colors.mutedForeground }]}>{m.label}</Text>
                </View>
                {i < 3 && <View style={[styles.telemDivider, { backgroundColor: colors.border }]} />}
              </React.Fragment>
            ))}
          </View>

          {/* Warnings */}
          {plan.warnings.length > 0 && (
            <View style={[styles.warningsCard, { backgroundColor: "#FBBF2410", borderColor: "#FBBF24" }]}>
              {plan.warnings.map((w, i) => (
                <View key={i} style={styles.warningRow}>
                  <Feather name="alert-triangle" size={12} color="#FBBF24" />
                  <Text style={[styles.warningText, { color: "#FBBF24" }]}>{w}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Agent phases */}
          {phaseGroups.map((group) => (
            <View key={group.phase} style={styles.phaseSection}>
              <View style={styles.phaseHeader}>
                <View style={[styles.phaseBadge, { backgroundColor: colors.primary + "20" }]}>
                  <Text style={[styles.phaseBadgeText, { color: colors.primary }]}>{group.label}</Text>
                </View>
                <Text style={[styles.phaseParallelNote, { color: colors.mutedForeground }]}>
                  {group.agents.length > 1 ? `${group.agents.length} parallel` : "sequential"}
                </Text>
              </View>

              {group.agents.map((agent) => {
                const isExp = expandedAgent === agent.role;
                const riskCol = RISK_COLOR[agent.riskLevel] ?? colors.mutedForeground;
                const valCol  = VALIDATION_COLOR[agent.validationStatus] ?? colors.mutedForeground;
                const taskCol = TASK_COLOR[agent.taskType] ?? colors.primary;
                const confCol = agent.confidence >= 88 ? "#22C55E" : agent.confidence >= 75 ? "#2B7FFF" : "#FBBF24";

                return (
                  <Pressable
                    key={agent.role}
                    onPress={() => setExpandedAgent(isExp ? null : agent.role)}
                    style={[styles.agentCard, {
                      backgroundColor: colors.card,
                      borderColor: isExp ? confCol : colors.border,
                    }]}
                  >
                    <View style={styles.agentRow}>
                      {/* Confidence ring */}
                      <ConfidenceRing value={agent.confidence} color={confCol} />

                      {/* Agent info */}
                      <View style={styles.agentInfo}>
                        <Text style={[styles.agentLabel, { color: colors.foreground }]}>{agent.label}</Text>
                        <View style={styles.agentMeta}>
                          <View style={[styles.taskChip, { backgroundColor: taskCol + "20" }]}>
                            <Text style={[styles.taskChipText, { color: taskCol }]}>{agent.taskType}</Text>
                          </View>
                          <View style={[styles.riskChip, { backgroundColor: riskCol + "20" }]}>
                            <Text style={[styles.riskChipText, { color: riskCol }]}>{agent.riskLevel} risk</Text>
                          </View>
                        </View>
                      </View>

                      {/* Validation badge */}
                      <View style={[styles.valBadge, { backgroundColor: valCol + "20" }]}>
                        <Feather
                          name={agent.validationStatus === "passed" ? "check-circle" : agent.validationStatus === "warning" ? "alert-triangle" : "x-circle"}
                          size={14}
                          color={valCol}
                        />
                      </View>
                      <Feather name={isExp ? "chevron-up" : "chevron-down"} size={14} color={colors.mutedForeground} />
                    </View>

                    {isExp && (
                      <View style={styles.agentExpanded}>
                        {/* Output summary */}
                        <Text style={[styles.outputSummary, { color: colors.mutedForeground }]}>{agent.outputSummary}</Text>

                        {/* Metrics row */}
                        <View style={styles.metricsRow}>
                          {[
                            { label: "Accuracy",  value: `${agent.estimatedAccuracy}%`, col: "#22C55E" },
                            { label: "Reasoning", value: `${agent.reasoningDepth}/10`,  col: "#2B7FFF" },
                            { label: "Tokens",    value: agent.tokensUsed.toLocaleString(), col: "#7B2FFF" },
                            { label: "Time",      value: `${(agent.durationMs / 1000).toFixed(1)}s`, col: "#FBBF24" },
                          ].map((m) => (
                            <View key={m.label} style={styles.metricItem}>
                              <Text style={[styles.metricValue, { color: m.col }]}>{m.value}</Text>
                              <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>{m.label}</Text>
                            </View>
                          ))}
                        </View>

                        {/* Model */}
                        <View style={[styles.modelRow, { backgroundColor: colors.border + "40" }]}>
                          <Feather name="cpu" size={11} color={colors.mutedForeground} />
                          <Text style={[styles.modelText, { color: colors.mutedForeground }]} numberOfLines={1}>
                            {agent.model}
                          </Text>
                        </View>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          ))}
        </>
      )}

      {!plan && !loading && (
        <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="cpu" size={32} color={colors.primary} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No Orchestration Yet</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            Run the Master Orchestrator to see the full AI pipeline — 20 specialists, confidence scores, model assignments, and telemetry across 6 parallel phases.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root:             { gap: 12 },
  headerCard:       { borderRadius: 14, borderWidth: 1.5, padding: 16, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerLeft:       { flex: 1, gap: 5 },
  headerTitleRow:   { flexDirection: "row", alignItems: "center", gap: 8 },
  headerDot:        { width: 8, height: 8, borderRadius: 4 },
  headerTitle:      { fontSize: 16, fontFamily: "Inter_700Bold" },
  headerSub:        { fontSize: 12, fontFamily: "Inter_400Regular" },
  pipelineCard:     { borderRadius: 12, borderWidth: 1, padding: 14, gap: 10 },
  pipelineTitle:    { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1 },
  pipeline:         { alignItems: "center", gap: 6 },
  pipelineStep:     { borderRadius: 8, borderWidth: 1, paddingHorizontal: 16, paddingVertical: 7 },
  pipelineStepText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  runBtn:           { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 12 },
  runBtnText:       { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
  errorBanner:      { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 10, borderWidth: 1 },
  errorText:        { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  telemRow:         { flexDirection: "row", alignItems: "center", borderRadius: 14, borderWidth: 1, padding: 16 },
  telemItem:        { flex: 1, alignItems: "center", gap: 3 },
  telemValue:       { fontSize: 16, fontFamily: "Inter_700Bold" },
  telemLabel:       { fontSize: 10, fontFamily: "Inter_500Medium" },
  telemDivider:     { width: 1, height: 30, marginHorizontal: 4 },
  warningsCard:     { borderRadius: 10, borderWidth: 1, padding: 12, gap: 8 },
  warningRow:       { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  warningText:      { fontSize: 12, fontFamily: "Inter_500Medium", flex: 1, lineHeight: 18 },
  phaseSection:     { gap: 8 },
  phaseHeader:      { flexDirection: "row", alignItems: "center", gap: 10 },
  phaseBadge:       { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
  phaseBadgeText:   { fontSize: 12, fontFamily: "Inter_700Bold" },
  phaseParallelNote:{ fontSize: 11, fontFamily: "Inter_400Regular" },
  agentCard:        { borderRadius: 12, borderWidth: 1, padding: 14, gap: 10 },
  agentRow:         { flexDirection: "row", alignItems: "center", gap: 10 },
  agentInfo:        { flex: 1, gap: 5 },
  agentLabel:       { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  agentMeta:        { flexDirection: "row", gap: 6 },
  taskChip:         { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5 },
  taskChipText:     { fontSize: 10, fontFamily: "Inter_700Bold" },
  riskChip:         { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5 },
  riskChipText:     { fontSize: 10, fontFamily: "Inter_700Bold" },
  valBadge:         { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  agentExpanded:    { gap: 10, paddingTop: 4 },
  outputSummary:    { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  metricsRow:       { flexDirection: "row", gap: 4 },
  metricItem:       { flex: 1, alignItems: "center", gap: 3 },
  metricValue:      { fontSize: 13, fontFamily: "Inter_700Bold" },
  metricLabel:      { fontSize: 10, fontFamily: "Inter_400Regular" },
  modelRow:         { flexDirection: "row", alignItems: "center", gap: 6, padding: 8, borderRadius: 6 },
  modelText:        { fontSize: 11, fontFamily: "Inter_400Regular", flex: 1 },
  emptyCard:        { alignItems: "center", gap: 10, padding: 28, borderRadius: 14, borderWidth: 1 },
  emptyTitle:       { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  emptyText:        { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
});
