import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AnimatedLogo } from "@/components/gateway/AnimatedLogo";
import { AuthBackground } from "@/components/gateway/AuthBackground";
import { CrystalButton } from "@/components/gateway/CrystalButton";
import { GuestCard } from "@/components/gateway/GuestCard";
import { MagicInput } from "@/components/gateway/MagicInput";
import { PortalDivider } from "@/components/gateway/PortalDivider";
import { SocialLoginCard } from "@/components/gateway/SocialLoginCard";
import { useAuth } from "@/context/AuthContext";

const PROVIDERS = [
  { id: "google",    label: "Continue with Google",    icon: "globe"          },
  { id: "apple",     label: "Continue with Apple",     icon: "smartphone"     },
  { id: "github",    label: "Continue with GitHub",    icon: "github"         },
  { id: "discord",   label: "Continue with Discord",   icon: "message-circle" },
  { id: "microsoft", label: "Continue with Microsoft", icon: "monitor"        },
] as const;

export default function LoginScreen() {
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

  const topPad = Platform.OS === "web" ? 40 : insets.top + 12;

  return (
    <View style={s.root}>
      <AuthBackground />
      {/* Dark veil so content is legible */}
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
          {/* Animated logo hero */}
          <AnimatedLogo subtitle="Forge Worlds Through Artificial Intelligence" />

          {/* OAuth providers */}
          <View style={s.providers}>
            {PROVIDERS.map((p) => (
              <SocialLoginCard
                key={p.id}
                label={p.label}
                icon={p.icon}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setError("Social sign-in isn't set up yet — please sign in with your email and password below.");
                }}
              />
            ))}
          </View>

          {/* Arcane divider */}
          <PortalDivider label="or sign in with email" />

          {/* Error warning tablet */}
          {error ? (
            <View style={s.errorTablet}>
              <LinearGradient colors={["rgba(80,10,10,0.8)", "rgba(50,10,10,0.6)"]} style={StyleSheet.absoluteFill} />
              <View style={s.errorBorder} />
              <Feather name="alert-triangle" size={14} color="#FF6644" />
              <Text style={s.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Email + Password inputs */}
          <View style={s.form}>
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
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              showPasswordToggle
              showPassword={showPassword}
              onTogglePassword={() => setShowPassword((v) => !v)}
              autoCapitalize="none"
            />

            {/* Forgot password — glowing rune link */}
            <Pressable style={s.forgotWrap}>
              <Text style={s.forgotText}>Forgot password?</Text>
              <View style={s.forgotUnderline} />
            </Pressable>

            <CrystalButton
              onPress={handleLogin}
              label="Sign In"
              icon="log-in"
              isLoading={isLoading}
              disabled={isLoading}
            />
          </View>

          {/* Security notice panel */}
          <View style={s.securityPanel}>
            <LinearGradient colors={["rgba(14,12,30,0.7)", "rgba(10,8,20,0.5)"]} style={StyleSheet.absoluteFill} />
            <View style={s.securityBorder} />
            <Feather name="shield" size={12} color="#3A3458" />
            <Text style={s.securityText}>Secured with TLS · JWT auth · MFA available</Text>
          </View>

          {/* Create account link */}
          <View style={s.footer}>
            <Text style={s.footerText}>Don't have an account?{" "}</Text>
            <Pressable onPress={() => router.push("/auth/register")}>
              <Text style={s.footerLink}>Create account</Text>
            </Pressable>
          </View>

          {/* Guest mode card */}
          <GuestCard onPress={handleGuest} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0B0914" },
  kav: { flex: 1 },
  scroll: { paddingHorizontal: 22, gap: 20 },

  providers: { gap: 8 },

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

  form: { gap: 14 },

  forgotWrap: { alignSelf: "flex-end", gap: 2 },
  forgotText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "#3B6FBF",
    textShadowColor: "rgba(59,111,191,0.4)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  forgotUnderline: {
    height: 1,
    backgroundColor: "rgba(59,111,191,0.35)",
    marginTop: 1,
  },

  securityPanel: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    overflow: "hidden",
    alignSelf: "center",
  },
  securityBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(42,38,64,0.5)",
  },
  securityText: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#2A2448" },

  footer: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  footerText: { fontSize: 14, fontFamily: "Inter_400Regular", color: "#3A3458" },
  footerLink: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#3B6FBF",
    textShadowColor: "rgba(59,111,191,0.4)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
});
