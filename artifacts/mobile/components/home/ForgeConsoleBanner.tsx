import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";

interface ForgeConsoleBannerProps {
  title: string;
  progress: number;
  onPress: () => void;
}

export function ForgeConsoleBanner({ title, progress, onPress }: ForgeConsoleBannerProps) {
  const dotPulse = useRef(new Animated.Value(1)).current;
  const shimmerAnim = useRef(new Animated.Value(-80)).current;
  const arrowAnim = useRef(new Animated.Value(0)).current;
  const borderGlow = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const dot = Animated.loop(
      Animated.sequence([
        Animated.timing(dotPulse, { toValue: 1.6, duration: 500, useNativeDriver: true }),
        Animated.timing(dotPulse, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    );
    const shimmer = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 400, duration: 1800, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(shimmerAnim, { toValue: -80, duration: 0, useNativeDriver: true }),
        Animated.delay(600),
      ])
    );
    const arrow = Animated.loop(
      Animated.sequence([
        Animated.timing(arrowAnim, { toValue: 1, duration: 550, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(arrowAnim, { toValue: 0, duration: 450, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.delay(1200),
      ])
    );
    const glow = Animated.loop(
      Animated.sequence([
        Animated.timing(borderGlow, { toValue: 1, duration: 1200, useNativeDriver: false }),
        Animated.timing(borderGlow, { toValue: 0.5, duration: 1200, useNativeDriver: false }),
      ])
    );
    dot.start();
    shimmer.start();
    arrow.start();
    glow.start();
    return () => { dot.stop(); shimmer.stop(); arrow.stop(); glow.stop(); };
  }, [dotPulse, shimmerAnim, arrowAnim, borderGlow]);

  const arrowX = arrowAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 7] });
  const glowBorder = borderGlow.interpolate({ inputRange: [0, 1], outputRange: ["rgba(59,143,255,0.45)", "rgba(59,143,255,1)"] });

  return (
    <Pressable onPress={onPress}>
      <Animated.View style={[styles.outer, { borderColor: glowBorder }]}>
        <LinearGradient
          colors={["#0F1428", "#131030", "#0D0B1E"]}
          style={StyleSheet.absoluteFill}
        />
        {/* Top: GENERATING chip + title */}
        <View style={styles.topRow}>
          <View style={styles.chip}>
            <LinearGradient
              colors={["#1A3A6A", "#2B5FBF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            <Animated.View style={[styles.chipDot, { transform: [{ scale: dotPulse }] }]} />
            <Text style={styles.chipText}>GENERATING</Text>
          </View>
          <Text style={styles.projectTitle} numberOfLines={1}>{title}</Text>
        </View>

        {/* Energy beam progress bar */}
        <View style={styles.beamTrack}>
          <LinearGradient
            colors={["#1A1A3E", "#1E1E40"]}
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.beamFill, { width: `${progress}%` as any }]}>
            <LinearGradient
              colors={["#2B7FFF", "#5B4FFF", "#9B4BFF"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            {/* Moving shimmer on fill */}
            <Animated.View
              style={[styles.beamShimmer, { transform: [{ translateX: shimmerAnim }] }]}
              pointerEvents="none"
            >
              <LinearGradient
                colors={["rgba(255,255,255,0)", "rgba(255,255,255,0.5)", "rgba(255,255,255,0)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{ flex: 1 }}
              />
            </Animated.View>
          </View>
          {/* Glow tip */}
          <View style={[styles.beamTip, { left: `${Math.min(progress, 98)}%` as any }]} />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.pct}>{progress}% complete</Text>
          <View style={styles.tapRow}>
            <Text style={styles.tapLabel}>View details</Text>
            <Animated.Text style={[styles.tapArrow, { transform: [{ translateX: arrowX }] }]}>→</Animated.Text>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderRadius: 18,
    borderWidth: 1.5,
    overflow: "hidden",
    padding: 16,
    gap: 12,
    shadowColor: "#3B8FFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  topRow: {
    gap: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    overflow: "hidden",
  },
  chipDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#7BDBFF",
    shadowColor: "#7BDBFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
  },
  chipText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    color: "#A8D4FF",
    letterSpacing: 1.2,
  },
  projectTitle: {
    fontSize: 19,
    fontFamily: "Inter_700Bold",
    color: "#E8E6F0",
    letterSpacing: -0.3,
  },
  beamTrack: {
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    shadowColor: "#3B8FFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 4,
  },
  beamFill: {
    height: "100%",
    borderRadius: 4,
    overflow: "hidden",
  },
  beamShimmer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 60,
  },
  beamTip: {
    position: "absolute",
    top: -2,
    bottom: -2,
    width: 4,
    borderRadius: 2,
    backgroundColor: "#AADCFF",
    shadowColor: "#AADCFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 4,
    marginLeft: -2,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pct: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "#5BA8FF",
  },
  tapRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  tapLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: "#7B7890",
  },
  tapArrow: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#5BA8FF",
  },
});
