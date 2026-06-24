import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AgentNetwork } from "@/components/AgentNetwork";
import { GenLogicPanel } from "@/components/GenLogicPanel";
import { AIProgressIndicator } from "@/components/AIProgressIndicator";
import { useProjects } from "@/context/ProjectsContext";
import { useColors } from "@/hooks/useColors";

type Tab = "overview" | "agents" | "memory";

export default function ProjectDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { projects, deleteProject } = useProjects();
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const project = projects.find((p) => p.id === id);
  const topPad = Platform.OS === "web" ? 67 : insets.top + 12;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 16;

  if (!project) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, paddingTop: topPad }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <View style={styles.notFound}>
          <Feather name="alert-circle" size={40} color={colors.mutedForeground} />
          <Text style={[styles.notFoundText, { color: colors.mutedForeground }]}>Project not found</Text>
        </View>
      </View>
    );
  }

  const handleDelete = () => {
    Alert.alert("Delete Project", `Delete "${project.title}"? This cannot be undone.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          deleteProject(project.id);
          router.back();
        },
      },
    ]);
  };

  const statusColor =
    project.status === "complete" || project.status === "exported"
      ? colors.success
      : project.status === "generating" || project.status === "in_progress"
      ? colors.primary
      : colors.mutedForeground;

  const TABS: { key: Tab; label: string; icon: string }[] = [
    { key: "overview", label: "Overview", icon: "home" },
    { key: "agents", label: "AI Agents", icon: "cpu" },
    { key: "memory", label: "Memory", icon: "database" },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>
          {project.title}
        </Text>
        <Pressable onPress={handleDelete} style={styles.deleteBtn}>
          <Feather name="trash-2" size={18} color={colors.destructive} />
        </Pressable>
      </View>

      {/* Tabs */}
      <View style={[styles.tabBar, { borderBottomColor: colors.border, backgroundColor: colors.background }]}>
        {TABS.map((tab) => (
          <Pressable
            key={tab.key}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setActiveTab(tab.key);
            }}
            style={[
              styles.tab,
              activeTab === tab.key && [styles.tabActive, { borderBottomColor: colors.primary }],
            ]}
          >
            <Feather
              name={tab.icon as any}
              size={14}
              color={activeTab === tab.key ? colors.primary : colors.mutedForeground}
            />
            <Text
              style={[
                styles.tabLabel,
                { color: activeTab === tab.key ? colors.primary : colors.mutedForeground },
              ]}
            >
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: bottomPad }}
        showsVerticalScrollIndicator={false}
      >
        {/* ─── OVERVIEW TAB ─── */}
        {activeTab === "overview" && (
          <View style={styles.tabContent}>
            {/* Status Banner */}
            <View style={[styles.statusBanner, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.statusRow}>
                <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                <Text style={[styles.statusText, { color: statusColor }]}>
                  {project.status.replace("_", " ").toUpperCase()}
                </Text>
              </View>
              {project.status !== "planning" && (
                <>
                  <View style={[styles.progressBg, { backgroundColor: colors.muted }]}>
                    <View
                      style={[styles.progressFill, { backgroundColor: statusColor, width: `${project.progress}%` as any }]}
                    />
                  </View>
                  <Text style={[styles.progressPct, { color: statusColor }]}>{project.progress}%</Text>
                </>
              )}
            </View>

            {/* Details */}
            <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>DESCRIPTION</Text>
              <Text style={[styles.sectionBody, { color: colors.foreground }]}>{project.description}</Text>
              <View style={styles.detailGrid}>
                <View style={styles.detailItem}>
                  <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>Genre</Text>
                  <Text style={[styles.detailValue, { color: colors.foreground }]}>{project.genre}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Text style={[styles.detailLabel, { color: colors.mutedForeground }]}>Art Style</Text>
                  <Text style={[styles.detailValue, { color: colors.foreground }]}>{project.artStyle}</Text>
                </View>
              </View>
              <View style={styles.tagsRow}>
                {project.tags.map((tag) => (
                  <View key={tag} style={[styles.tag, { backgroundColor: colors.muted }]}>
                    <Text style={[styles.tagText, { color: colors.mutedForeground }]}>{tag}</Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Generation Pipeline */}
            <Text style={[styles.sectionTitle, { color: colors.mutedForeground }]}>GENERATION PIPELINE</Text>
            <AIProgressIndicator steps={project.steps} />

            {/* Quick Actions */}
            <View style={styles.actionsGrid}>
              {[
                { icon: "message-square", label: "Continue in Chat", primary: true },
                { icon: "refresh-cw", label: "Regenerate", primary: false },
                { icon: "download", label: "Export", primary: false },
                { icon: "share-2", label: "Share", primary: false },
              ].map((action) => (
                <Pressable
                  key={action.label}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    if (action.label === "Continue in Chat") router.push("/(tabs)/chat");
                  }}
                  style={[
                    styles.actionBtn,
                    {
                      backgroundColor: action.primary ? colors.primary : colors.card,
                      borderColor: action.primary ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Feather name={action.icon as any} size={18} color={action.primary ? "#fff" : colors.foreground} />
                  <Text style={[styles.actionLabel, { color: action.primary ? "#fff" : colors.foreground }]}>
                    {action.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* ─── AGENTS TAB ─── */}
        {activeTab === "agents" && (
          <View style={styles.tabContent}>
            <AgentNetwork agentStates={project.agentStates ?? []} />
          </View>
        )}

        {/* ─── MEMORY TAB ─── */}
        {activeTab === "memory" && (
          <View style={styles.tabContent}>
            <GenLogicPanel
              genre={project.genre}
              artStyle={project.artStyle}
              prompt={project.prompt}
            />

            {/* Agent Communication Log */}
            <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>AGENT COMMUNICATION LOG</Text>
              {[
                { agent: "World Architect", msg: "Overworld map generated. 6 biomes defined.", time: "3h ago" },
                { agent: "Story Architect", msg: "Main narrative arc finalized. 3 endings written.", time: "3h ago" },
                { agent: "Enemy Designer", msg: "47 enemy variants created with behavior trees.", time: "2h ago" },
                { agent: "QA Agent", msg: "No critical balance issues detected. 2 minor flags.", time: "1h ago" },
                { agent: "Master Game Director", msg: "Phase 5 complete. Initiating asset generation.", time: "45m ago" },
              ].map((log, i) => (
                <View key={i} style={[styles.logRow, { borderTopColor: colors.border }]}>
                  <View style={[styles.logDot, { backgroundColor: colors.primary }]} />
                  <View style={styles.logBody}>
                    <Text style={[styles.logAgent, { color: colors.primary }]}>{log.agent}</Text>
                    <Text style={[styles.logMsg, { color: colors.foreground }]}>{log.msg}</Text>
                    <Text style={[styles.logTime, { color: colors.mutedForeground }]}>{log.time}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: { padding: 4 },
  deleteBtn: { padding: 4 },
  headerTitle: { flex: 1, fontSize: 16, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabActive: {},
  tabLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  tabContent: { gap: 16 },
  statusBanner: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 12, fontFamily: "Inter_700Bold", letterSpacing: 0.8 },
  progressBg: { height: 5, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: 5, borderRadius: 3 },
  progressPct: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  section: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  sectionLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 1.2 },
  sectionTitle: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 1.2, marginBottom: -8 },
  sectionBody: { fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 22 },
  detailGrid: { flexDirection: "row", gap: 20 },
  detailItem: { gap: 2 },
  detailLabel: { fontSize: 11, fontFamily: "Inter_500Medium" },
  detailValue: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  tagText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  actionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 4 },
  actionBtn: {
    width: "47%",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  actionLabel: { fontSize: 13, fontFamily: "Inter_500Medium", flex: 1 },
  logRow: {
    flexDirection: "row",
    gap: 10,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  logDot: { width: 6, height: 6, borderRadius: 3, marginTop: 5, flexShrink: 0 },
  logBody: { flex: 1, gap: 2 },
  logAgent: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  logMsg: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  logTime: { fontSize: 11, fontFamily: "Inter_400Regular" },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  notFoundText: { fontSize: 16, fontFamily: "Inter_400Regular" },
});
