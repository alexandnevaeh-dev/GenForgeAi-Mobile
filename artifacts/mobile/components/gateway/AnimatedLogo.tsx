import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";

interface AnimatedLogoProps {
  subtitle?: string;
}

export function AnimatedLogo({ subtitle = "AI-Powered Game Development Studio" }: AnimatedLogoProps) {
  const float = useRef(new Animated.Value(0)).current;
  const shimmerX = useRef(new Animated.Value(-120)).current;
  const iconPulse = useRef(new Animated.Value(0.7)).current;
  const ringRotate = useRef(new Animated.Value(0)).current;
  const mountAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(mountAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(float, { toValue: 1, duration: 3200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(float, { toValue: 0, duration: 3200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.delay(4000),
        Animated.timing(shimmerX, { toValue: 240, duration: 900, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(shimmerX, { toValue: -120, duration: 0, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(iconPulse, { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.timing(iconPulse, { toValue: 0.5, duration: 1400, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(ringRotate, { toValue: 1, duration: 6000, easing: Easing.linear, useNativeDriver: true })
    ).start();
  }, [float, shimmerX, iconPulse, ringRotate, mountAnim]);

  const translateY = float.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });
  const spin = ringRotate.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  return (
    <Animated.View style={[s.wrap, { opacity: mountAnim, transform: [{ translateY }] }]}>
      {/* Icon with rotating energy ring */}
      <View style={s.iconSection}>
        <Animated.View style={[s.ring, { transform: [{ rotate: spin }] }]} />
        <Animated.View style={[s.ringInner, { opacity: iconPulse }]} />
        <View style={s.iconBox}>
          <LinearGradient colors={["#1E4FBF", "#2B7FFF", "#3B8FFF"]} style={StyleSheet.absoluteFill} />
          <LinearGradient
            colors={["rgba(255,255,255,0.2)", "rgba(255,255,255,0)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={s.iconBorder} />
          <Animated.View style={{ opacity: iconPulse }}>
            <Feather name="cpu" size={28} color="#AADCFF" style={s.iconGlow} />
          </Animated.View>
        </View>
      </View>

      {/* Logo text with shimmer */}
      <View style={s.titleWrap}>
        <Text style={s.titleBase}>
          GenForge<Text style={s.titleAI}>AI</Text>
        </Text>
        <Animated.View
          style={[s.shimmer, { transform: [{ translateX: shimmerX }, { skewX: "-15deg" }] }]}
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

      <Text style={s.subtitle}>{subtitle}</Text>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  wrap: { alignItems: "center", gap: 10, paddingTop: 8, paddingBottom: 4 },
  iconSection: {
    width: 76,
    height: 76,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  ring: {
    position: "absolute",
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 1,
    borderColor: "rgba(59,143,255,0.35)",
    borderStyle: "dashed" as any,
  },
  ringInner: {
    position: "absolute",
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 1,
    borderColor: "rgba(59,143,255,0.2)",
    shadowColor: "#3B8FFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 4,
  },
  iconBox: {
    width: 54,
    height: 54,
    borderRadius: 16,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#3B8FFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 14,
    elevation: 8,
  },
  iconBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  iconGlow: {
    shadowColor: "#AADCFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 5,
  },
  titleWrap: { overflow: "hidden" },
  titleBase: {
    fontSize: 34,
    fontFamily: "Inter_700Bold",
    color: "#C0B8E0",
    letterSpacing: -0.5,
    textShadowColor: "rgba(140,120,255,0.3)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  titleAI: {
    color: "#3B8FFF",
    textShadowColor: "rgba(59,143,255,0.6)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  shimmer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 80,
  },
  subtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#3A3458",
    textAlign: "center",
    letterSpacing: 0.2,
  },
});
