import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AuthBackground } from "@/components/gateway/AuthBackground";
import { CrystalButton } from "@/components/gateway/CrystalButton";
import { MagicInput } from "@/components/gateway/MagicInput";
import { StrengthCrystals } from "@/components/gateway/StrengthCrystals";
import { useAuth } from "@/context/AuthContext";

const TIERS = [
  {
    id: "free",
    label: "Free",
    credits: "100 AI credits/mo",
    projects: "3 projects",
    price: "Free",
    popular: false,
    icon: "user" as const,
    color: "#6B6B90",
    grad: ["#1A1828", "#2A2448"] as [string, string],
    border: "rgba(100,100,130,0.35)",
    features: ["100 AI credits/mo", "3 projects", "Standard generation"],
  },
  {
    id: "pro",
    label: "Pro",
    credits: "1,000 AI credits/mo",
    projects: "Unlimited projects",
    price: "$9.99/mo",
    popular: true,
    icon: "zap" as const,
    color: "#2B7FFF",
    grad: ["#0E2860", "#1A4FBF"] as [string, string],
    border: "rgba(59,143,255,0.4)",
    features: ["1,000 AI credits/mo", "Unlimited projects", "Priority generation"],
  },
  {
    id: "studio",
    label: "Studio",
    credits: "10,000 AI credits/mo",
    projects: "Team projects",
    price: "$29.99/mo",
    popular: false,
    icon: "layers" as const,
    color: "#7B2FFF",
    grad: ["#1A0A60", "#3B1FAA"] as [string, string],
    border: "rgba(123,47,255,0.4)",
    features: ["10,000 AI credits/mo", "Team projects", "Commercial license"],
  },
] as const;

interface TierCardProps {
  tier: (typeof TIERS)[number];
  isSelected: boolean;
  onSelect: () => void;
}

