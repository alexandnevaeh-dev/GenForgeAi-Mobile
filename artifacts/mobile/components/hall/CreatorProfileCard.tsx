import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";

import { CrystalTierBadge } from "./CrystalTierBadge";

interface CreatorProfileCardProps {
  displayName?: string;
  username?: string;
  email?: string;
  tier: string;
  isGuest: boolean;
  onEditPress: () => void;
  onCreateAccountPress: () => void;
}

export function CreatorProfileCard({
  displayName,
  username,
  email,
  tier,
  isGuest,
  onEditPress,
  onCreateAccountPress,
}: CreatorProfileCardProps) {
  const ringRotate = useRef(new Animated.Value(0)).current;
  const borderPulse = useRef(new Animated.Value(0.5)).current;
  const mountAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(mountAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    Animated.loop(
      Animated.timing(ringRotate, {
        toValue: 1,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(borderPulse, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(borderPulse, { toValue: 0.3, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, [ringRotate, borderPulse, mountAnim]);

  const spin = ringRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const tierColor =
    tier === "pro" ? "#2B7FFF"
    : tier === "studio" ? "#7B2FFF"
    : tier === "enterprise" ? "#F97316"
    : "#6B6B80";

  const initial = (displayName ?? "G")[0]?.toUpperCase() ?? "G";

  const handleEdit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onEditPress();
  };

  return (
    <Animated.View style={[styles.outerWrap, { opacity: mountAnim }]}>
      <LinearGradient colors={["#0E0C1E", "#0C0A1A"]} style={StyleSheet.absoluteFill} />
      <View style={styles.staticBorder} />
      {/* Animated card glow border */}
      <Animated.View
        style={[styles.glowBorder, { borderColor: tierColor, opacity: borderPulse }]}
        pointerEvents="none"
      />

      {/* Avatar section */}
      <View style={styles.avatarSection}>
        {/* Outer ring */}
        <Animated.View
          style={[styles.avatarRingOuter, { borderColor: tierColor + "30", transform: [{ rotate: spin }] }]}
        />
        {/* Inner ring */}
        <View style={[styles.avatarRingInner, { borderColor: tierColor + "60", shadowColor: tierColor }]} />

        {/* Avatar circle */}
        <View style={[styles.avatarCircle, { backgroundColor: tierColor + "28", shadowColor: tierColor }]}>
          <LinearGradient
            colors={[tierColor + "40", tierColor + "18"]}
            style={StyleSheet.absoluteFill}
          />
          <Text style={[styles.avatarInitial, { color: tierColor }]}>{initial}</Text>
        </View>

        {/* Camera badge — crystal icon to open edit */}
        <Pressable onPress={handleEdit} style={styles.cameraBadge}>
          <LinearGradient colors={["#1A1628", "#0E0C1E"]} style={StyleSheet.absoluteFill} />
          <View style={styles.cameraBadgeBorder} />
          <Feather name="camera" size={10} color="#5BA8FF" />
        </Pressable>
      </View>

      {/* Name */}
      <Text style={styles.name}>{displayName ?? "Game Developer"}</Text>
      <Text style={styles.handle}>
        @{username ?? "guest"} · {email ?? (isGuest ? "guest mode" : "—")}
      </Text>

      {/* Tier badge */}
      <CrystalTierBadge tier={isGuest ? "guest" : tier} />

      {/* Edit button or guest CTA */}
      {!isGuest ? (
        <Pressable onPress={handleEdit} style={styles.editBtn}>
          <LinearGradient colors={["#141228", "#0E0C1E"]} style={StyleSheet.absoluteFill} />
          <View style={styles.editBorder} />
          <Feather name="edit-2" size={13} color="#5BA8FF" />
          <Text style={styles.editBtnText}>Edit Profile</Text>
        </Pressable>
      ) : (
        <Pressable onPress={onCreateAccountPress} style={styles.guestCta}>
          <LinearGradient colors={["#1E4FBF", "#2B7FFF"]} style={StyleSheet.absoluteFill} />
          <LinearGradient
            colors={["rgba(255,255,255,0.15)", "rgba(255,255,255,0)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.guestCtaBorder} />
          <Feather name="user-plus" size={14} color="#AADCFF" />
          <Text style={styles.guestCtaText}>Create Free Account</Text>
        </Pressable>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outerWrap: {
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    gap: 10,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  staticBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(42,38,64,0.8)",
  },
  glowBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    borderWidth: 1.5,
  },

  avatarSection: {
    width: 96,
    height: 96,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  avatarRingOuter: {
    position: "absolute",
    width: 94,
    height: 94,
    borderRadius: 47,
    borderWidth: 1,
    borderStyle: "dashed" as any,
  },
  avatarRingInner: {
    position: "absolute",
    width: 82,
    height: 82,
    borderRadius: 41,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.08)",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 6,
  },
  avatarInitial: {
    fontSize: 30,
    fontFamily: "Inter_700Bold",
  },
  cameraBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowColor: "#3B8FFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  cameraBadgeBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(59,143,255,0.4)",
  },

  name: {
    fontSize: 21,
    fontFamily: "Inter_700Bold",
    color: "#C0B8E0",
    textShadowColor: "rgba(140,120,255,0.25)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  handle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#3A3458",
  },

  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 2,
  },
  editBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(59,143,255,0.3)",
  },
  editBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#5BA8FF" },

  guestCta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 13,
    overflow: "hidden",
    marginTop: 4,
    shadowColor: "#3B8FFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 5,
  },
  guestCtaBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  guestCtaText: { fontSize: 14, fontFamily: "Inter_700Bold", color: "#D0E8FF" },
});
