import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";

interface ForgeHeaderProps {
  onMenuPress: () => void;
  onBellPress: () => void;
  unreadCount: number;
}

export function ForgeHeader({ onMenuPress, onBellPress, unreadCount }: ForgeHeaderProps) {
  const shimmerAnim = useRef(new Animated.Value(-120)).current;
  const bellScale = useRef(new Animated.Value(1)).current;
  const menuScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(4500),
        Animated.timing(shimmerAnim, {
          toValue: 220,
          duration: 800,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, { toValue: -120, duration: 0, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [shimmerAnim]);

  useEffect(() => {
    if (unreadCount > 0) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(bellScale, { toValue: 1.18, duration: 500, useNativeDriver: true }),
          Animated.timing(bellScale, { toValue: 1, duration: 500, useNativeDriver: true }),
          Animated.delay(2200),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
    bellScale.setValue(1);
    return undefined;
  }, [unreadCount, bellScale]);

  const handleMenuPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.spring(menuScale, { toValue: 0.88, useNativeDriver: true, tension: 80, friction: 6 }),
      Animated.spring(menuScale, { toValue: 1, useNativeDriver: true, tension: 60, friction: 10 }),
    ]).start();
    onMenuPress();
  };

  const handleBellPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onBellPress();
  };

  return (
    <View style={styles.row}>
      {/* Stone Menu Button */}
      <Animated.View style={{ transform: [{ scale: menuScale }] }}>
        <Pressable onPress={handleMenuPress} style={styles.menuBtn}>
          <LinearGradient colors={["#1E1B30", "#13111F"]} style={StyleSheet.absoluteFill} />
          <View style={styles.menuBtnBorder} />
          <Feather name="menu" size={20} color="#C8C4E0" />
        </Pressable>
      </Animated.View>

      {/* Metallic Logo with shimmer */}
      <View style={styles.logoArea}>
        <Text style={styles.logoBase}>
          GenForge<Text style={styles.logoAI}>AI</Text>
        </Text>
        <Animated.View
          style={[styles.shimmerLayer, { transform: [{ translateX: shimmerAnim }] }]}
          pointerEvents="none"
        >
          <LinearGradient
            colors={["rgba(255,255,255,0)", "rgba(255,255,255,0.22)", "rgba(255,255,255,0)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.shimmerGrad}
          />
        </Animated.View>
      </View>

      {/* Crystal Bell Button */}
      <Pressable onPress={handleBellPress} style={styles.bellBtn}>
        <LinearGradient colors={["#1E1B30", "#13111F"]} style={StyleSheet.absoluteFill} />
        <View style={[styles.menuBtnBorder, unreadCount > 0 && styles.bellBorderUnread]} />
        <Animated.View style={{ transform: [{ scale: bellScale }] }}>
          <Feather
            name="bell"
            size={20}
            color={unreadCount > 0 ? "#3B8FFF" : "#C8C4E0"}
            style={unreadCount > 0 ? styles.bellGlow : undefined}
          />
        </Animated.View>
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount > 9 ? "9+" : String(unreadCount)}</Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  menuBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowColor: "#3B8FFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  menuBtnBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#2A2640",
  },
  logoArea: {
    alignItems: "center",
    overflow: "hidden",
  },
  logoBase: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    color: "#D8D4F0",
    letterSpacing: -0.5,
    textShadowColor: "rgba(59,143,255,0.3)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  logoAI: {
    color: "#3B8FFF",
    textShadowColor: "rgba(59,143,255,0.8)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  shimmerLayer: {
    ...StyleSheet.absoluteFillObject,
    width: 80,
  },
  shimmerGrad: {
    flex: 1,
  },
  bellBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowColor: "#3B8FFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  bellBorderUnread: {
    borderColor: "#3B8FFF",
    borderWidth: 1.5,
  },
  bellGlow: {
    shadowColor: "#3B8FFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 10,
    elevation: 4,
  },
  badge: {
    position: "absolute",
    top: 6,
    right: 5,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#3B8FFF",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
});
