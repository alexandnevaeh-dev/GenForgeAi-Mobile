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

const PROVIDERS = [
  { id: "google", label: "Continue with Google", icon: "globe" },
  { id: "apple", label: "Continue with Apple", icon: "smartphone" },
  { id: "github", label: "Continue with GitHub", icon: "github" },
  { id: "discord", label: "Continue with Discord", icon: "message-circle" },
  { id: "microsoft", label: "Continue with Microsoft", icon: "monitor" },
];

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { login, continueAsGuest } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);
    setError("");
    const result = await login(email.trim(), password);
    setIsLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      router.replace("/(tabs)");
    }
  };

  const handleGuest = () => {
    continueAsGuest();
    router.replace("/(tabs)");
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
        {/* Brand */}
        <View style={styles.brand}>
          <View style={[styles.brandIcon, { backgroundColor: colors.primary }]}>
            <Feather name="cpu" size={28} color="#fff" />
          </View>
          <Text style={[styles.brandName, { color: colors.foreground }]}>
            GenForge<Text style={{ color: colors.primary }}>AI</Text>
          </Text>
          <Text style={[styles.tagline, { color: colors.mutedForeground }]}>
            AI-Powered Game Development Studio
          </Text>
        </View>

        {/* OAuth Providers */}
        <View style={styles.providers}>
          {PROVIDERS.map((p) => (
            <Pressable
              key={p.id}
              style={[styles.providerBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
            >
              <Feather name={p.icon as any} size={18} color={colors.foreground} />
              <Text style={[styles.providerLabel, { color: colors.foreground }]}>{p.label}</Text>
            </Pressable>
          ))}
        </View>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          <Text style={[styles.dividerText, { color: colors.mutedForeground }]}>or sign in with email</Text>
          <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
        </View>

        {/* Email/Password Form */}
        <View style={styles.form}>
          {error ? (
            <View style={[styles.errorBox, { backgroundColor: colors.destructive + "22", borderColor: colors.destructive }]}>
              <Feather name="alert-circle" size={14} color={colors.destructive} />
              <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
            </View>
          ) : null}

          <View>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Email</Text>
            <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="mail" size={16} color={colors.mutedForeground} />
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                placeholder="you@example.com"
                placeholderTextColor={colors.mutedForeground}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <View>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>Password</Text>
            <View style={[styles.inputWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="lock" size={16} color={colors.mutedForeground} />
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                placeholder="••••••••"
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

          <Pressable style={styles.forgotWrap}>
            <Text style={[styles.forgotText, { color: colors.primary }]}>Forgot password?</Text>
          </Pressable>

          <Pressable
            onPress={handleLogin}
            disabled={isLoading}
            style={[styles.loginBtn, { backgroundColor: colors.primary, opacity: isLoading ? 0.7 : 1 }]}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Feather name="log-in" size={18} color="#fff" />
                <Text style={styles.loginBtnText}>Sign In</Text>
              </>
            )}
          </Pressable>
        </View>

        {/* Security note */}
        <View style={styles.securityRow}>
          <Feather name="shield" size={12} color={colors.mutedForeground} />
          <Text style={[styles.securityText, { color: colors.mutedForeground }]}>
            Secured with TLS · JWT auth · MFA available
          </Text>
        </View>

        {/* Footer links */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.mutedForeground }]}>Don't have an account?{" "}</Text>
          <Pressable onPress={() => router.push("/auth/register")}>
            <Text style={[styles.footerLink, { color: colors.primary }]}>Create account</Text>
          </Pressable>
        </View>

        {/* Guest mode */}
        <Pressable onPress={handleGuest} style={styles.guestBtn}>
          <Text style={[styles.guestText, { color: colors.mutedForeground }]}>
            Continue as Guest <Text style={{ fontFamily: "Inter_600SemiBold" }}>(10 free AI credits)</Text>
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  brand: { alignItems: "center", gap: 10, paddingTop: 16, paddingBottom: 8 },
  brandIcon: {
    width: 64,
    height: 64,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  brandName: { fontSize: 32, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },
  tagline: { fontSize: 14, fontFamily: "Inter_400Regular", textAlign: "center" },
  providers: { gap: 10 },
  providerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1,
  },
  providerLabel: { fontSize: 15, fontFamily: "Inter_500Medium" },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 12, fontFamily: "Inter_400Regular" },
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
  label: { fontSize: 12, fontFamily: "Inter_500Medium", marginBottom: 6, letterSpacing: 0.3 },
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
  forgotWrap: { alignSelf: "flex-end" },
  forgotText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  loginBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 15,
    marginTop: 4,
  },
  loginBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
  securityRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 5 },
  securityText: { fontSize: 11, fontFamily: "Inter_400Regular" },
  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  footerText: { fontSize: 14, fontFamily: "Inter_400Regular" },
  footerLink: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  guestBtn: { alignItems: "center", paddingBottom: 8 },
  guestText: { fontSize: 13, fontFamily: "Inter_400Regular" },
});
