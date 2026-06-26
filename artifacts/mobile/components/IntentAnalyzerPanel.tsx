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

export interface IntentAnalysis {
  genre: string;
  subGenre: string;
  visualStyle: string;
  camera: string;
  networking: string;
  platform: string;
  gameLength: string;
  targetAudience: string;
  difficulty: string;
  engine: string;
  monetization: string;
  accessibility: string;
  coreTheme: string;
  uniqueMechanic: string;
  estimatedScope: string;
  toneKeywords: string[];
}

interface Props {
  projectId: string;
  prompt: string;
  genre: string;
  artStyle: string;
  existingAnalysis?: IntentAnalysis | null;
  onAnalysisComplete?: (analysis: IntentAnalysis) => void;
}

const FIELD_ICONS: Record<keyof IntentAnalysis, string> = {
  genre: "tag",
  subGenre: "layers",
  visualStyle: "eye",
  camera: "video",
  networking: "wifi",
  platform: "monitor",
  gameLength: "clock",
  targetAudience: "users",
  difficulty: "zap",
  engine: "tool",
  monetization: "dollar-sign",
  accessibility: "heart",
  coreTheme: "star",
  uniqueMechanic: "cpu",
  estimatedScope: "bar-chart-2",
  toneKeywords: "music",
};

const FIELD_LABELS: Record<keyof IntentAnalysis, string> = {
  genre: "Genre",
  subGenre: "Sub-Genre",
  visualStyle: "Visual Style",
  camera: "Camera",
  networking: "Multiplayer",
  platform: "Platform",
  gameLength: "Length",
  targetAudience: "Audience",
  difficulty: "Difficulty",
  engine: "Export Target",
  monetization: "Monetization",
  accessibility: "Accessibility",
  coreTheme: "Core Theme",
  uniqueMechanic: "Unique Mechanic",
  estimatedScope: "Scope",
  toneKeywords: "Tone",
};

const FIELD_COLORS: Partial<Record<keyof IntentAnalysis, string>> = {
  genre: "#2B7FFF",
  subGenre: "#7B2FFF",
  visualStyle: "#00D4FF",
  camera: "#F97316",
  networking: "#22C55E",
  coreTheme: "#EF4444",
  uniqueMechanic: "#A855F7",
};

const GRID_FIELDS: (keyof IntentAnalysis)[] = [
  "genre", "subGenre", "visualStyle", "camera",
  "networking", "platform", "gameLength", "targetAudience",
  "difficulty", "engine", "monetization", "accessibility",
  "estimatedScope",
];

const FULL_FIELDS: (keyof IntentAnalysis)[] = ["coreTheme", "uniqueMechanic"];

