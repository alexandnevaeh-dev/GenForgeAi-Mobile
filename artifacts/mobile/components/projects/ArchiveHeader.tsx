import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

type ViewMode = "list" | "grid";

interface ArchiveHeaderProps {
  viewMode: ViewMode;
  onToggleView: (mode: ViewMode) => void;
  onCreatePress: () => void;
}

const SLIDE_WIDTH = 36;

function ShimmerTitle() {
  const shimmerX = useRef(new Animated.Value(-60)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(3500),
        Animated.timing(shimmerX, { toValue: 160, duration: 800, useNativeDriver: true }),
        Animated.timing(shimmerX, { toValue: -60, duration: 0, useNativeDriver: true }),
      ])
    ).start();
  }, [shimmerX]);
  return (
    <View style={title.wrap}>
      <Text style={title.text}>Projects</Text>
      <Animated.View style={[title.shimmer, { transform: [{ translateX: shimmerX }] }]} pointerEvents="none">
        <LinearGradient
          colors={["rgba(255,255,255,0)", "rgba(255,255,255,0.5)", "rgba(255,255,255,0)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
    </View>
  );
}

function CrystalViewToggle({ viewMode, onToggle }: { viewMode: ViewMode; onToggle: (m: ViewMode) => void }) {
  const slideX = useRef(new Animated.Value(viewMode === "list" ? 0 : SLIDE_WIDTH)).current;
  useEffect(() => {
    Animated.spring(slideX, {
      toValue: viewMode === "list" ? 0 : SLIDE_WIDTH,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
  }, [viewMode, slideX]);

  return (
    <View style={toggle.wrap}>
      <LinearGradient colors={["#0E0C1E", "#0C0A1A"]} style={StyleSheet.absoluteFill} />
      <View style={toggle.border} />
      {/* Sliding crystal indicator */}
      <Animated.View style={[toggle.indicator, { transform: [{ translateX: slideX }] }]}>
        <LinearGradient colors={["#1A3A8A", "#2B5FBF"]} style={StyleSheet.absoluteFill} />
        <View style={toggle.indicatorBorder} />
      </Animated.View>
      {/* Buttons */}
      {(["list", "grid"] as ViewMode[]).map((mode) => (
        <Pressable
          key={mode}
          onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onToggle(mode); }}
          style={toggle.btn}
        >
          <Feather
            name={mode === "list" ? "list" : "grid"}
            size={15}
            color={viewMode === mode ? "#7BDBFF" : "#3A3458"}
          />
        </Pressable>
      ))}
    </View>
  );
}

function PulsingCreateBtn({ onPress }: { onPress: () => void }) {
  const pulse = useRef(new Animated.Value(1)).current;
  const ripple = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.07, duration: 1200, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 1200, useNativeDriver: true }),
      ])
    ).start();
  }, [pulse]);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    ripple.setValue(0);
    Animated.timing(ripple, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    onPress();
  };

  const rippleScale = ripple.interpolate({ inputRange: [0, 1], outputRange: [1, 2.4] });
  const rippleOpacity = ripple.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.5, 0.2, 0] });

  return (
    <Animated.View style={[btn.wrap, { transform: [{ scale: pulse }] }]}>
      {/* Ripple */}
      <Animated.View
        style={[
          btn.ripple,
          { transform: [{ scale: rippleScale }], opacity: rippleOpacity },
        ]}
        pointerEvents="none"
      />
      <Pressable onPress={handlePress} style={btn.pressable}>
        <LinearGradient
          colors={["#2B7FFF", "#4B3FFF"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {/* Crystal facet */}
        <LinearGradient
          colors={["rgba(255,255,255,0.25)", "rgba(255,255,255,0)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <Feather name="plus" size={18} color="#fff" style={btn.iconGlow} />
      </Pressable>
    </Animated.View>
  );
}

export function ArchiveHeader({ viewMode, onToggleView, onCreatePress }: ArchiveHeaderProps) {
  return (
    <View style={header.row}>
      <ShimmerTitle />
      <View style={header.actions}>
        <CrystalViewToggle viewMode={viewMode} onToggle={onToggleView} />
        <PulsingCreateBtn onPress={onCreatePress} />
      </View>
    </View>
  );
}

const title = StyleSheet.create({
  wrap: { overflow: "hidden" },
  text: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: "#C0B8E0",
    letterSpacing: -0.3,
    textShadowColor: "rgba(140,120,255,0.3)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  shimmer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 60,
    transform: [{ skewX: "-15deg" }],
  },
});

const toggle = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    borderRadius: 12,
    padding: 3,
    overflow: "hidden",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(42,38,64,0.8)",
  },
  indicator: {
    position: "absolute",
    left: 3,
    top: 3,
    bottom: 3,
    width: SLIDE_WIDTH - 2,
    borderRadius: 9,
    overflow: "hidden",
    shadowColor: "#3B8FFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 3,
  },
  indicatorBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "rgba(59,143,255,0.5)",
  },
  btn: {
    width: SLIDE_WIDTH,
    height: 30,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
});

const btn = StyleSheet.create({
  wrap: {
    shadowColor: "#3B8FFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 5,
  },
  ripple: {
    position: "absolute",
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#3B8FFF",
  },
  pressable: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  iconGlow: {
    shadowColor: "#fff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7,
    shadowRadius: 4,
    elevation: 3,
  },
});

const header = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