function TierCard({ tier, isSelected, onSelect }: TierCardProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const borderAnim = useRef(new Animated.Value(0)).current;
  const popularPulse = useRef(new Animated.Value(0.7)).current;

  React.useEffect(() => {
    if (isSelected) {
      Animated.spring(scale, { toValue: 1.02, useNativeDriver: true, tension: 80, friction: 8 }).start();
      Animated.spring(borderAnim, { toValue: 1, useNativeDriver: false, tension: 60, friction: 10 }).start();
    } else {
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 80, friction: 8 }).start();
      Animated.spring(borderAnim, { toValue: 0, useNativeDriver: false, tension: 60, friction: 10 }).start();
    }
  }, [isSelected, scale, borderAnim]);

  React.useEffect(() => {
    if (!tier.popular) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(popularPulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(popularPulse, { toValue: 0.5, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [tier.popular, popularPulse]);

  return (
    <Animated.View style={[s.tierWrap, { transform: [{ scale }] }]}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onSelect();
        }}
        style={s.tierCard}
      >
        {/* Base gradient */}
        <LinearGradient colors={["#0C0A1C", "#0E0C22"]} style={StyleSheet.absoluteFill} />
        {/* Selected color wash */}
        {isSelected && (
          <LinearGradient
            colors={[tier.grad[0] + "60", tier.grad[1] + "30"]}
            style={StyleSheet.absoluteFill}
          />
        )}
        {/* Border */}
        <View
          style={[
            s.tierBorder,
            { borderColor: isSelected ? tier.border : "rgba(42,38,64,0.6)" },
            isSelected && {
              shadowColor: tier.color,
              shadowOffset: { width: 0, height: 0 },
              shadowOpacity: 0.35,
              shadowRadius: 10,
            },
          ]}
        />

        {/* POPULAR badge */}
        {tier.popular && (
          <Animated.View style={[s.popularBadge, { opacity: popularPulse }]}>
            <LinearGradient colors={["#1E4FBF", "#2B7FFF"]} style={StyleSheet.absoluteFill} />
            <Feather name="star" size={8} color="#AADCFF" />
            <Text style={s.popularText}>POPULAR</Text>
          </Animated.View>
        )}

        {/* Header row */}
        <View style={s.tierHeader}>
          {/* Tier icon crystal */}
          <View style={[s.tierIcon, { borderColor: isSelected ? tier.border : "rgba(42,38,64,0.5)" }]}>
            <LinearGradient
              colors={isSelected ? tier.grad : ["#1A1828", "#2A2448"]}
              style={StyleSheet.absoluteFill}
            />
            <Feather name={tier.icon} size={16} color={isSelected ? tier.color : "#3A3458"} />
          </View>
          <View style={s.tierTitleWrap}>
            <Text style={[s.tierLabel, { color: isSelected ? tier.color : "#6A6488" }]}>{tier.label}</Text>
            <Text style={[s.tierPrice, { color: isSelected ? "#C0B8E0" : "#5A5478" }]}>{tier.price}</Text>
          </View>
          {isSelected && (
            <View style={[s.checkCircle, { backgroundColor: tier.color }]}>
              <Feather name="check" size={10} color="#fff" />
            </View>
          )}
        </View>

        {/* Features */}
        <View style={s.tierFeatures}>
          {tier.features.map((f) => (
            <View key={f} style={s.featureRow}>
              <View style={[s.featureDot, { backgroundColor: isSelected ? tier.color + "40" : "rgba(42,38,64,0.6)" }]}>
                <Feather name="check" size={8} color={isSelected ? tier.color : "#3A3458"} />
              </View>
              <Text style={[s.featureText, { color: isSelected ? "#8A88A8" : "#4A4868" }]}>{f}</Text>
            </View>
          ))}
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const { register, continueAsGuest } = useAuth();

  const [step, setStep] = useState<"tier" | "form">("tier");
  const [selectedTier, setSelectedTier] = useState("free");
  const [displayName, setDisplayName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async () => {
    if (!displayName.trim() || !username.trim() || !email.trim() || !password) {
      setError("Please fill in all fields.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);
    setError("");
    const result = await register(email.trim(), username.trim(), displayName.trim(), password);
    setIsLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      router.replace("/(tabs)");
    }
  };

  const topPad = Platform.OS === "web" ? 40 : insets.top + 12;
  const selectedTierObj = TIERS.find((t) => t.id === selectedTier)!;

  return (
    <View style={s.root}>
      <AuthBackground />
      <LinearGradient
        colors={["rgba(6,4,15,0.4)", "rgba(11,9,20,0.82)", "rgba(11,9,20,0.96)"]}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <KeyboardAvoidingView
        style={s.kav}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={[s.scroll, { paddingTop: topPad, paddingBottom: insets.bottom + 32 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={s.headerRow}>
            <Pressable
              onPress={() => (step === "form" ? setStep("tier") : router.back())}
              hitSlop={8}
              style={s.backBtn}
            >
              <LinearGradient colors={["#0E0C1E", "#0C0A1A"]} style={StyleSheet.absoluteFill} />
              <View style={s.backBorder} />
              <Feather name="arrow-left" size={18} color="#5A5478" />
            </Pressable>
            <View style={s.titleWrap}>
              <Text style={s.screenTitle}>
                {step === "tier" ? "Choose Your Guild" : "Create Account"}
              </Text>
              <View style={s.titleUnderline} />
            </View>
            <View style={{ width: 36 }} />
          </View>

          {/* ── STEP 1: TIER SELECTION ── */}
          {step === "tier" && (
            <>
              <Text style={s.subtitle}>
                Select your path. Start free, ascend anytime.
              </Text>

              <View style={s.tiers}>
                {TIERS.map((tier) => (
                  <TierCard
                    key={tier.id}
                    tier={tier}
                    isSelected={selectedTier === tier.id}
                    onSelect={() => setSelectedTier(tier.id)}
                  />
                ))}
              </View>

              <CrystalButton
                onPress={() => setStep("form")}
                label={`Continue with ${selectedTierObj.label}`}
                icon="arrow-right"
              />

              <Pressable
                onPress={() => { continueAsGuest(); router.replace("/(tabs)"); }}
                style={s.guestLink}
              >
                <Text style={s.guestLinkText}>Continue as Guest</Text>
              </Pressable>
            </>
          )}

          {/* ── STEP 2: CREATE ACCOUNT FORM ── */}
          {step === "form" && (
            <>
              {/* Plan badge */}
              <View style={s.planBadge}>
                <LinearGradient
                  colors={[selectedTierObj.grad[0] + "60", selectedTierObj.grad[1] + "30"]}
                  style={StyleSheet.absoluteFill}
                />
                <View style={[s.planBadgeBorder, { borderColor: selectedTierObj.border }]} />
                <View style={s.planBadgeIcon}>
                  <LinearGradient colors={selectedTierObj.grad} style={StyleSheet.absoluteFill} />
                  <Feather name={selectedTierObj.icon} size={12} color={selectedTierObj.color} />
                </View>
                <Text style={[s.planBadgeText, { color: selectedTierObj.color }]}>
                  {selectedTierObj.label} Plan · {selectedTierObj.price}
                </Text>
              </View>

              {/* Error warning tablet */}
              {error ? (
                <View style={s.errorTablet}>
                  <LinearGradient colors={["rgba(80,10,10,0.8)", "rgba(50,10,10,0.6)"]} style={StyleSheet.absoluteFill} />
                  <View style={s.errorBorder} />
                  <Feather name="alert-triangle" size={14} color="#FF6644" />
                  <Text style={s.errorText}>{error}</Text>
                </View>
              ) : null}

              {/* Form inputs */}
              <View style={s.form}>
                <MagicInput
                  icon="user"
                  label="DISPLAY NAME"
                  placeholder="Your Name"
                  value={displayName}
                  onChangeText={setDisplayName}
                  autoCapitalize="words"
                  autoCorrect={false}
                />
                <MagicInput
                  icon="at-sign"
                  label="USERNAME"
                  placeholder="yourhandle"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <MagicInput
                  icon="mail"
                  label="EMAIL"
                  placeholder="you@example.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <MagicInput
                  icon="lock"
                  label="PASSWORD"
                  placeholder="At least 8 characters"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                  showPasswordToggle
                  showPassword={showPassword}
                  onTogglePassword={() => setShowPassword((v) => !v)}
                  autoCapitalize="none"
                />

                {/* Password strength crystals */}
                <StrengthCrystals password={password} />

                <CrystalButton
                  onPress={handleRegister}
                  label="Create Account"
                  icon="user-plus"
                  isLoading={isLoading}
                  disabled={isLoading}
                  variant="forge"
                />

                {/* Terms — elegant stone panel */}
                <View style={s.termsPanel}>
                  <LinearGradient colors={["rgba(14,12,30,0.6)", "rgba(10,8,20,0.4)"]} style={StyleSheet.absoluteFill} />
                  <View style={s.termsBorder} />
                  <Text style={s.termsText}>
                    By creating an account you agree to our{" "}
                    <Text style={s.termsLink}>Terms of Service</Text>
                    {" "}and{" "}
                    <Text style={s.termsLink}>Privacy Policy</Text>.
                  </Text>
                </View>
              </View>
            </>
          )}

          {/* Sign in link (both steps) */}
          <View style={s.signinRow}>
            <Text style={s.signinText}>Already have an account?{" "}</Text>
            <Pressable onPress={() => router.push("/auth/login")}>
              <Text style={s.signinLink}>Sign In</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0B0914" },
  kav: { flex: 1 },
  scroll: { paddingHorizontal: 22, gap: 20 },

  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  backBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(42,38,64,0.8)",
  },
  titleWrap: { alignItems: "center", gap: 4 },
  screenTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#C0B8E0" },
  titleUnderline: {
    height: 1,
    width: 40,
    backgroundColor: "rgba(59,143,255,0.3)",
  },

  subtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#3A3458",
    textAlign: "center",
    lineHeight: 20,
  },

  tiers: { gap: 10 },

  /* ── Tier card ── */
  tierWrap: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  tierCard: {
    borderRadius: 16,
    padding: 14,
    gap: 12,
    overflow: "hidden",
  },
  tierBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    borderWidth: 1,
  },
  popularBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    overflow: "hidden",
  },
  popularText: { fontSize: 9, fontFamily: "Inter_700Bold", color: "#AADCFF", letterSpacing: 0.6 },
  tierHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  tierIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  tierTitleWrap: { flex: 1 },
  tierLabel: { fontSize: 16, fontFamily: "Inter_700Bold" },
  tierPrice: { fontSize: 13, fontFamily: "Inter_500Medium" },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  tierFeatures: { gap: 6, paddingLeft: 46 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  featureDot: {
    width: 16,
    height: 16,
    borderRadius: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: { fontSize: 12, fontFamily: "Inter_400Regular" },

  /* ── Guest link ── */
  guestLink: { alignItems: "center", paddingVertical: 4 },
  guestLinkText: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#2A2448" },

  /* ── Plan badge (step 2) ── */
  planBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 10,
    padding: 10,
    overflow: "hidden",
    alignSelf: "flex-start",
  },
  planBadgeBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 10,
    borderWidth: 1,
  },
  planBadgeIcon: {
    width: 22,
    height: 22,
    borderRadius: 6,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  planBadgeText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },

  /* ── Error ── */
  errorTablet: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 12,
    padding: 12,
    overflow: "hidden",
  },
  errorBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(180,40,40,0.6)",
  },
  errorText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", color: "#FF8877" },

  /* ── Form ── */
  form: { gap: 14 },

  /* ── Terms ── */
  termsPanel: {
    borderRadius: 12,
    padding: 12,
    overflow: "hidden",
  },
  termsBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(42,38,64,0.4)",
  },
  termsText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#2A2448",
    textAlign: "center",
    lineHeight: 18,
  },
  termsLink: { color: "#3B6FBF", fontFamily: "Inter_500Medium" },

  /* ── Sign in row ── */
  signinRow: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  signinText: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#3A3458" },
  signinLink: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#3B6FBF",
    textShadowColor: "rgba(59,111,191,0.4)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
});