function ScanLine() {
  const y = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(y, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(y, { toValue: 0, duration: 0, useNativeDriver: false }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [y]);
  return (
    <Animated.View
      style={[
        styles.scanLine,
        { opacity: y.interpolate({ inputRange: [0, 0.1, 0.9, 1], outputRange: [0, 0.6, 0.6, 0] }) },
      ]}
    />
  );
}

export function IntentAnalyzerPanel({ projectId, prompt, genre, artStyle, existingAnalysis, onAnalysisComplete }: Props) {
  const colors = useColors();
  const { accessToken } = useAuth();
  const [analysis, setAnalysis] = useState<IntentAnalysis | null>(existingAnalysis ?? null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const analyze = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!res.ok) {
        const d = (await res.json()) as { error?: string };
        setError(d.error ?? "Analysis failed");
        return;
      }
      const data = (await res.json()) as { analysis: IntentAnalysis };
      setAnalysis(data.analysis);
      onAnalysisComplete?.(data.analysis);
    } catch {
      setError("Could not reach server");
    } finally {
      setLoading(false);
    }
  }, [accessToken, projectId, onAnalysisComplete]);

  useEffect(() => {
    if (!analysis && !loading) void analyze();
  }, []);

  const accentColor = colors.accent;
  const toneList = Array.isArray(analysis?.toneKeywords) ? analysis.toneKeywords.join(" · ") : "";

  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.iconWrap, { backgroundColor: accentColor + "22" }]}>
          <Feather name="cpu" size={16} color={accentColor} />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: colors.foreground }]}>Intent Analyzer</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>AI-extracted game parameters</Text>
        </View>
        {!loading && (
          <Pressable onPress={analyze} style={[styles.rerunBtn, { borderColor: colors.border }]}>
            <Feather name="refresh-cw" size={13} color={colors.mutedForeground} />
          </Pressable>
        )}
      </View>

      {/* Loading state */}
      {loading && (
        <View style={[styles.loadingBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
          <View style={styles.loadingInner}>
            <ActivityIndicator color={accentColor} />
            <View>
              <Text style={[styles.loadingTitle, { color: colors.foreground }]}>Analyzing intent…</Text>
              <Text style={[styles.loadingBody, { color: colors.mutedForeground }]}>
                Extracting genre, scope, mechanics, tone, and platform targets
              </Text>
            </View>
          </View>
          <ScanLine />
        </View>
      )}

      {/* Error */}
      {error && !loading && (
        <View style={[styles.errorBox, { backgroundColor: "#EF444415", borderColor: "#EF444433" }]}>
          <Feather name="alert-circle" size={13} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <Pressable onPress={analyze} style={styles.retryBtn}>
            <Text style={[styles.retryText, { color: accentColor }]}>Retry</Text>
          </Pressable>
        </View>
      )}

      {/* Results */}
      {analysis && !loading && (
        <>
          {/* Core theme + unique mechanic — full width */}
          {FULL_FIELDS.map((key) => {
            const val = analysis[key];
            if (!val || val === "N/A" || val === "") return null;
            const c = FIELD_COLORS[key] ?? colors.primary;
            return (
              <View key={key} style={[styles.fullRow, { backgroundColor: c + "11", borderColor: c + "33" }]}>
                <Feather name={FIELD_ICONS[key] as any} size={13} color={c} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.chipLabel, { color: c }]}>{FIELD_LABELS[key]}</Text>
                  <Text style={[styles.fullRowValue, { color: colors.foreground }]}>{String(val)}</Text>
                </View>
              </View>
            );
          })}

          {/* Tone keywords */}
          {toneList !== "" && (
            <View style={[styles.toneRow, { backgroundColor: colors.muted }]}>
              <Feather name="music" size={12} color={colors.secondary} />
              <Text style={[styles.chipLabel, { color: colors.secondary }]}>Tone</Text>
              <Text style={[styles.toneValue, { color: colors.foreground }]}>{toneList}</Text>
            </View>
          )}

          {/* Grid chips */}
          <View style={styles.grid}>
            {GRID_FIELDS.map((key) => {
              const val = analysis[key];
              if (!val || val === "N/A" || val === "") return null;
              const c = FIELD_COLORS[key] ?? colors.primary;
              return (
                <View key={key} style={[styles.chip, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                  <Feather name={FIELD_ICONS[key] as any} size={11} color={c} />
                  <View>
                    <Text style={[styles.chipLabel, { color: colors.mutedForeground }]}>{FIELD_LABELS[key]}</Text>
                    <Text style={[styles.chipValue, { color: colors.foreground }]}>{String(val)}</Text>
                  </View>
                </View>
              );
            })}
          </View>

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: colors.border }]}>
            <Feather name="check-circle" size={11} color={colors.success} />
            <Text style={[styles.footerText, { color: colors.mutedForeground }]}>
              Parameters locked · Generation pipeline configured
            </Text>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: { flex: 1 },
  title: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  subtitle: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  rerunBtn: {
    padding: 7,
    borderRadius: 8,
    borderWidth: 1,
  },
  loadingBox: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    overflow: "hidden",
  },
  loadingInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  loadingTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  loadingBody: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
    lineHeight: 16,
  },
  scanLine: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 1.5,
    backgroundColor: "#00D4FF",
  },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
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
  },
  retryBtn: { padding: 4 },
  retryText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  fullRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
  },
  fullRowValue: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    marginTop: 2,
    lineHeight: 18,
  },
  toneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  toneValue: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    flex: 1,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 9,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 7,
    minWidth: "44%",
    flex: 1,
  },
  chipLabel: {
    fontSize: 9,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  chipValue: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    marginTop: 1,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  footerText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
});
