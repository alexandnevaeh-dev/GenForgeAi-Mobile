import { Feather } from "@expo/vector-icons";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

// ─── Types ────────────────────────────────────────────────────────────────────

type CheckStatus = "pass" | "warn" | "fail";

interface ValidationCheck {
  id:     string;
  label:  string;
  status: CheckStatus;
  detail: string;
}

interface ValidationResult {
  checks:    ValidationCheck[];
  passed:    number;
  warned:    number;
  failed:    number;
  total:     number;
  canExport: boolean;
}

interface Props {
  projectId: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<CheckStatus, string> = {
  pass: "#22C55E",
  warn: "#F97316",
  fail: "#EF4444",
};

const STATUS_ICON: Record<CheckStatus, string> = {
  pass: "check-circle",
  warn: "alert-triangle",
  fail: "x-circle",
};

function grade(passed: number, total: number): { letter: string; color: string } {
  const pct = total > 0 ? passed / total : 0;
  if (pct >= 0.9) return { letter: "A", color: "#22C55E" };
  if (pct >= 0.7) return { letter: "B", color: "#2B7FFF" };
  if (pct >= 0.5) return { letter: "C", color: "#F97316" };
  return { letter: "D", color: "#EF4444" };
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ExportValidationPanel({ projectId }: Props) {
  const colors = useColors();
  const { accessToken } = useAuth();

  const [result, setResult]     = useState<ValidationResult | null>(null);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [expanded, setExpanded] = useState(false);

  const spinAnim = useRef(new Animated.Value(0)).current;

  const runValidation = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);

    Animated.loop(
      Animated.timing(spinAnim, { toValue: 1, duration: 900, useNativeDriver: true })
    ).start();

    try {
      const res = await fetch(`/api/projects/${projectId}/export/validate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const data = await res.json() as ValidationResult & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Validation failed");
      setResult(data);
      setExpanded(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Validation failed");
    } finally {
      spinAnim.stopAnimation();
      spinAnim.setValue(0);
      setLoading(false);
    }
  }, [accessToken, projectId]);

  useEffect(() => {
    runValidation();
  }, [runValidation]);

  const spin = spinAnim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  // ── Loading state ──────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.primary }]}>
        <View style={styles.row}>
          <Animated.View style={{ transform: [{ rotate: spin }] }}>
            <Feather name="loader" size={16} color={colors.primary} />
          </Animated.View>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Running pre-export validation…</Text>
        </View>
        <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
          Checking project completeness, assets, and engine compatibility
        </Text>
        <ActivityIndicator color={colors.primary} style={{ marginTop: 8 }} />
      </View>
    );
  }

  // ── Error state ────────────────────────────────────────────────────────────

  if (error) {
    return (
      <View style={[styles.card, { backgroundColor: colors.card, borderColor: "#EF444440" }]}>
        <View style={styles.row}>
          <Feather name="alert-circle" size={14} color="#EF4444" />
          <Text style={[styles.cardTitle, { color: "#EF4444" }]}>Validation unavailable</Text>
        </View>
        <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>{error}</Text>
        <Pressable onPress={runValidation} style={styles.retryBtn}>
          <Feather name="refresh-cw" size={12} color={colors.primary} />
          <Text style={[styles.retryBtnText, { color: colors.primary }]}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  // ── Result state ───────────────────────────────────────────────────────────

  if (!result) return null;

  const { letter, color: gradeColor } = grade(result.passed, result.total);
  const overallStatus: CheckStatus = result.failed > 0 ? "fail" : result.warned > 0 ? "warn" : "pass";
  const overallColor = STATUS_COLOR[overallStatus];

  return (
    <View style={[styles.card, { backgroundColor: colors.card, borderColor: overallColor + "50" }]}>
      {/* Header row */}
      <Pressable onPress={() => setExpanded((p) => !p)} style={styles.headerRow}>
        <View style={[styles.gradeBox, { backgroundColor: gradeColor + "20", borderColor: gradeColor }]}>
          <Text style={[styles.gradeLetter, { color: gradeColor }]}>{letter}</Text>
        </View>

        <View style={styles.headerInfo}>
          <Text style={[styles.cardTitle, { color: colors.foreground }]}>Pre-Export Validation</Text>
          <Text style={[styles.cardSub, { color: colors.mutedForeground }]}>
            {result.passed}/{result.total} checks passed
            {result.warned > 0 ? ` · ${result.warned} warning${result.warned !== 1 ? "s" : ""}` : ""}
            {result.failed > 0 ? ` · ${result.failed} failed` : ""}
          </Text>
        </View>

        <View style={styles.headerRight}>
          <View style={[styles.statusPill, { backgroundColor: overallColor + "20" }]}>
            <Feather name={STATUS_ICON[overallStatus] as any} size={11} color={overallColor} />
            <Text style={[styles.statusPillText, { color: overallColor }]}>
              {result.canExport ? "Export Ready" : "Not Ready"}
            </Text>
          </View>
          <Feather name={expanded ? "chevron-up" : "chevron-down"} size={14} color={colors.mutedForeground} style={{ marginTop: 4 }} />
        </View>
      </Pressable>

      {/* Summary pills */}
      <View style={styles.summaryRow}>
        {[
          { label: "Pass",  value: result.passed,  color: STATUS_COLOR.pass },
          { label: "Warn",  value: result.warned,  color: STATUS_COLOR.warn },
          { label: "Fail",  value: result.failed,  color: STATUS_COLOR.fail },
        ].map((s) => (
          <View key={s.label} style={[styles.summaryPill, { backgroundColor: s.color + "15" }]}>
            <Text style={[styles.summaryNum, { color: s.color }]}>{s.value}</Text>
            <Text style={[styles.summaryLabel, { color: s.color }]}>{s.label}</Text>
          </View>
        ))}

        <Pressable onPress={runValidation} style={[styles.rerunBtn, { borderColor: colors.border }]}>
          <Feather name="refresh-cw" size={11} color={colors.mutedForeground} />
          <Text style={[styles.rerunText, { color: colors.mutedForeground }]}>Re-run</Text>
        </Pressable>
      </View>

      {/* Checks list */}
      {expanded && (
        <View style={styles.checksList}>
          {result.checks.map((check) => {
            const c = STATUS_COLOR[check.status];
            return (
              <View key={check.id} style={[styles.checkRow, { borderTopColor: colors.border }]}>
                <Feather name={STATUS_ICON[check.status] as any} size={13} color={c} />
                <View style={styles.checkInfo}>
                  <Text style={[styles.checkLabel, { color: colors.foreground }]}>{check.label}</Text>
                  <Text style={[styles.checkDetail, { color: colors.mutedForeground }]}>{check.detail}</Text>
                </View>
                <View style={[styles.checkBadge, { backgroundColor: c + "18" }]}>
                  <Text style={[styles.checkBadgeText, { color: c }]}>
                    {check.status.toUpperCase()}
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Bottom guidance */}
      {!result.canExport && (
        <View style={[styles.guidanceBox, { backgroundColor: "#EF444412", borderColor: "#EF444440" }]}>
          <Feather name="info" size={12} color="#EF4444" />
          <Text style={[styles.guidanceText, { color: colors.mutedForeground }]}>
            Resolve all{" "}
            <Text style={{ color: "#EF4444" }}>failed checks</Text> to unlock export.
            {result.failed === 0 ? " Generate more of the project to reach 50% progress." : ""}
          </Text>
        </View>
      )}
      {result.canExport && (
        <View style={[styles.guidanceBox, { backgroundColor: "#22C55E12", borderColor: "#22C55E40" }]}>
          <Feather name="check-circle" size={12} color="#22C55E" />
          <Text style={[styles.guidanceText, { color: colors.mutedForeground }]}>
            All checks passed — choose an engine below and download your project.
          </Text>
        </View>
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 10,
  },
  headerRow:   { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  gradeBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  gradeLetter: { fontSize: 20, fontWeight: "800" },
  headerInfo:  { flex: 1, gap: 2 },
  headerRight: { alignItems: "flex-end", gap: 4 },
  cardTitle:   { fontSize: 14, fontWeight: "700", letterSpacing: -0.2 },
  cardSub:     { fontSize: 11, lineHeight: 15 },

  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusPillText: { fontSize: 10, fontWeight: "700" },

  summaryRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  summaryPill: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 6,
    borderRadius: 8,
    gap: 1,
  },
  summaryNum:   { fontSize: 16, fontWeight: "800" },
  summaryLabel: { fontSize: 9, fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 },

  rerunBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  rerunText: { fontSize: 11, fontWeight: "600" },

  checksList: { gap: 0 },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  checkInfo:   { flex: 1 },
  checkLabel:  { fontSize: 12, fontWeight: "600" },
  checkDetail: { fontSize: 11, marginTop: 1 },
  checkBadge:  { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  checkBadgeText: { fontSize: 9, fontWeight: "700", letterSpacing: 0.5 },

  guidanceBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  guidanceText: { flex: 1, fontSize: 11, lineHeight: 16 },

  row: { flexDirection: "row", alignItems: "center", gap: 8 },

  retryBtn: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 },
  retryBtnText: { fontSize: 12, fontWeight: "600" },
});
