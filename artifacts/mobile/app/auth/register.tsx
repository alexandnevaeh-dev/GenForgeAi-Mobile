import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

const TIERS = [
  { id: "free", label: "Free", credits: "100 AI credits/mo", projects: "3 projects", price: "Free" },
  { id: "pro", label: "Pro", credits: "1,000 AI credits/mo", projects: "Unlimited projects", price: "$9.99/mo", popular: true },
  { id: "studio", label: "Studio", credits: "10,000 AI credits/mo", projects: "Team projects", price: "$29.99/mo" },
];

export default function RegisterScreen() {
  const colors = useColors();
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

  const topPad = Platform.OS === "web" ? 40 : insets.top + 16;

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={{ paddingTop: topPad, paddingBottom: insets.bottom + 32, paddingHorizontal: 24, gap: 24 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <Pressable onPress={() => step === "form" ? setStep("tier") : router.back()}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.screenTitle, { color: colors.foreground }]}>
            {step === "tier" ? "Choose Your Plan" : "Create Account"}
          </Text>
          <View style={{ width: 22 }} />
        </View>

        {step === "tier" && (
          <>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Start free, upgrade anytime. No credit card required.
            </Text>

            {/* Tier cards */}
            <View style={styles.tiers}>
              {TIERS.map((tier) => (
                <Pressable
                  key={tier.id}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedTier(tier.id);
                  }}
                  style={[
                    styles.tierCard,
                    {
                      backgroundColor: colors.card,
                      borderColor: selectedTier === tier.id ? colors.primary : colors.border,
                      borderWidth: selectedTier === tier.id ? 2 : 1,
                    },
                  ]}
                >
                  {tier.popular && (
                    <View style={[styles.popularBadge, { backgroundColor: colors.primary }]}>
                      <Text style={styles.popularText}>POPULAR</Text>
                    </View>
                  )}
                  <View style={styles.tierHeader}>
                    <Text style={[styles.tierLabel, { color: colors.foreground }]}>{tier.label}</Text>
                    <Text style={[styles.tierPrice, { color: tier.id === "free" ? colors.success : colors.primary }]}>
                      {tier.price}
                    </Text>
                  </View>
                  <View style={styles.tierFeatures}>
                    <View style={styles.featureRow}>
                      <Feather name="zap" size={12} color={colors.accent} />
                      <Text style={[styles.featureText, { color: colors.mutedForeground }]}>{tier.credits}</Text>
                    </View>
                    <View style={styles.featureRow}>
                      <Feather name="folder" size={12} color={colors.accent} />
                      <Text style={[styles.featureText, { color: colors.mutedForeground }]}>{tier.projects}</Text>
                    </View>
                  </View>
                  {selectedTier === tier.id && (
                    <View style={[styles.checkMark, { backgroundColor: colors.primary }]}>
                      <Feather name="check" size={12} color="#fff" />
                    </View>
                  )}
                </Pressable>
              ))}
            </View>

            <Pressable
              onPress={() => setStep("form")}
              style={[styles.nextBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={styles.nextBtnText}>Continue with {TIERS.find((t) => t.id === selectedTier)?.label}</Text>
              <Feather name="arrow-right" size={18} color="#fff" />
            </Pressable>

            <Pressable onPress={() => { continueAsGuest(); router.replace("/(tabs)"); }} style={styles.guestBtn}>
              <Text style={[styles.guestText, { color: colors.mutedForeground }]}>Continue as Guest</Text>
            </Pressable>
          </>
        )}

        {step === "form" && (
          <>
            {/* Plan badge */}
            <View style={[styles.planBadge, { backgroundColor: colors.primary + "22", borderColor: colors.primary }]}>
              <Feather name="check-circle" size={14} color={colors.primary} />
              <Text style={[styles.planBadgeText, { color: colors.primary }]}>
                {TIERS.find((t) => t.id === selectedTier)?.label} Plan — {TIERS.find((t) => t.id === selectedTier)?.price}
              </Text>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {error ? (
                <View style={[styles.errorBox, { backgroundColor: colors.destructive + "22", borderColor: colors.destructive }]}>
                  <Feather name="alert-circle" size={14} color={colors.destructive} />
                  <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
                </View>
              ) : null}

              {[
                { label: "Display Name", value: displayName, onChange: setDisplayName, placeholder: "Your Name", icon: "user", auto: "words" as const },
                { label: "Username", value: username, onChange: setUsername, placeholder: "yourhandle", icon: "at-sign", auto: "none" as const },
                { label: "Email", value: email, onChange: setEmail, placeholder: "you@example.com", icon: "mail", auto: "none" as const, keyboardType: "email-address" as const },
              ].map((field) => (
                <View key={field.label}>
                  <Text style={[styles.label, { color: colors.mutedForeground }]}>{field.label}</Text>
                  <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Feather name={field.icon as any} size={16} color={colors.mutedForeground} />
                    <TextInput
                      style={[styles.input, { color: colors.foreground }]}
                      placeholder={field.placeholder}
                      placeholderTextColor={colors.mutedForeground}
                      value={field.value}
                      onChangeText={field.onChange}
                      autoCapitalize={field.auto}
                      autoCorrect={false}
                      keyboardType={field.keyboardType}
                    />
                  </View>
                </View>
              ))}

              <View>
                <Text style={[styles.label, { color: colors.mutedForeground }]}>Password</Text>
                <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Feather name="lock" size={16} color={colors.mutedForeground} />
                  <TextInput
                    style={[styles.input, { color: colors.foreground }]}
                    placeholder="At least 8 characters"
                    placeholderTextColor={colors.mutedForeground}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                    autoCapitalize="none"
                  />
                  <Pressable onPress={() => setShowPassword((v) => !v)}>
                    <Feather name={showPassword ? "eye-off" : "eye"} size={16} color={colors.mutedForeground} />
                  </Pressable>
                </View>
              </View>

              {/* Password strength */}
              {password.length > 0 && (
                <View style={styles.strengthRow}>
                  {[1, 2, 3, 4].map((i) => (
                    <View
                      key={i}
                      style={[
                        styles.strengthBar,
                        {
                          backgroundColor:
                            password.length >= i * 3
                              ? password.length >= 12 ? colors.success : colors.warning
                              : colors.border,
                        },
                      ]}
                    />
                  ))}
                  <Text style={[styles.strengthLabel, { color: colors.mutedForeground }]}>
                    {password.length < 8 ? "Too short" : password.length < 12 ? "Good" : "Strong"}
                  </Text>
                </View>
              )}

              <Pressable
                onPress={handleRegister}
                disabled={isLoading}
                style={[styles.registerBtn, { backgroundColor: colors.primary, opacity: isLoading ? 0.7 : 1 }]}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <>
                    <Feather name="user-plus" size={18} color="#fff" />
                    <Text style={styles.registerBtnText}>Create Account</Text>
                  </>
                )}
              </Pressable>

              <Text style={[styles.terms, { color: colors.mutedForeground }]}>
                By creating an account you agree to our{" "}
                <Text style={{ color: colors.primary }}>Terms of Service</Text>
                {" "}and{" "}
                <Text style={{ color: colors.primary }}>Privacy Policy</Text>.
              </Text>
            </View>
          </>
        )}

        {/* Sign in link */}
        <View style={styles.signinRow}>
          <Text style={[styles.signinText, { color: colors.mutedForeground }]}>Already have an account?{" "}</Text>
          <Pressable onPress={() => router.push("/auth/login")}>
            <Text style={[styles.signinLink, { color: colors.primary }]}>Sign In</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  screenTitle: { fontSize: 20, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 21 },
  tiers: { gap: 12 },
  tierCard: { borderRadius: 16, padding: 16, gap: 10 },
  popularBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 5,
    marginBottom: -2,
  },
  popularText: { fontSize: 9, fontFamily: "Inter_700Bold", color: "#fff", letterSpacing: 0.5 },
  tierHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  tierLabel: { fontSize: 18, fontFamily: "Inter_700Bold" },
  tierPrice: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  tierFeatures: { gap: 5 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  featureText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  checkMark: {
    position: "absolute",
    top: 14,
    right: 14,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 15,
  },
  nextBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
  guestBtn: { alignItems: "center" },
  guestText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  planBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
    alignSelf: "flex-start",
  },
  planBadgeText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  form: { gap: 14 },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
  },
  errorText: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  label: { fontSize: 12, fontFamily: "Inter_500Medium", marginBottom: 6 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  input: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  strengthRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  strengthBar: { flex: 1, height: 3, borderRadius: 2 },
  strengthLabel: { fontSize: 11, fontFamily: "Inter_400Regular", marginLeft: 4 },
  registerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 15,
    marginTop: 4,
  },
  registerBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
  terms: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 18 },
  signinRow: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  signinText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  signinLink: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
});
