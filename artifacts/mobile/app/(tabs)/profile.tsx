import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useProjects } from "@/context/ProjectsContext";
import { useColors } from "@/hooks/useColors";

interface SettingRowProps {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
}

function SettingRow({ icon, label, value, onPress, danger }: SettingRowProps) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={[styles.row, { borderBottomColor: colors.border }]}
    >
      <View style={[styles.rowIcon, { backgroundColor: danger ? colors.destructive + "22" : colors.muted }]}>
        <Feather name={icon} size={16} color={danger ? colors.destructive : colors.primary} />
      </View>
      <Text style={[styles.rowLabel, { color: danger ? colors.destructive : colors.foreground }]}>{label}</Text>
      <View style={styles.rowRight}>
        {value ? <Text style={[styles.rowValue, { color: colors.mutedForeground }]}>{value}</Text> : null}
        {!danger && <Feather name="chevron-right" size={16} color={colors.mutedForeground} />}
      </View>
    </Pressable>
  );
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { projects } = useProjects();

  const topPad = Platform.OS === "web" ? 67 : insets.top + 16;
  const bottomPad = Platform.OS === "web" ? 34 + 84 : insets.bottom + 84;

  const totalProjects = projects.length;
  const completedProjects = projects.filter(
    (p) => p.status === "complete" || p.status === "exported"
  ).length;

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: topPad, paddingBottom: bottomPad }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.inner}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>G</Text>
          </View>
          <Text style={[styles.name, { color: colors.foreground }]}>Game Developer</Text>
          <Text style={[styles.plan, { color: colors.accent }]}>PRO TIER</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsGrid}>
          {[
            { label: "Projects", value: totalProjects },
            { label: "Completed", value: completedProjects },
            { label: "AI Runs", value: 147 },
            { label: "Assets", value: 823 },
          ].map((s) => (
            <View key={s.label} style={[styles.statBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.statVal, { color: colors.foreground }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* AI Usage */}
        <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>AI Credits</Text>
            <Text style={[styles.sectionValue, { color: colors.primary }]}>850 / 1,000</Text>
          </View>
          <View style={[styles.usageBg, { backgroundColor: colors.muted }]}>
            <View style={[styles.usageFill, { backgroundColor: colors.primary, width: "85%" }]} />
          </View>
          <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>Resets in 8 days</Text>
        </View>

        {/* Settings Sections */}
        <Text style={[styles.groupLabel, { color: colors.mutedForeground }]}>ACCOUNT</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingRow icon="user" label="Profile" />
          <SettingRow icon="credit-card" label="Subscription" value="Pro" />
          <SettingRow icon="cloud" label="Cloud Storage" value="2.4 GB used" />
        </View>

        <Text style={[styles.groupLabel, { color: colors.mutedForeground }]}>AI SETTINGS</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingRow icon="cpu" label="AI Model" value="GPT-4o" />
          <SettingRow icon="sliders" label="Generation Quality" value="Ultra" />
          <SettingRow icon="globe" label="Export Engines" value="Godot, Unity" />
        </View>

        <Text style={[styles.groupLabel, { color: colors.mutedForeground }]}>APP</Text>
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingRow icon="moon" label="Dark Mode" value="On" />
          <SettingRow icon="bell" label="Notifications" value="On" />
          <SettingRow icon="shield" label="Privacy" />
          <SettingRow icon="help-circle" label="Help & Support" />
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <SettingRow icon="log-out" label="Sign Out" danger />
        </View>

        <Text style={[styles.version, { color: colors.mutedForeground }]}>GenForgeAI Mobile v1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  inner: { paddingHorizontal: 20, gap: 16 },
  profileHeader: {
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  name: {
    fontSize: 20,
    fontFamily: "Inter_600SemiBold",
  },
  plan: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
  },
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  statBox: {
    width: "47%",
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 2,
  },
  statVal: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  section: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  sectionValue: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  usageBg: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  usageFill: {
    height: 6,
    borderRadius: 3,
  },
  sectionSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  groupLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.2,
    marginBottom: -6,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomWidth: 1,
  },
  rowIcon: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  rowRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  rowValue: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  version: {
    textAlign: "center",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginBottom: 8,
  },
});
