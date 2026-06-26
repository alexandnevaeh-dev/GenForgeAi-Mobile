import { Feather } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

interface MemoryEntry {
  id: string;
  agent: string;
  key: string;
  value: string;
  phase: number;
  createdAt: string;
  updatedAt: string;
}

const PHASE_LABEL: Record<number, string> = {
  1: "Foundation",
  2: "World & Story",
  3: "Characters",
  4: "Image Gen",
  5: "QA & Balance",
  6: "Packaging",
};

const AGENT_COLOR: Record<string, string> = {
  "Foundation Agent":   "#2B7FFF",
  "World Architect":    "#7B2FFF",
  "Character Designer": "#F97316",
  "Image Generator":    "#00D4FF",
  "Balance Agent":      "#22C55E",
  "Packaging Agent":    "#EF4444",
};

interface Props {
  projectId: string;
}

export function ProjectMemoryPanel({ projectId }: Props) {
  const colors = useColors();
  const { accessToken } = useAuth();
  const [memories, setMemories] = useState<MemoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [clearing, setClearing] = useState<string | null>(null);

  const fetchMemories = useCallback(async () => {
    if (!accessToken) return;
    try {
      const res = await fetch(`/api/projects/${projectId}/memory`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (res.ok) {
        const data = (await res.json()) as { memories: MemoryEntry[] };
        setMemories(data.memories);
      }
    } catch {
      // non-fatal
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [projectId, accessToken]);

  useEffect(() => { fetchMemories(); }, [fetchMemories]);

  const deleteEntry = async (id: string) => {
    if (!accessToken) return;
    setClearing(id);
    try {
      await fetch(`/api/projects/${projectId}/memory/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      setMemories((prev) => prev.filter((m) => m.id !== id));
    } catch {
      Alert.alert("Error", "Could not delete memory entry");
    } finally {
      setClearing(null);
    }
  };

  const clearAll = () => {
    Alert.alert(
      "Clear All Memory",
      "This will remove all agent memories for this project. The next generation will start fresh. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            if (!accessToken) return;
            try {
              await fetch(`/api/projects/${projectId}/memory`, {
                method: "DELETE",
                headers: { Authorization: `Bearer ${accessToken}` },
              });
              setMemories([]);
            } catch {
              Alert.alert("Error", "Could not clear memories");
            }
          },
        },
      ]
    );
  };

  const clearAgent = (agent: string) => {
    Alert.alert(
      `Clear ${agent} Memory`,
      `Remove all memories stored by ${agent}?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            if (!accessToken) return;
            try {
              await fetch(
                `/api/projects/${projectId}/memory?agent=${encodeURIComponent(agent)}`,
                { method: "DELETE", headers: { Authorization: `Bearer ${accessToken}` } }
              );
              setMemories((prev) => prev.filter((m) => m.agent !== agent));
            } catch {
              Alert.alert("Error", "Could not clear agent memory");
            }
          },
        },
      ]
    );
  };

  // Group by agent
  const byAgent: Record<string, MemoryEntry[]> = {};
  for (const m of memories) {
    (byAgent[m.agent] ??= []).push(m);
  }
  const agents = Object.keys(byAgent).sort();

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (memories.length === 0) {
    return (
      <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name="database" size={28} color={colors.mutedForeground} />
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No agent memories yet</Text>
        <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>
          Run a full generation to populate memories. Agents will remember world names, character decisions, tone, and balance choices for future runs.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* Header row */}
      <View style={styles.headerRow}>
        <View style={styles.headerMeta}>
          <Feather name="database" size={14} color={colors.primary} />
          <Text style={[styles.headerCount, { color: colors.foreground }]}>
            {memories.length} {memories.length === 1 ? "entry" : "entries"} · {agents.length} {agents.length === 1 ? "agent" : "agents"}
          </Text>
        </View>
        <Pressable onPress={clearAll} style={styles.clearAllBtn}>
          <Feather name="trash-2" size={13} color="#EF4444" />
          <Text style={styles.clearAllText}>Clear all</Text>
        </Pressable>
      </View>

      {/* Agent groups */}
      {agents.map((agent) => {
        const agentColor = AGENT_COLOR[agent] ?? colors.primary;
        const entries = byAgent[agent]!;
        return (
          <View key={agent} style={[styles.agentCard, { backgroundColor: colors.card, borderColor: agentColor + "44" }]}>
            {/* Agent header */}
            <View style={styles.agentHeader}>
              <View style={[styles.agentBadge, { backgroundColor: agentColor + "22" }]}>
                <View style={[styles.agentDot, { backgroundColor: agentColor }]} />
                <Text style={[styles.agentName, { color: agentColor }]}>{agent}</Text>
              </View>
              <Text style={[styles.entryCount, { color: colors.mutedForeground }]}>
                {entries.length} {entries.length === 1 ? "entry" : "entries"}
              </Text>
              <Pressable onPress={() => clearAgent(agent)} style={styles.agentClearBtn}>
                <Feather name="x" size={13} color={colors.mutedForeground} />
              </Pressable>
            </View>

            {/* Memory entries */}
            {entries.map((entry) => {
              const phaseLabel = PHASE_LABEL[entry.phase];
              return (
                <View key={entry.id} style={[styles.entryRow, { borderTopColor: colors.border }]}>
                  <View style={styles.entryBody}>
                    <View style={styles.entryKeyRow}>
                      <Text style={[styles.entryKey, { color: agentColor }]}>{entry.key}</Text>
                      {phaseLabel && (
                        <View style={[styles.phasePill, { backgroundColor: colors.muted }]}>
                          <Text style={[styles.phaseText, { color: colors.mutedForeground }]}>
                            {phaseLabel}
                          </Text>
                        </View>
                      )}
                    </View>
                    <Text style={[styles.entryValue, { color: colors.foreground }]}>{entry.value}</Text>
                  </View>
                  <Pressable
                    onPress={() => deleteEntry(entry.id)}
                    disabled={clearing === entry.id}
                    style={styles.deleteBtn}
                  >
                    {clearing === entry.id ? (
                      <ActivityIndicator size="small" color={colors.mutedForeground} />
                    ) : (
                      <Feather name="x" size={14} color={colors.mutedForeground} />
                    )}
                  </Pressable>
                </View>
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
  center: { alignItems: "center", paddingVertical: 40 },
  emptyCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 28,
    alignItems: "center",
    gap: 10,
  },
  emptyTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  emptyBody: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 19 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerMeta: { flexDirection: "row", alignItems: "center", gap: 6 },
  headerCount: { fontSize: 13, fontFamily: "Inter_500Medium" },
  clearAllBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  clearAllText: { fontSize: 12, fontFamily: "Inter_500Medium", color: "#EF4444" },
  agentCard: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  agentHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 12,
  },
  agentBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flex: 1,
  },
  agentDot: { width: 6, height: 6, borderRadius: 3 },
  agentName: { fontSize: 12, fontFamily: "Inter_700Bold", flex: 1 },
  entryCount: { fontSize: 11, fontFamily: "Inter_400Regular" },
  agentClearBtn: { padding: 4 },
  entryRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderTopWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  entryBody: { flex: 1, gap: 4 },
  entryKeyRow: { flexDirection: "row", alignItems: "center", gap: 6, flexWrap: "wrap" },
  entryKey: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  phasePill: {
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  phaseText: { fontSize: 9, fontFamily: "Inter_400Regular" },
  entryValue: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  deleteBtn: { padding: 4, marginTop: 2 },
});
