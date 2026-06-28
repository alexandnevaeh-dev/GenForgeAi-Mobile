import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";

interface ChamberHeaderProps {
  paddingTop: number;
  showTimeline: boolean;
  onToggleTimeline: () => void;
  onClearChat: () => void;
}

function MGDAvatar() {
  const ringRotate = useRef(new Animated.Value(0)).current;
  const corePulse = useRef(new Animated.Value(0.7)).current;

  useEffect(() => {
    const ring = Animated.loop(
      Animated.timing(ringRotate, {
        toValue: 1,
        duration: 7000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    const core = Animated.loop(
      Animated.sequence([
        Animated.timing(corePulse, { toValue: 1, duration: 2200, useNativeDriver: true }),
        Animated.timing(corePulse, { toValue: 0.6, duration: 2200, useNativeDriver: true }),
      ])
    );
    ring.start();
    core.start();
    return () => { ring.stop(); core.stop(); };
  }, [ringRotate, corePulse]);

  const rotate = ringRotate.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  return (
    <View style={avatar.wrap}>
      {/* Outer glow */}
      <View style={avatar.outerGlow} />
      {/* Rotating energy ring */}
      <Animated.View style={[avatar.ring, { transform: [{ rotate }] }]} />
      {/* Core crystal */}
      <Animated.View style={[avatar.core, { opacity: corePulse }]}>
        <LinearGradient colors={["#1E3A8A", "#0A1A40"]} style={StyleSheet.absoluteFill} />
        <Feather name="cpu" size={16} color="#7BDBFF" style={avatar.cpuGlow} />
      </Animated.View>
    </View>
  );
}

function OnlineDot() {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.5, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.delay(1500),
      ])
    ).start();
  }, [pulse]);
  return (
    <View style={dot.wrap}>
      <Animated.View style={[dot.outer, { transform: [{ scale: pulse }] }]} />
      <View style={dot.inner} />
    </View>
  );
}

export function ChamberHeader({ paddingTop, showTimeline, onToggleTimeline, onClearChat }: ChamberHeaderProps) {
  const activityScale = useRef(new Animated.Value(1)).current;
  const clearScale = useRef(new Animated.Value(1)).current;

  const pressIn = (anim: Animated.Value) =>
    Animated.spring(anim, { toValue: 0.88, useNativeDriver: true, tension: 80, friction: 6 }).start();
  const pressOut = (anim: Animated.Value) =>
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 10 }).start();

  return (
    <View style={[header.outer, { paddingTop }]}>
      <LinearGradient
        colors={["rgba(11,9,20,0.98)", "rgba(11,9,20,0.85)", "rgba(11,9,20,0)"]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View style={header.divider} />

      <View style={header.row}>
        {/* Avatar + title */}
        <View style={header.left}>
          <MGDAvatar />
          <View style={header.titleBlock}>
            <Text style={header.title}>Master Game Director</Text>
            <View style={header.statusRow}>
              <OnlineDot />
              <Text style={header.statusText}>Online · Forge Ready</Text>
            </View>
          </View>
        </View>

        {/* Action buttons */}
        <View style={header.actions}>
          {/* Activity/Timeline toggle */}
          <Animated.View style={{ transform: [{ scale: activityScale }] }}>
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onToggleTimeline(); }}
              onPressIn={() => pressIn(activityScale)}
              onPressOut={() => pressOut(activityScale)}
              style={[header.btn, showTimeline && header.btnActive]}
            >
              {showTimeline && <LinearGradient colors={["#1A3A6A", "#0A2040"]} style={StyleSheet.absoluteFill} />}
              <View style={header.btnBorder} />
              <Feather
                name="activity"
                size={16}
                color={showTimeline ? "#5BA8FF" : "#4A4468"}
                style={showTimeline ? header.iconGlow : undefined}
              />
            </Pressable>
          </Animated.View>

          {/* Clear chat — rune button */}
          <Animated.View style={{ transform: [{ scale: clearScale }] }}>
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); onClearChat(); }}
              onPressIn={() => pressIn(clearScale)}
              onPressOut={() => pressOut(clearScale)}
              style={header.btn}
            >
              <LinearGradient colors={["#1A1028", "#110C1E"]} style={StyleSheet.absoluteFill} />
              <View style={header.btnBorder} />
              <Feather name="refresh-ccw" size={16} color="#4A4468" />
            </Pressable>
          </Animated.View>
        </View>
      </View>
    </View>
  );
}

const avatar = StyleSheet.create({
  wrap: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  outerGlow: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(59,143,255,0.12)",
    shadowColor: "#3B8FFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 4,
  },
  ring: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderTopColor: "transparent",
    borderLeftColor: "transparent",
    borderRightColor: "#3B8FFF",
    borderBottomColor: "#5BA8FF",
    shadowColor: "#3B8FFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  core: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(59,143,255,0.3)",
  },
  cpuGlow: {
    shadowColor: "#7BDBFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 8,
    elevation: 4,
  },
});

const dot = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center", width: 14, height: 14 },
  outer: {
    position: "absolute",
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "rgba(16,185,129,0.3)",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
    elevation: 2,
  },
  inner: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#10B981",
    shadowColor: "#10B981",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 3,
    elevation: 2,
  },
});

const header = StyleSheet.create({
  outer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    overflow: "hidden",
  },
  divider: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(42,38,64,0.5)",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  left: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  titleBlock: { gap: 2 },
  title: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#D0C8F0",
    letterSpacing: 0.1,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  statusText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "#10B981",
  },
  actions: {
    flexDirection: "row",
    gap: 8,
  },
  btn: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  btnActive: {
    shadowColor: "#3B8FFF",
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  btnBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: "rgba(42,38,64,0.8)",
  },
  iconGlow: {
    shadowColor: "#5BA8FF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 3,
  },
});
