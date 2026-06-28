import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet } from "react-native";

interface MagicFABProps {
  onPress: () => void;
  bottom: number;
}

export function MagicFAB({ onPress, bottom }: MagicFABProps) {
  const pulse = useRef(new Animated.Value(1)).current;
  const ripple = useRef(new Animated.Value(0)).current;
  const pressScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.09, duration: 1100, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 1100, useNativeDriver: true }),
      ])
    ).start();
  }, [pulse]);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    ripple.setValue(0);
    Animated.timing(ripple, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    Animated.sequence([
      Animated.spring(pressScale, { toValue: 0.87, useNativeDriver: true, tension: 100, friction: 6 }),
      Animated.spring(pressScale, { toValue: 1, useNativeDriver: true, tension: 60, friction: 10 }),
    ]).start();
    onPress();
  };

  const rippleScale = ripple.interpolate({ inputRange: [0, 1], outputRange: [1, 2.6] });
  const rippleOpacity = ripple.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.5, 0.2, 0] });

  return (
    <Animated.View
      style={[
        styles.wrap,
        { bottom, transform: [{ scale: pressScale }] },
      ]}
    >
      {/* Pulse glow ring */}
      <Animated.View
        style={[styles.pulseRing, { transform: [{ scale: pulse }] }]}
        pointerEvents="none"
      />
      {/* Ripple ring */}
      <Animated.View
        style={[
          styles.rippleRing,
          { transform: [{ scale: rippleScale }], opacity: rippleOpacity },
        ]}
        pointerEvents="none"
      />
      <Pressable onPress={handlePress} style={styles.btn}>
        <LinearGradient
          colors={["#1E4FBF", "#2B7FFF", "#4B8FFF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {/* Crystal facet top-left */}
        <LinearGradient
          colors={["rgba(255,255,255,0.28)", "rgba(255,255,255,0)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Feather name="plus" size={22} color="#fff" style={styles.icon} />
      </Pressable>
    </Animated.View>
  );
}

const SIZE = 54;

const styles = StyleSheet.create({
  wrap: {
    position: "absolute",
    right: 20,
    width: SIZE,
    height: SIZE,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#3B8FFF",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55,
    shadowRadius: 16,
    elevation: 12,
  },
  pulseRing: {
    position: "absolute",
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: "rgba(59,143,255,0.18)",
    shadowColor: "#3B8FFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 6,
  },
  rippleRing: {
    position: "absolute",
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    backgroundColor: "#3B8FFF",
  },
  btn: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  icon: {
    shadowColor: "#fff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 3,
  },
});
