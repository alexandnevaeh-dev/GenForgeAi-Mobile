import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

interface ScrollTemplateCardProps {
  title: string;
  genre: string;
  badge: string;
}

export function ScrollTemplateCard({ title, genre, badge }: ScrollTemplateCardProps) {
  const scale = useRef(new Animated.Value(1)).current;
  const isFree = badge === "FREE";

  return (
    <Animated.View style={[styles.wrap, { transform: [{ scale }] }]}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.push("/marketplace");
        }}
        onPressIn={() => Animated.spring(scale, { toValue: 0.95, useNativeDriver: true, tension: 80, friction: 6 }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 60, friction: 10 }).start()}
        style={styles.pressable}
      >
        <LinearGradient
          colors={["#1A1210", "#150F0C", "#1E1610"]}
          style={StyleSheet.absoluteFill}
        />
        {/* Amber glow border */}
        <View style={styles.borderLayer} />

        {/* Scroll art placeholder */}
        <View style={styles.artArea}>
          <LinearGradient
            colors={["#2A1E0A", "#1E160A"]}
            style={StyleSheet.absoluteFill}
          />
          <Feather name="book-open" size={24} color="#C8922A" style={styles.scrollIcon} />
        </View>

        <Text style={styles.title} numberOfLines={2}>{title}</Text>

        <View style={styles.footer}>
          <Text style={styles.genre} numberOfLines={1}>{genre}</Text>
          <View style={[styles.badgePill, { backgroundColor: isFree ? "rgba(16,185,129,0.15)" : "rgba(255,179,71,0.15)" }]}>
            <Text style={[styles.badgeText, { color: isFree ? "#10B981" : "#FFB347" }]}>{badge}</Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginRight: 12,
    shadowColor: "#C8922A",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  pressable: {
    width: 136,
    borderRadius: 16,
    overflow: "hidden",
    gap: 10,
    padding: 12,
  },
  borderLayer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#6B420A",
  },
  artArea: {
    width: "100%",
    height: 70,
    borderRadius: 10,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollIcon: {
    shadowColor: "#C8922A",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "#D4B896",
    lineHeight: 18,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  genre: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    color: "#8B7055",
    flex: 1,
  },
  badgePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
  },
});
