import { Feather } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

interface ModelChainData {
  taskType: string;
  description: string;
  primaryModel: string;
  fallbackChain: string[];
  agentCount: number;
}

interface ModelRouterData {
  chains: ModelChainData[];
  totalModels: number;
  lastUpdated: string;
}

const TASK_META: Record<string, { label: string; icon: string; color: string }> = {
  foundation: { label: "Foundation",  icon: "layers",       color: "#2B7FFF" },
  story:      { label: "Story",       icon: "book-open",    color: "#7B2FFF" },
  characters: { label: "Characters",  icon: "users",        color: "#00D4FF" },
  assets:     { label: "Assets",      icon: "image",        color: "#F97316" },
  balance:    { label: "Balance",     icon: "activity",     color: "#FBBF24" },
  coding:     { label: "Coding",      icon: "code",         color: "#22C55E" },
  chat:       { label: "Chat",        icon: "message-circle",color: "#EC4899" },
  packaging:  { label: "Packaging",   icon: "package",      color: "#6B6B80" },
};

function shortenModel(model: string): string {
  if (model === "openrouter/free") return "Auto (Free)";
  const parts = model.split("/");
  const last = parts[parts.length - 1] ?? model;
  return last.replace(/:free$/, "").replace(/-instruct$/, "").replace(/-a\d+b$/, "").replace(/-\d+b$/, "");
}

interface Props {
  projectId?: string;
}

