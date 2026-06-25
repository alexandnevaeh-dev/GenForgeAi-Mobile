import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useProjects } from "@/context/ProjectsContext";
import { useColors } from "@/hooks/useColors";

type ProfileTab = "account" | "subscription" | "security";

const TIER_CONFIG = {
  free: { label: "Free", color: "#6B6B80", icon: "user", projects: 3, credits: 100 },
  pro: { label: "Pro", color: "#2B7FFF", icon: "zap", projects: -1, credits: 1000 },
  studio: { label: "Studio", color: "#7B2FFF", icon: "layers", projects: -1, credits: 10000 },
  enterprise: { label: "Enterprise", color: "#F97316", icon: "globe", projects: -1, credits: -1 },
  guest: { label: "Guest", color: "#6B6B80", icon: "user", projects: 1, credits: 10 },
};

const CONNECTED_PROVIDERS = [
  { id: "google", label: "Google", icon: "globe" },
  { id: "github", label: "GitHub", icon: "github" },
  { id: "apple", label: "Apple", icon: "smartphone" },
  { id: "discord", label: "Discord", icon: "message-circle" },
  { id: "microsoft", label: "Microsoft", icon: "monitor" },
];

function SettingRow({
  icon,
  label,
  value,
  onPress,
  danger,
  toggle,
  toggled,
  onToggle,
  badge,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
  toggle?: boolean;
  toggled?: boolean;
  onToggle?: (v: boolean) => void;
  badge?: string;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={toggle ? undefined : onPress}
      style={[styles.row, { borderBottomColor: colors.border }]}
    >
      <View style={[styles.rowIcon, { backgroundColor: danger ? colors.destructive + "22" : colors.muted }]}>
        <Feather name={icon} size={16} color={danger ? colors.destructive : colors.primary} />
      </View>
      <Text style={[styles.rowLabel, { color: danger ? colors.destructive : colors.foreground }]}>{label}</Text>
      <View style={styles.rowRight}>
        {badge && (
          <View style={[styles.rowBadge, { backgroundColor: colors.success + "22" }]}>
            <Text style={[styles.rowBadgeText, { color: colors.success }]}>{badge}</Text>
          </View>
        )}
        {value ? <Text style={[styles.rowValue, { color: colors.mutedForeground }]}>{value}</Text> : null}
        {toggle ? (
          <Switch
            value={toggled}
            onValueChange={onToggle}
            trackColor={{ false: colors.border, true: colors.primary }}
            thumbColor="#fff"
          />
        ) : !danger ? (
          <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
        ) : null}
      </View>
    </Pressable>
  );
}

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout, isAuthenticated } = useAuth();
  const { projects } = useProjects();

  const [activeTab, setActiveTab] = useState<ProfileTab>("account");
  const [notifPush, setNotifPush] = useState(true);
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifBuild, setNotifBuild] = useState(true);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  const topPad = Platform.OS === "web" ? 67 : insets.top + 16;
  const bottomPad = Platform.OS === "web" ? 34 + 84 : insets.bottom + 84;

  const isGuest = user?.role === "guest";
  const tier = user?.subscriptionTier ?? "free";
  const tierConfig = TIER_CONFIG[tier as keyof typeof TIER_CONFIG] ?? TIER_CONFIG.free;

  const totalProjects = projects.length;
  const completedProjects = projects.filter(
    (p) => p.status === "complete" || p.status === "exported"
  ).length;

  const creditsUsed = user?.aiCreditsUsed ?? 0;
  const creditsLimit = user?.aiCreditsLimit ?? tierConfig.credits;
  const creditsPct = creditsLimit > 0 ? Math.min(100, (creditsUsed / creditsLimit) * 100) : 100;

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: () => logout() },
    ]);
  };

  const PROFILE_TABS: { label: string; value: ProfileTab; icon: string }[] = [
    { label: "Account", value: "account", icon: "user" },
    { label: "Subscription", value: "subscription", icon: "credit-card" },
    { label: "Security", value: "security", icon: "shield" },
  ];

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: topPad, paddingBottom: bottomPad }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.inner}>
        {/* Profile Header */}
        <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Avatar */}
          <Pressable style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>{user?.displayName?.[0]?.toUpperCase() ?? "G"}</Text>
            <View style={[styles.avatarEdit, { backgroundColor: colors.background }]}>
              <Feather name="camera" size={10} color={colors.primary} />
            </View>
          </Pressable>

          <Text style={[styles.name, { color: colors.foreground }]}>
            {user?.displayName ?? "Game Developer"}
          </Text>
          <Text style={[styles.handle, { color: colors.mutedForeground }]}>
            @{user?.username ?? "guest"} · {user?.email ?? "guest mode"}
          </Text>

          {/* Tier Badge */}
          <View style={[styles.tierBadge, { backgroundColor: tierConfig.color + "22", borderColor: tierConfig.color }]}>
            <Feather name={tierConfig.icon as any} size={12} color={tierConfig.color} />
            <Text style={[styles.tierBadgeText, { color: tierConfig.color }]}>
              {tierConfig.label.toUpperCase()} TIER
            </Text>
          </View>

          {/* Guest upgrade CTA */}
          {isGuest && (
            <Pressable
              onPress={() => router.push("/auth/register")}
              style={[styles.upgradeBtn, { backgroundColor: colors.primary }]}
            >
              <Feather name="user-plus" size={14} color="#fff" />
              <Text style={styles.upgradeBtnText}>Create Free Account</Text>
            </Pressable>
          )}
        </View>

        {/* Stats */}
        <View style={styles.statsGrid}>
          {[
            { label: "Projects", value: totalProjects, icon: "folder" },
            { label: "Completed", value: completedProjects, icon: "check-circle" },
            { label: "AI Runs", value: user?.totalGenerations ?? 0, icon: "cpu" },
            { label: "Assets", value: user?.totalProjects != null ? user.totalProjects * 80 : 0, icon: "image" },
          ].map((s) => (
            <View key={s.label} style={[styles.statBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name={s.icon as any} size={16} color={colors.primary} />
              <Text style={[styles.statVal, { color: colors.foreground }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* AI Credits */}
        <View style={[styles.creditsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.creditsHeader}>
            <View style={styles.creditsLeft}>
              <Feather name="zap" size={16} color={colors.accent} />
              <Text style={[styles.creditsTitle, { color: colors.foreground }]}>AI Credits</Text>
            </View>
            <Text style={[styles.creditsValue, { color: creditsPct > 80 ? colors.warning : colors.primary }]}>
              {creditsUsed.toLocaleString()} / {creditsLimit > 0 ? creditsLimit.toLocaleString() : "∞"}
            </Text>
          </View>
          <View style={[styles.creditsBg, { backgroundColor: colors.muted }]}>
            <View style={[
              styles.creditsFill,
              {
                width: `${creditsPct}%` as any,
                backgroundColor: creditsPct > 80 ? colors.warning : colors.primary,
              },
            ]} />
          </View>
          <Text style={[styles.creditsSub, { color: colors.mutedForeground }]}>
            {creditsLimit > 0
              ? `${(creditsLimit - creditsUsed).toLocaleString()} credits remaining · Resets monthly`
              : "Unlimited credits"}
          </Text>
        </View>

        {/* Profile Tab Bar */}
        <View style={[styles.tabBar, { backgroundColor: colors.muted }]}>
          {PROFILE_TABS.map((tab) => (
            <Pressable
              key={tab.value}
              onPress={() => setActiveTab(tab.value)}
              style={[styles.tab, activeTab === tab.value && [styles.tabActive, { backgroundColor: colors.card }]]}
            >
              <Feather
                name={tab.icon as any}
                size={13}
                color={activeTab === tab.value ? colors.primary : colors.mutedForeground}
              />
              <Text style={[styles.tabLabel, { color: activeTab === tab.value ? colors.primary : colors.mutedForeground }]}>
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* ACCOUNT TAB */}
        {activeTab === "account" && (
          <>
            <Text style={[styles.groupLabel, { color: colors.mutedForeground }]}>PROFILE</Text>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <SettingRow icon="user" label="Edit Profile" onPress={() => {}} />
              <SettingRow icon="at-sign" label="Username" value={`@${user?.username ?? "guest"}`} />
              <SettingRow icon="mail" label="Email" value={user?.email ?? "—"} badge={user?.email ? "Verified" : undefined} />
              <SettingRow icon="cloud" label="Cloud Storage" value="2.4 GB used" onPress={() => {}} />
              <SettingRow icon="link" label="Connected Accounts" value="2 linked" onPress={() => {}} />
            </View>

            <Text style={[styles.groupLabel, { color: colors.mutedForeground }]}>CONNECTED ACCOUNTS</Text>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {CONNECTED_PROVIDERS.map((p, i) => {
                const linked = i < 2;
                return (
                  <View key={p.id} style={[styles.row, { borderBottomColor: colors.border }]}>
                    <View style={[styles.rowIcon, { backgroundColor: colors.muted }]}>
                      <Feather name={p.icon as any} size={16} color={colors.foreground} />
                    </View>
                    <Text style={[styles.rowLabel, { color: colors.foreground }]}>{p.label}</Text>
                    <Pressable style={[
                      styles.linkBtn,
                      { backgroundColor: linked ? colors.success + "22" : colors.primary + "22" }
                    ]}>
                      <Text style={[styles.linkBtnText, { color: linked ? colors.success : colors.primary }]}>
                        {linked ? "Linked" : "Connect"}
                      </Text>
                    </Pressable>
                  </View>
                );
              })}
            </View>

            <Text style={[styles.groupLabel, { color: colors.mutedForeground }]}>AI SETTINGS</Text>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <SettingRow icon="cpu" label="AI Model" value="GPT-4o" onPress={() => {}} />
              <SettingRow icon="sliders" label="Generation Quality" value="Ultra" onPress={() => {}} />
              <SettingRow icon="globe" label="Export Engines" value="Godot, Unity" onPress={() => {}} />
              <SettingRow icon="moon" label="Dark Mode" toggle toggled={darkMode} onToggle={setDarkMode} />
            </View>

            <Text style={[styles.groupLabel, { color: colors.mutedForeground }]}>PREFERENCES</Text>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <SettingRow icon="bell" label="Push Notifications" toggle toggled={notifPush} onToggle={setNotifPush} />
              <SettingRow icon="mail" label="Email Notifications" toggle toggled={notifEmail} onToggle={setNotifEmail} />
              <SettingRow icon="package" label="Build Completion Alerts" toggle toggled={notifBuild} onToggle={setNotifBuild} />
            </View>

            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <SettingRow icon="help-circle" label="Help & Support" onPress={() => {}} />
              <SettingRow icon="message-circle" label="Send Feedback" onPress={() => {}} />
              {isAuthenticated && !isGuest ? (
                <SettingRow icon="log-out" label="Sign Out" danger onPress={handleLogout} />
              ) : (
                <SettingRow icon="log-in" label="Sign In / Create Account" onPress={() => router.push("/auth/login")} />
              )}
            </View>
          </>
        )}

        {/* SUBSCRIPTION TAB */}
        {activeTab === "subscription" && (
          <>
            {/* Current plan */}
            <View style={[styles.planCard, { backgroundColor: tierConfig.color + "15", borderColor: tierConfig.color }]}>
              <View style={styles.planCardHeader}>
                <Feather name={tierConfig.icon as any} size={22} color={tierConfig.color} />
                <View>
                  <Text style={[styles.planName, { color: colors.foreground }]}>{tierConfig.label} Plan</Text>
                  <Text style={[styles.planStatus, { color: colors.success }]}>Active</Text>
                </View>
              </View>
              <View style={styles.planFeatures}>
                <View style={styles.featureRow}>
                  <Feather name="zap" size={13} color={colors.accent} />
                  <Text style={[styles.featureText, { color: colors.mutedForeground }]}>
                    {creditsLimit > 0 ? `${creditsLimit.toLocaleString()} AI credits/month` : "Unlimited AI credits"}
                  </Text>
                </View>
                <View style={styles.featureRow}>
                  <Feather name="folder" size={13} color={colors.accent} />
                  <Text style={[styles.featureText, { color: colors.mutedForeground }]}>
                    {tierConfig.projects > 0 ? `${tierConfig.projects} projects` : "Unlimited projects"}
                  </Text>
                </View>
                <View style={styles.featureRow}>
                  <Feather name="upload" size={13} color={colors.accent} />
                  <Text style={[styles.featureText, { color: colors.mutedForeground }]}>
                    {tier === "free" ? "3 export targets" : "All export targets"}
                  </Text>
                </View>
              </View>
            </View>

            {/* Upgrade options */}
            {tier !== "enterprise" && (
              <>
                <Text style={[styles.groupLabel, { color: colors.mutedForeground }]}>UPGRADE YOUR PLAN</Text>
                {[
                  { id: "pro", label: "Pro", price: "$9.99/mo", credits: "1,000", color: "#2B7FFF" },
                  { id: "studio", label: "Studio", price: "$29.99/mo", credits: "10,000", color: "#7B2FFF" },
                  { id: "enterprise", label: "Enterprise", price: "Custom", credits: "Unlimited", color: "#F97316" },
                ].filter((p) => p.id !== tier).map((plan) => (
                  <Pressable
                    key={plan.id}
                    style={[styles.upgradePlan, { backgroundColor: colors.card, borderColor: plan.color }]}
                    onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
                  >
                    <View style={[styles.upgradePlanIcon, { backgroundColor: plan.color + "22" }]}>
                      <Feather name="arrow-up" size={16} color={plan.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.upgradePlanName, { color: colors.foreground }]}>{plan.label}</Text>
                      <Text style={[styles.upgradePlanCredits, { color: colors.mutedForeground }]}>
                        {plan.credits} AI credits/month
                      </Text>
                    </View>
                    <Text style={[styles.upgradePlanPrice, { color: plan.color }]}>{plan.price}</Text>
                  </Pressable>
                ))}
              </>
            )}

            <Text style={[styles.groupLabel, { color: colors.mutedForeground }]}>BILLING</Text>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <SettingRow icon="file-text" label="Invoice History" onPress={() => {}} />
              <SettingRow icon="credit-card" label="Payment Methods" onPress={() => {}} />
              <SettingRow icon="calendar" label="Next Billing Date" value="Jul 24, 2026" />
            </View>
          </>
        )}

        {/* SECURITY TAB */}
        {activeTab === "security" && (
          <>
            <Text style={[styles.groupLabel, { color: colors.mutedForeground }]}>AUTHENTICATION</Text>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <SettingRow icon="lock" label="Change Password" onPress={() => {}} />
              <SettingRow
                icon="shield"
                label="Two-Factor Authentication"
                toggle
                toggled={mfaEnabled}
                onToggle={setMfaEnabled}
                badge={mfaEnabled ? "ON" : undefined}
              />
              <SettingRow icon="key" label="Passkeys / WebAuthn" onPress={() => {}} badge="New" />
              <SettingRow icon="link" label="Magic Link Login" onPress={() => {}} />
            </View>

            <Text style={[styles.groupLabel, { color: colors.mutedForeground }]}>SESSIONS & DEVICES</Text>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <SettingRow icon="smartphone" label="Active Sessions" value="2 devices" onPress={() => {}} />
              <SettingRow icon="clock" label="Login History" onPress={() => {}} />
              <SettingRow icon="alert-triangle" label="Suspicious Activity" value="None detected" />
            </View>

            <Text style={[styles.groupLabel, { color: colors.mutedForeground }]}>PRIVACY & DATA</Text>
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <SettingRow icon="eye-off" label="Privacy Settings" onPress={() => {}} />
              <SettingRow icon="download" label="Export My Data" onPress={() => {}} />
              <SettingRow icon="trash-2" label="Delete Account" danger onPress={() => {}} />
            </View>

            {/* Security score */}
            <View style={[styles.securityScore, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.securityScoreTitle, { color: colors.foreground }]}>Security Score</Text>
              <View style={styles.securityScoreRow}>
                {[
                  { label: "Password", done: true },
                  { label: "Email Verified", done: false },
                  { label: "MFA", done: mfaEnabled },
                  { label: "Recovery", done: false },
                ].map((item) => (
                  <View key={item.label} style={styles.securityItem}>
                    <View style={[styles.securityDot, { backgroundColor: item.done ? colors.success : colors.border }]}>
                      {item.done && <Feather name="check" size={8} color="#fff" />}
                    </View>
                    <Text style={[styles.securityItemLabel, { color: item.done ? colors.foreground : colors.mutedForeground }]}>
                      {item.label}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          </>
        )}

        <Text style={[styles.version, { color: colors.mutedForeground }]}>GenForgeAI Mobile v1.0.0 · {tier} plan</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  inner: { paddingHorizontal: 20, gap: 16 },
  profileCard: { borderRadius: 18, borderWidth: 1, padding: 20, alignItems: "center", gap: 8 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  avatarText: { fontSize: 32, fontFamily: "Inter_700Bold", color: "#fff" },
  avatarEdit: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  name: { fontSize: 20, fontFamily: "Inter_700Bold" },
  handle: { fontSize: 13, fontFamily: "Inter_400Regular" },
  tierBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  tierBadgeText: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 0.8 },
  upgradeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 4,
  },
  upgradeBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },
  statsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  statBox: { width: "47%", alignItems: "center", paddingVertical: 16, borderRadius: 14, borderWidth: 1, gap: 4 },
  statVal: { fontSize: 22, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  creditsCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 8 },
  creditsHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  creditsLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  creditsTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  creditsValue: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  creditsBg: { height: 6, borderRadius: 3, overflow: "hidden" },
  creditsFill: { height: 6, borderRadius: 3 },
  creditsSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  tabBar: { flexDirection: "row", borderRadius: 12, padding: 3, gap: 2 },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 8,
    borderRadius: 10,
  },
  tabActive: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  tabLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  groupLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 1.2, marginBottom: -6 },
  card: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderBottomWidth: 1,
  },
  rowIcon: { width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  rowLabel: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  rowRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  rowValue: { fontSize: 13, fontFamily: "Inter_400Regular" },
  rowBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 },
  rowBadgeText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  linkBtn: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 7 },
  linkBtnText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  planCard: { borderRadius: 16, borderWidth: 1.5, padding: 16, gap: 14 },
  planCardHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  planName: { fontSize: 18, fontFamily: "Inter_700Bold" },
  planStatus: { fontSize: 12, fontFamily: "Inter_500Medium" },
  planFeatures: { gap: 8 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  featureText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  upgradePlan: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 14,
  },
  upgradePlanIcon: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  upgradePlanName: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  upgradePlanCredits: { fontSize: 12, fontFamily: "Inter_400Regular" },
  upgradePlanPrice: { fontSize: 14, fontFamily: "Inter_700Bold" },
  securityScore: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  securityScoreTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  securityScoreRow: { flexDirection: "row", gap: 12, flexWrap: "wrap" },
  securityItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  securityDot: { width: 18, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  securityItemLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  version: { textAlign: "center", fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 8 },
});
