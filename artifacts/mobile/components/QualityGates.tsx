import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { QUALITY_GATES, type QualityGateId } from "@/constants/generation-pipeline";
import { useColors } from "@/hooks/useColors";

type GateResult = "pending" | "pass" | "fail" | "warning";

interface GateStatus {
  id: QualityGateId;
  result: GateResult;
  score?: number;
}

interface Props {
  gateStatuses?: GateStatus[];
}

const DEFAULT_STATUSES: GateStatus[] = QUALITY_GATES.map((g, i) => ({
  id: g.id,
  result: i < 6 ? "pass" : i === 6 ? "warning" : "pending",
  score: i < 6 ? 88 + Math.floor(Math.random() * 10) : i === 6 ? 74 : undefined,
}));

const RESULT_CONFIG: Record<GateResult, { color: string; icon: string; label: string }> = {
  pending: { color: "#6B6B80", icon: "clock", label: "Pending" },
  pass: { color: "#22C55E", icon: "check-circle", label: "Passed" },
  fail: { color: "#EF4444", icon: "x-circle", label: "Failed" },
  warning: { color: "#F97316", icon: "alert-triangle", label: "Warning" },
};

export function QualityGates({ gateStatuses = DEFAULT_STATUSES }: Props) {
  const colors = useColors();
  const [expanded, setExpanded] = useState<QualityGateId | null>(null);

  const passed = gateStatuses.filter((g) => g.result === "pass").length;
  const total = QUALITY_GATES.length;
  const overallPct = Math.round((passed / total) * 100);

  return (
    <View style={styles.root}>
      {/* Overall score */}
      <View style={[styles.scoreCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.scoreLeft}>
          <Text style={[styles.scoreTitle, { color: colors.foreground }]}>Quality Score</Text>
          <Text style={[styles.scoreSub, { color: colors.mutedForeground }]}>
            {passed}/{total} gates passed
          </Text>
        </View>
        <View style={[styles.scoreCircle, { borderColor: overallPct >= 80 ? colors.success : overallPct >= 60 ? colors.warning : colors.destructive }]}>
          <Text style={[styles.scoreValue, { color: overallPct >= 80 ? colors.success : overallPct >= 60 ? colors.warning : colors.destructive }]}>
            {overallPct}%
          </Text>
        </View>
      </View>

      {/* Summary bar */}
      <View style={styles.summaryRow}>
        {(["pass", "warning", "fail", "pending"] as GateResult[]).map((result) => {
          const count = gateStatuses.filter((g) => g.result === result).length;
          if (!count) return null;
          const cfg = RESULT_CONFIG[result];
          return (
            <View key={result} style={[styles.summaryChip, { backgroundColor: cfg.color + "22" }]}>
              <Feather name={cfg.icon as any} size={11} color={cfg.color} />
              <Text style={[styles.summaryCount, { color: cfg.color }]}>{count} {cfg.label}</Text>
            </View>
          );
        })}
      </View>

      {/* Gate list */}
      {QUALITY_GATES.map((gate) => {
        const status = gateStatuses.find((s) => s.id === gate.id) ?? { id: gate.id, result: "pending" as const };
        const cfg = RESULT_CONFIG[status.result];
        const isExpanded = expanded === gate.id;

        return (
          <Pressable
            key={gate.id}
            onPress={() => setExpanded(isExpanded ? null : gate.id)}
            style={[styles.gateCard, { backgroundColor: colors.card, borderColor: isExpanded ? cfg.color : colors.border }]}
          >
            <View style={styles.gateHeader}>
              <View style={[styles.gateIcon, { backgroundColor: cfg.color + "22" }]}>
                <Feather name={gate.icon as any} size={16} color={cfg.color} />
              </View>
              <View style={styles.gateInfo}>
                <Text style={[styles.gateLabel, { color: colors.foreground }]}>{gate.label}</Text>
                {status.score !== undefined && (
                  <View style={styles.scoreBar}>
                    <View style={[styles.scoreBarBg, { backgroundColor: colors.border }]}>
                      <View style={[styles.scoreBarFill, { width: `${status.score}%` as any, backgroundColor: cfg.color }]} />
                    </View>
                    <Text style={[styles.scoreBarLabel, { color: cfg.color }]}>{status.score}%</Text>
                  </View>
                )}
              </View>
              <View style={[styles.resultChip, { backgroundColor: cfg.color + "22" }]}>
                <Feather name={cfg.icon as any} size={12} color={cfg.color} />
                <Text style={[styles.resultText, { color: cfg.color }]}>{cfg.label}</Text>
              </View>
            </View>

            {isExpanded && (
              <View style={styles.gateDetails}>
                <Text style={[styles.gateDesc, { color: colors.mutedForeground }]}>{gate.description}</Text>
                <View style={styles.checksList}>
                  {gate.checks.map((check, i) => (
                    <View key={i} style={styles.checkRow}>
                      <Feather
                        name={status.result === "pass" ? "check" : status.result === "warning" && i > 1 ? "alert-triangle" : "check"}
                        size={12}
                        color={status.result === "pass" ? colors.success : status.result === "warning" && i > 1 ? colors.warning : colors.success}
                      />
                      <Text style={[styles.checkText, { color: colors.mutedForeground }]}>{check}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 10 },
  scoreCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
  },
  scoreLeft: { gap: 2 },
  scoreTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  scoreSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  scoreCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2.5,
    alignItems: "center",
    justifyContent: "center",
  },
  scoreValue: { fontSize: 15, fontFamily: "Inter_700Bold" },
  summaryRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  summaryChip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 7 },
  summaryCount: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  gateCard: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 10 },
  gateHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  gateIcon: { width: 34, height: 34, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  gateInfo: { flex: 1, gap: 5 },
  gateLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  scoreBar: { flexDirection: "row", alignItems: "center", gap: 6 },
  scoreBarBg: { flex: 1, height: 4, borderRadius: 2, overflow: "hidden" },
  scoreBarFill: { height: 4, borderRadius: 2 },
  scoreBarLabel: { fontSize: 10, fontFamily: "Inter_700Bold", width: 28 },
  resultChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  resultText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  gateDetails: { gap: 8, paddingTop: 4 },
  gateDesc: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  checksList: { gap: 6 },
  checkRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  checkText: { fontSize: 12, fontFamily: "Inter_400Regular" },
});
