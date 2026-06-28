import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text } from "react-native";

type FeatherIconName = React.ComponentProps<typeof Feather>["name"];

interface ForgeQuickActionProps {
  icon: FeatherIconName;
  label: string;
  onPress: () => void;
  gradientColors: [string, string, string];
  glowColor: string;
  floatDelay?: number;
}

export function ForgeQuickAction({
  icon,
  label,
  onPress,
  gradientColors,
  glowColor,
  floatDelay = 0,
}: ForgeQuickActionProps) {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const pressScale = useRef(new Animated.Value(1)).current;
  const pressGlow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(floatDelay),
        Animated.timing(floatAnim, {
          toValue: -5,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1400,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [floatAnim, floatDelay]);

  const handlePressIn = () => {
    Animated.parallel([
      Animated.spring(pressScale, { toValue: 0.88, useNativeDriver: true, tension: 80, friction: 6 }),
      Animated.timing(pressGlow, { toValue: 1, duration: 100, useNativeDriver: false }),
    ]).start();
  };
  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(pressScale, { toValue: 1, useNativeDriver: true, tension: 60, friction: 10 }),
      Animated.timing(pressGlow, { toValue: 0, duration: 200, useNativeDriver: false }),
    ]).start();
  };
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  const shadowOpacity = pressGlow.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.8] });

  return (
    <Animated.View
      style={[
        styles.wrap,
        {
          transform: [{ translateY: floatAnim }, { scale: pressScale }],
          shadowColor: glowColor,
          shadowOpacity: shadowOpacity as any,
        },
      ]}
    >
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={styles.pressable}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradient}
        >
          {/* Crystal facet overlay */}
          <LinearGradient
            colors={["rgba(255,255,255,0.18)", "rgba(255,255,255,0)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.facet}
          />
          <Feather name={icon} size={22} color="rgba(255,255,255,0.95)" />
        </LinearGradient>
        <Text style={styles.label} numberOfLines={1}>{label}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 14,
    elevation: 8,
  },
  pressable: {
    width: 84,
    alignItems: "center",
    gap: 8,
  },
  gradient: {
    width: 64,
    height: 64,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  facet: {
    ...StyleSheet.absoluteFillObject,
  },
  label: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: "#C8C4E0",
    textAlign: "center",
    letterSpacing: 0.2,
  },
});
