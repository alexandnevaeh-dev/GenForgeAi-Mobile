import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

const TIER_ICONS: Record<string, React.ComponentProps<typeof Feather>["name"]> = {
  free: "user",
  pro: "zap",
  studio: "layers",
  enterprise: "globe",
};

interface CurrentPlanCardProps {
  tier: string;
  tierLabel: string;
  tierColor: string;
  creditsLimit: number;
  projectsLimit: number;
  exportLabel: string;
}

export function CurrentPlanCard({ tier, tierLabel, tierColor, creditsLimit, projectsLimit, exportLabel }: CurrentPlanCardProps) {
  const glow = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0.3, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, [glow]);

  const icon = TIER_ICONS[tier] ?? "user";

  return (
    <View style={[current.wrap, { shadowColor: tierColor }]}>
      <LinearGradient colors={["#0E0C1E", "#0C0A1A"]} style={StyleSheet.absoluteFill} />
      <Animated.View style={[current.glowBorder, { borderColor: tierColor, opacity: glow }]} />
      <View style={[current.staticBorder, { borderColor: tierColor + "30" }]} />
      <LinearGradient
        colors={[tierColor + "10", "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={current.header}>
        <View style={[current.iconWrap, { backgroundColor: tierColor + "20", borderColor: tierColor + "50" }]}>
          <Feather name={icon} size={22} color={tierColor} style={[current.iconGlow, { shadowColor: tierColor }]} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={current.planName}>{tierLabel} Plan</Text>
          <View style={current.activeBadge}>
            <View style={current.activeDot} />
            <Text style={current.activeText}>Active</Text>
          </View>
        </View>
      </View>

      {/* Features */}
      <View style={current.features}>
        {[
          { icon: "zap" as const, text: creditsLimit > 0 ? `${creditsLimit.toLocaleString()} AI credits/month` : "Unlimited AI credits" },
          { icon: "folder" as const, text: projectsLimit > 0 ? `${projectsLimit} projects` : "Unlimited projects" },
          { icon: "upload" as const, text: exportLabel },
        ].map((f) => (
          <View key={f.text} style={current.featureRow}>
            <Feather name={f.icon} size={13} color={tierColor} style={[current.featureIcon, { shadowColor: tierColor }]} />
            <Text style={current.featureText}>{f.text}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

interface UpgradePlanCardProps {
  id: string;
  label: string;
  price: string;
  credits: string;
  color: string;
}

export function UpgradePlanCard({ id, label, price, credits, color }: UpgradePlanCardProps) {
  const icon = TIER_ICONS[id] ?? "arrow-up";
  return (
    <Pressable
      onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
      style={[upgrade.wrap, { shadowColor: color }]}
    >
      <LinearGradient colors={["#0E0C1E", "#0C0A1A"]} style={StyleSheet.absoluteFill} />
      <View style={[upgrade.border, { borderColor: color + "55" }]} />
      <LinearGradient colors={[color + "08", "transparent"]} style={StyleSheet.absoluteFill} />

      {/* Icon */}
      <View style={[upgrade.iconWrap, { backgroundColor: color + "18", borderColor: color + "40" }]}>
        <Feather name={icon} size={17} color={color} />
      </View>

      <View style={{ flex: 1 }}>
        <Text style={upgrade.name}>{label}</Text>
        <Text style={upgrade.credits}>{credits} AI credits/month</Text>
      </View>

      <Text style={[upgrade.price, { color }]}>{price}</Text>
      <Feather name="arrow-right" size={14} color={color + "80"} />
    </Pressable>
  );
}

const current = StyleSheet.create({
  wrap: {
    borderRadius: 18,
    padding: 18,
    gap: 14,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  staticBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
    borderWidth: 1.5,
  },
  glowBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
    borderWidth: 1,
  },
  header: { flexDirection: "row", alignItems: "center", gap: 13 },
  iconWrap: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  iconGlow: { shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 8, elevation: 5 },
  planName: { fontSize: 19, fontFamily: "Inter_700Bold", color: "#C0B8E0" },
  activeBadge: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 3 },
  activeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#22C55E",
    shadowColor: "#22C55E",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
    elevation: 3,
  },
  activeText: { fontSize: 12, fontFamily: "Inter_500Medium", color: "#22C55E" },
  features: { gap: 9 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 9 },
  featureIcon: { shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.7, shadowRadius: 4, elevation: 3 },
  featureText: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#3A3458" },
});

const upgrade = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 15,
    padding: 14,
    overflow: "hidden",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 15,
    borderWidth: 1.5,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  name: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#C0B8E0" },
  credits: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#3A3458" },
  price: { fontSize: 14, fontFamily: "Inter_700Bold" },
});