export function ModelRouterPanel({ projectId }: Props) {
  const colors = useColors();
  const { accessToken } = useAuth();

  const [data, setData] = useState<ModelRouterData | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      const res = await fetch("/api/orchestrate/models", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) setData(await res.json());
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <View style={[styles.loadingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <ActivityIndicator color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Loading model router…</Text>
      </View>
    );
  }

  if (!data) return null;

  return (
    <View style={styles.root}>
      <View style={[styles.headerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name="git-branch" size={20} color={colors.secondary} />
        <View style={styles.headerText}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Model Router</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            8 task types · Automatic model selection + fallback chains
          </Text>
        </View>
        <Pressable onPress={load}>
          <Feather name="refresh-cw" size={15} color={colors.mutedForeground} />
        </Pressable>
      </View>

      {/* Summary row */}
      <View style={[styles.summaryRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: colors.primary }]}>{data.chains.length}</Text>
          <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Task Types</Text>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: "#22C55E" }]}>
            {data.chains.reduce((s, c) => s + c.fallbackChain.length, 0)}
          </Text>
          <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Total Models</Text>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: "#7B2FFF" }]}>
            {data.chains.reduce((s, c) => s + c.agentCount, 0)}
          </Text>
          <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Agent Slots</Text>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: "#00D4FF" }]}>Free</Text>
          <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>Cost Tier</Text>
        </View>
      </View>

      {/* Chains */}
      {data.chains.map((chain) => {
        const meta = TASK_META[chain.taskType] ?? { label: chain.taskType, icon: "cpu", color: colors.primary };
        const isExp = expanded === chain.taskType;
        return (
          <Pressable
            key={chain.taskType}
            onPress={() => setExpanded(isExp ? null : chain.taskType)}
            style={[styles.chainCard, { backgroundColor: colors.card, borderColor: isExp ? meta.color : colors.border }]}
          >
            <View style={styles.chainHeader}>
              <View style={[styles.chainIcon, { backgroundColor: meta.color + "20" }]}>
                <Feather name={meta.icon as any} size={16} color={meta.color} />
              </View>
              <View style={styles.chainInfo}>
                <Text style={[styles.chainLabel, { color: colors.foreground }]}>{meta.label}</Text>
                <Text style={[styles.chainPrimary, { color: meta.color }]} numberOfLines={1}>
                  ▶ {shortenModel(chain.primaryModel)}
                </Text>
              </View>
              <View style={styles.chainRight}>
                <View style={[styles.agentCountChip, { backgroundColor: meta.color + "20" }]}>
                  <Text style={[styles.agentCountText, { color: meta.color }]}>
                    {chain.agentCount} agent{chain.agentCount !== 1 ? "s" : ""}
                  </Text>
                </View>
                <Feather name={isExp ? "chevron-up" : "chevron-down"} size={14} color={colors.mutedForeground} />
              </View>
            </View>

            {isExp && (
              <View style={styles.chainExpanded}>
                <Text style={[styles.chainDesc, { color: colors.mutedForeground }]}>{chain.description}</Text>

                <Text style={[styles.fallbackTitle, { color: colors.foreground }]}>Fallback Chain</Text>
                {chain.fallbackChain.map((model, i) => (
                  <View key={i} style={styles.fallbackRow}>
                    <View style={[
                      styles.fallbackIndex,
                      { backgroundColor: i === 0 ? meta.color + "20" : colors.border + "80" }
                    ]}>
                      <Text style={[styles.fallbackIndexText, { color: i === 0 ? meta.color : colors.mutedForeground }]}>
                        {i === 0 ? "▶" : `${i + 1}`}
                      </Text>
                    </View>
                    <View style={styles.fallbackModelInfo}>
                      <Text style={[
                        styles.fallbackModelName,
                        { color: i === 0 ? colors.foreground : colors.mutedForeground }
                      ]} numberOfLines={1}>
                        {shortenModel(model)}
                      </Text>
                      {i === 0 && (
                        <View style={[styles.primaryBadge, { backgroundColor: meta.color + "20" }]}>
                          <Text style={[styles.primaryBadgeText, { color: meta.color }]}>Primary</Text>
                        </View>
                      )}
                      {model === "openrouter/free" && (
                        <View style={[styles.primaryBadge, { backgroundColor: "#6B6B8040" }]}>
                          <Text style={[styles.primaryBadgeText, { color: "#6B6B80" }]}>Last Resort</Text>
                        </View>
                      )}
                    </View>
                    {i < chain.fallbackChain.length - 1 && (
                      <Feather name="arrow-down" size={10} color={colors.border} />
                    )}
                  </View>
                ))}
              </View>
            )}
          </Pressable>
        );
      })}

      <Text style={[styles.footerNote, { color: colors.mutedForeground }]}>
        All models are free-tier via OpenRouter. The router tries each model in order; if the primary fails, it falls back automatically. Users can define custom priority lists by task type.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root:               { gap: 12 },
  loadingCard:        { alignItems: "center", gap: 10, padding: 24, borderRadius: 14, borderWidth: 1 },
  loadingText:        { fontSize: 13, fontFamily: "Inter_400Regular" },
  headerCard:         { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, borderWidth: 1, padding: 14 },
  headerText:         { flex: 1, gap: 2 },
  headerTitle:        { fontSize: 15, fontFamily: "Inter_700Bold" },
  headerSub:          { fontSize: 12, fontFamily: "Inter_400Regular" },
  summaryRow:         { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, padding: 14 },
  summaryItem:        { flex: 1, alignItems: "center", gap: 3 },
  summaryValue:       { fontSize: 18, fontFamily: "Inter_700Bold" },
  summaryLabel:       { fontSize: 10, fontFamily: "Inter_500Medium" },
  summaryDivider:     { width: 1, height: 28, marginHorizontal: 4 },
  chainCard:          { borderRadius: 12, borderWidth: 1, padding: 14, gap: 10 },
  chainHeader:        { flexDirection: "row", alignItems: "center", gap: 10 },
  chainIcon:          { width: 36, height: 36, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  chainInfo:          { flex: 1, gap: 3 },
  chainLabel:         { fontSize: 14, fontFamily: "Inter_700Bold" },
  chainPrimary:       { fontSize: 12, fontFamily: "Inter_500Medium" },
  chainRight:         { alignItems: "flex-end", gap: 5 },
  agentCountChip:     { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  agentCountText:     { fontSize: 10, fontFamily: "Inter_700Bold" },
  chainExpanded:      { gap: 10, paddingTop: 4 },
  chainDesc:          { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  fallbackTitle:      { fontSize: 12, fontFamily: "Inter_700Bold" },
  fallbackRow:        { flexDirection: "row", alignItems: "center", gap: 8 },
  fallbackIndex:      { width: 24, height: 24, borderRadius: 6, alignItems: "center", justifyContent: "center" },
  fallbackIndexText:  { fontSize: 11, fontFamily: "Inter_700Bold" },
  fallbackModelInfo:  { flex: 1, flexDirection: "row", alignItems: "center", gap: 6 },
  fallbackModelName:  { fontSize: 12, fontFamily: "Inter_400Regular", flex: 1 },
  primaryBadge:       { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  primaryBadgeText:   { fontSize: 9, fontFamily: "Inter_700Bold" },
  footerNote:         { fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 17, textAlign: "center", paddingHorizontal: 8 },
});
