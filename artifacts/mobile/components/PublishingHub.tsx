import { Feather } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

type Platform = "google-play" | "app-store" | "steam" | "itch-io" | "epic" | "direct";

interface Check {
  id: string;
  label: string;
  pass: boolean;
  detail: string;
}

interface ValidationResult {
  checks: Check[];
  passed: number;
  failed: number;
  canPublish: boolean;
  score: number;
  total: number;
}

interface Props {
  projectId: string;
  onSelectPlatform: (platform: Platform) => void;
}

const PLATFORMS: { id: Platform; label: string; icon: string; color: string; stores: string }[] = [
  { id: "google-play", label: "Google Play",  icon: "smartphone", color: "#34A853", stores: "Android" },
  { id: "app-store",   label: "App Store",    icon: "smartphone", color: "#0A84FF", stores: "iOS" },
  { id: "steam",       label: "Steam",        icon: "monitor",    color: "#1B2838", stores: "PC / Mac" },
  { id: "itch-io",     label: "itch.io",      icon: "globe",      color: "#FA5C5C", stores: "Web / Desktop" },
  { id: "epic",        label: "Epic Games",   icon: "monitor",    color: "#2D2D2D", stores: "PC / Console" },
  { id: "direct",      label: "Direct APK",   icon: "download",   color: "#7B2FFF", stores: "Sideload" },
];

export function PublishingHub({ projectId, onSelectPlatform }: Props) {
  const colors = useColors();
  const { accessToken } = useAuth();

  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [validating, setValidating] = useState(false);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    runValidation();
  }, [projectId]);

  async function runValidation() {
    setValidating(true);
    try {
      const res = await fetch(`/api/projects/${projectId}/publish/validate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) setValidation(await res.json());
    } finally {
      setValidating(false);
    }
  }

  const readyColor  = validation?.canPublish ? "#22C55E" : validation ? "#FBBF24" : colors.mutedForeground;
  const readyLabel  = validation?.canPublish ? "Publish Ready" : validation ? `${validation.failed} issue${validation.failed !== 1 ? "s" : ""} to resolve` : "Checking…";

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.headerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Publishing Hub</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            One-click publishing to 6 storefronts
          </Text>
        </View>
        <View style={[styles.readinessBadge, { backgroundColor: readyColor + "20", borderColor: readyColor }]}>
          {validating
            ? <ActivityIndicator size="small" color={readyColor} />
            : <Feather name={validation?.canPublish ? "check-circle" : "alert-circle"} size={14} color={readyColor} />
          }
          <Text style={[styles.readinessText, { color: readyColor }]}>{readyLabel}</Text>
        </View>
      </View>

      {/* Validation panel */}
      {validation && (
        <Pressable
          onPress={() => setExpanded(!expanded)}
          style={[styles.validCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <View style={styles.validHeader}>
            <View style={styles.validScoreRow}>
              <Text style={[styles.validScore, { color: readyColor }]}>{validation.score}%</Text>
              <Text style={[styles.validLabel, { color: colors.mutedForeground }]}>
                {validation.passed}/{validation.total} checks passed
              </Text>
            </View>
            <Feather name={expanded ? "chevron-up" : "chevron-down"} size={16} color={colors.mutedForeground} />
          </View>
          {expanded && (
            <View style={styles.checkList}>
              {validation.checks.map((c) => (
                <View key={c.id} style={styles.checkRow}>
                  <Feather
                    name={c.pass ? "check-circle" : "x-circle"}
                    size={13}
                    color={c.pass ? "#22C55E" : "#EF4444"}
                  />
                  <View style={styles.checkText}>
                    <Text style={[styles.checkLabel, { color: colors.foreground }]}>{c.label}</Text>
                    <Text style={[styles.checkDetail, { color: colors.mutedForeground }]} numberOfLines={1}>{c.detail}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </Pressable>
      )}

      {/* Platform grid */}
      <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>CHOOSE STOREFRONT</Text>
      <View style={styles.platformGrid}>
        {PLATFORMS.map((p) => (
          <Pressable
            key={p.id}
            onPress={() => onSelectPlatform(p.id)}
            style={[styles.platformCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={[styles.platformIcon, { backgroundColor: p.color + "22" }]}>
              <Feather name={p.icon as any} size={22} color={p.color} />
            </View>
            <Text style={[styles.platformLabel, { color: colors.foreground }]}>{p.label}</Text>
            <Text style={[styles.platformStores, { color: colors.mutedForeground }]}>{p.stores}</Text>
            <View style={[styles.generateBtn, { borderColor: p.color }]}>
              <Text style={[styles.generateBtnText, { color: p.color }]}>Generate Listing</Text>
            </View>
          </Pressable>
        ))}
      </View>

      {/* Re-validate button */}
      <Pressable
        onPress={runValidation}
        disabled={validating}
        style={[styles.revalidateBtn, { borderColor: colors.border }]}
      >
        {validating
          ? <ActivityIndicator size="small" color={colors.mutedForeground} />
          : <Feather name="refresh-cw" size={14} color={colors.mutedForeground} />
        }
        <Text style={[styles.revalidateText, { color: colors.mutedForeground }]}>Re-run validation</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root:             { gap: 12 },
  headerCard:       { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: 14, borderWidth: 1, padding: 16 },
  headerLeft:       { gap: 3 },
  headerTitle:      { fontSize: 16, fontFamily: "Inter_700Bold" },
  headerSub:        { fontSize: 12, fontFamily: "Inter_400Regular" },
  readinessBadge:   { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  readinessText:    { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  validCard:        { borderRadius: 12, borderWidth: 1, padding: 14, gap: 10 },
  validHeader:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  validScoreRow:    { flexDirection: "row", alignItems: "baseline", gap: 8 },
  validScore:       { fontSize: 22, fontFamily: "Inter_700Bold" },
  validLabel:       { fontSize: 13, fontFamily: "Inter_400Regular" },
  checkList:        { gap: 8, paddingTop: 4 },
  checkRow:         { flexDirection: "row", alignItems: "flex-start", gap: 10 },
  checkText:        { flex: 1, gap: 1 },
  checkLabel:       { fontSize: 13, fontFamily: "Inter_500Medium" },
  checkDetail:      { fontSize: 11, fontFamily: "Inter_400Regular" },
  sectionLabel:     { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1 },
  platformGrid:     { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  platformCard:     { width: "47%", borderRadius: 14, borderWidth: 1, padding: 14, gap: 8, alignItems: "center" },
  platformIcon:     { width: 48, height: 48, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  platformLabel:    { fontSize: 13, fontFamily: "Inter_700Bold", textAlign: "center" },
  platformStores:   { fontSize: 11, fontFamily: "Inter_400Regular" },
  generateBtn:      { borderWidth: 1, borderRadius: 6, paddingHorizontal: 12, paddingVertical: 5 },
  generateBtnText:  { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  revalidateBtn:    { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12, borderRadius: 10, borderWidth: 1 },
  revalidateText:   { fontSize: 13, fontFamily: "Inter_500Medium" },
});
