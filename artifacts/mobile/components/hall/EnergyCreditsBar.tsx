import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";

interface EnergyCreditsBarProps {
  creditsUsed: number;
  creditsLimit: number;
  creditsPct: number;
}

export function EnergyCreditsBar({ creditsUsed, creditsLimit, creditsPct }: EnergyCreditsBarProps) {
  const shimmerX = useRef(new Animated.Value(-80)).current;
  const tipGlow = useRef(new Animated.Value(0.5)).current;
  const mountFade = useRef(new Animated.Value(0)).current;

  const isWarning = creditsPct > 80;
  const isUnlimited = creditsLimit <= 0;
  const barColor = isWarning ? "#F97316" : "#3B8FFF";
  const clampedPct = Math.min(Math.max(creditsPct, 0), 100);
  const remaining = creditsLimit > 0 ? creditsLimit - creditsUsed : 0;

  useEffect(() => {
    Animated.timing(mountFade, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    if (!isUnlimited) {
      Animated.loop(
        Animated.timing(shimmerX, { toValue: 400, duration: 2400, easing: Easing.linear, useNativeDriver: true })
      ).start();
      Animated.loop(
        Animated.sequence([
          Animated.timing(tipGlow, { toValue: 1, duration: 800, useNativeDriver: true }),
          Animated.timing(tipGlow, { toValue: 0.3, duration: 800, useNativeDriver: true }),
        ])
      ).start();
    }
  }, [shimmerX, tipGlow, mountFade, isUnlimited]);

  return (
    <Animated.View style={[styles.wrap, { opacity: mountFade }]}>
      <LinearGradient colors={["#0E0C1E", "#0C0A1A"]} style={StyleSheet.absoluteFill} />
      <View style={styles.border} />
      {/* Warm glow when warning */}
      {isWarning && <View style={styles.warningGlow} pointerEvents="none" />}

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Feather name="zap" size={16} color={barColor} style={[styles.zapIcon, { shadowColor: barColor }]} />
          <Text style={styles.title}>AI Credits</Text>
        </View>
        <Text style={[styles.value, { color: barColor }]}>
          {isUnlimited ? "∞" : `${creditsUsed.toLocaleString()} / ${creditsLimit.toLocaleString()}`}
        </Text>
      </View>

      {isUnlimited ? (
        <View style={styles.unlimitedBadge}>
          <LinearGradient colors={["#1A3A8A", "#2B7FFF"]} style={StyleSheet.absoluteFill} />
          <View style={styles.unlimitedBorder} />
          <Feather name="repeat" size={13} color="#AADCFF" />
          <Text style={styles.unlimitedText}>Unlimited Credits</Text>
        </View>
      ) : (
        <>
          {/* Energy bar */}
          <View style={styles.track}>
            <LinearGradient colors={["#0A0818", "#0E0C18"]} style={StyleSheet.absoluteFill} />
            <View style={styles.trackBorder} />
            <View style={[styles.fillWrap, { width: `${clampedPct}%` as any }]}>
              <LinearGradient
                colors={isWarning ? ["#F97316AA", "#F97316"] : ["#2B7FFFAA", "#3B8FFF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              <Animated.View
                style={[styles.shimmer, { transform: [{ translateX: shimmerX }] }]}
                pointerEvents="none"
              >
                <LinearGradient
                  colors={["rgba(255,255,255,0)", "rgba(255,255,255,0.4)", "rgba(255,255,255,0)"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={{ flex: 1 }}
                />
              </Animated.View>
              {clampedPct > 3 && (
                <Animated.View
                  style={[styles.tip, { backgroundColor: barColor, shadowColor: barColor, opacity: tipGlow }]}
                />
              )}
            </View>
          </View>

          {/* Footer */}
          <Text style={styles.sub}>
            {remaining.toLocaleString()} credits remaining · Resets monthly
          </Text>
        </>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 16,
    padding: 16,
    gap: 10,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(42,38,64,0.8)",
  },
  warningGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    backgroundColor: "rgba(249,115,22,0.04)",
    borderWidth: 1,
    borderColor: "rgba(249,115,22,0.2)",
  },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  zapIcon: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 3,
  },
  title: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#C0B8E0" },
  value: { fontSize: 14, fontFamily: "Inter_600SemiBold" },

  track: {
    height: 8,
    borderRadius: 5,
    overflow: "hidden",
  },
  trackBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "rgba(42,38,64,0.5)",
  },
  fillWrap: { height: "100%", overflow: "hidden", borderRadius: 5 },
  shimmer: { position: "absolute", top: 0, bottom: 0, width: 50 },
  tip: {
    position: "absolute",
    right: 0,
    top: "50%",
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: -3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 5,
  },

  sub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#3A3458" },

  unlimitedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    overflow: "hidden",
  },
  unlimitedBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(59,143,255,0.3)",
  },
  unlimitedText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#AADCFF" },
});
