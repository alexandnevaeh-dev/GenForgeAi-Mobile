import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

export function GuildNoticeBoard() {
  const pinPulse = useRef(new Animated.Value(1)).current;
  const portalScale = useRef(new Animated.Value(1)).current;
  const portalGlow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pinPulse, { toValue: 1.3, duration: 800, useNativeDriver: true }),
        Animated.timing(pinPulse, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.delay(1600),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, [pinPulse]);

  const handleViewAll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.parallel([
        Animated.spring(portalScale, { toValue: 0.92, useNativeDriver: true, tension: 80, friction: 6 }),
        Animated.timing(portalGlow, { toValue: 1, duration: 150, useNativeDriver: false }),
      ]),
      Animated.parallel([
        Animated.spring(portalScale, { toValue: 1, useNativeDriver: true, tension: 60, friction: 10 }),
        Animated.timing(portalGlow, { toValue: 0, duration: 300, useNativeDriver: false }),
      ]),
    ]).start(() => router.push("/community"));
  };

  const portalBorder = portalGlow.interpolate({ inputRange: [0, 1], outputRange: ["rgba(59,143,255,0.3)", "rgba(59,143,255,1)"] });

  return (
    <View style={styles.outer}>
      <LinearGradient
        colors={["#18120A", "#140F08", "#1A1308"]}
        style={StyleSheet.absoluteFill}
      />
      {/* Wood frame border */}
      <View style={styles.woodFrame} />
      {/* Inner parchment border */}
      <View style={styles.innerFrame} />

      {/* Glowing pin */}
      <View style={styles.pinArea}>
        <Animated.View style={[styles.pinGlow, { transform: [{ scale: pinPulse }] }]} />
        <View style={styles.pin} />
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Feather name="users" size={15} color="#C8922A" />
          <Text style={styles.title}>Guild Notice Board</Text>
        </View>
        <Text style={styles.body}>
          2,341 forge-masters are building games right now.{"\n"}
          <Text style={styles.highlight}>"Dark Fantasy Starter"</Text> is trending this week.
        </Text>
        <Animated.View style={{ transform: [{ scale: portalScale }] }}>
          <Pressable onPress={handleViewAll}>
            <Animated.View style={[styles.portalBtn, { borderColor: portalBorder }]}>
              <LinearGradient
                colors={["rgba(59,143,255,0.12)", "rgba(59,143,255,0.06)"]}
                style={StyleSheet.absoluteFill}
              />
              <Feather name="globe" size={13} color="#5BA8FF" />
              <Text style={styles.portalText}>View Community</Text>
              <Feather name="chevron-right" size={13} color="#5BA8FF" />
            </Animated.View>
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#8B6030",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 8,
  },
  woodFrame: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    borderWidth: 2.5,
    borderColor: "#6B420A",
  },
  innerFrame: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
    margin: 4,
    borderWidth: 1,
    borderColor: "#4A2E06",
  },
  pinArea: {
    position: "absolute",
    top: 12,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
  },
  pinGlow: {
    position: "absolute",
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(255,179,71,0.4)",
    shadowColor: "#FFB347",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
  pin: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#FFB347",
    shadowColor: "#FFB347",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 4,
  },
  content: {
    padding: 18,
    paddingTop: 24,
    gap: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#D4B060",
  },
  body: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#8B7055",
    lineHeight: 20,
  },
  highlight: {
    color: "#C8922A",
    fontFamily: "Inter_600SemiBold",
  },
  portalBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    overflow: "hidden",
    alignSelf: "flex-start",
  },
  portalText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "#5BA8FF",
    flex: 1,
  },
});
