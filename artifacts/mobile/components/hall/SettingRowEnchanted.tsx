import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

// ── Crystal Switch ──────────────────────────────────────────────────────────
function CrystalSwitch({
  value,
  onValueChange,
}: {
  value: boolean;
  onValueChange?: (v: boolean) => void;
}) {
  const slide = useRef(new Animated.Value(value ? 1 : 0)).current;
  const glowOpacity = useRef(new Animated.Value(value ? 0.6 : 0)).current;

  useEffect(() => {
    Animated.spring(slide, {
      toValue: value ? 1 : 0,
      useNativeDriver: true,
      tension: 70,
      friction: 8,
    }).start();
    Animated.timing(glowOpacity, {
      toValue: value ? 0.6 : 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [value, slide, glowOpacity]);

  const thumbX = slide.interpolate({ inputRange: [0, 1], outputRange: [2, 22] });

  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onValueChange?.(!value);
      }}
      style={sw.track}
      hitSlop={6}
    >
      {/* Track */}
      <View style={sw.trackBg} />
      <Animated.View style={[sw.trackOn, { opacity: slide }]}>
        <LinearGradient colors={["#1A3A8A", "#2B7FFF"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={StyleSheet.absoluteFill} />
      </Animated.View>
      {/* Track border */}
      <Animated.View style={[sw.trackBorder, { borderColor: slide.interpolate({ inputRange: [0, 1], outputRange: ["rgba(42,38,64,0.8)", "rgba(59,143,255,0.5)"] }) }]} />
      {/* Glow ring */}
      <Animated.View style={[sw.glow, { opacity: glowOpacity }]} />
      {/* Thumb */}
      <Animated.View style={[sw.thumb, { transform: [{ translateX: thumbX }] }]}>
        <LinearGradient colors={["#FFFFFF", "#D0E8FF"]} style={sw.thumbGrad} />
        <Animated.View style={[sw.thumbGlowDot, { backgroundColor: slide.interpolate({ inputRange: [0, 1], outputRange: ["#AAAAAA", "#2B7FFF"] }), opacity: slide }]} />
      </Animated.View>
    </Pressable>
  );
}

const sw = StyleSheet.create({
  track: {
    width: 46,
    height: 26,
    borderRadius: 13,
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },
  trackBg: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 13,
    backgroundColor: "#0E0C1E",
  },
  trackOn: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 13,
  },
  trackBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 13,
    borderWidth: 1,
  },
  glow: {
    position: "absolute",
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: "#3B8FFF",
  },
  thumb: {
    position: "absolute",
    width: 22,
    height: 22,
    borderRadius: 11,
    top: 2,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  thumbGrad: { flex: 1 },
  thumbGlowDot: {
    position: "absolute",
    width: 8,
    height: 8,
    borderRadius: 4,
    top: "50%",
    left: "50%",
    marginTop: -4,
    marginLeft: -4,
    opacity: 0,
  },
});

// ── Setting Row ─────────────────────────────────────────────────────────────
interface SettingRowEnchantedProps {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
  toggle?: boolean;
  toggled?: boolean;
  onToggle?: (v: boolean) => void;
  badge?: string;
  last?: boolean;
}

export function SettingRowEnchanted({
  icon,
  label,
  value,
  onPress,
  danger,
  toggle,
  toggled,
  onToggle,
  badge,
  last,
}: SettingRowEnchantedProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (toggle || !onPress) return;
    Animated.spring(scale, { toValue: 0.98, useNativeDriver: true, tension: 100, friction: 8 }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 60, friction: 10 }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={toggle ? undefined : onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[s.row, !last && s.rowBorder]}
      >
        {/* Icon crystal */}
        <View style={[s.iconCrystal, danger && s.iconCrystalDanger]}>
          {!danger && <LinearGradient colors={["#141228", "#0E0C1E"]} style={StyleSheet.absoluteFill} />}
          {danger && <LinearGradient colors={["#2A0A0A", "#1A0808"]} style={StyleSheet.absoluteFill} />}
          <View style={[s.iconBorder, danger && s.iconBorderDanger]} />
          <Feather
            name={icon}
            size={16}
            color={danger ? "#EF4444" : "#5A5478"}
            style={danger ? s.dangerIconGlow : undefined}
          />
        </View>

        {/* Label */}
        <Text style={[s.label, danger && s.labelDanger]}>{label}</Text>

        {/* Right side */}
        <View style={s.right}>
          {badge && (
            <View style={[s.badge, danger && s.badgeDanger]}>
              <Text style={[s.badgeText, danger && s.badgeTextDanger]}>{badge}</Text>
            </View>
          )}
          {value ? <Text style={s.value}>{value}</Text> : null}
          {toggle ? (
            <CrystalSwitch value={toggled ?? false} onValueChange={onToggle} />
          ) : !danger ? (
            <Feather name="chevron-right" size={15} color="#2A2448" />
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  rowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "rgba(42,38,64,0.5)",
  },
  iconCrystal: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  iconCrystalDanger: {},
  iconBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "rgba(42,38,64,0.8)",
  },
  iconBorderDanger: { borderColor: "rgba(239,68,68,0.25)" },
  dangerIconGlow: {
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 3,
  },
  label: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular", color: "#C0B8E0" },
  labelDanger: { color: "#EF4444" },
  right: { flexDirection: "row", alignItems: "center", gap: 7 },
  value: { fontSize: 13, fontFamily: "Inter_400Regular", color: "#3A3458" },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: "rgba(34,197,94,0.15)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.3)",
  },
  badgeDanger: {
    backgroundColor: "rgba(249,115,22,0.15)",
    borderColor: "rgba(249,115,22,0.3)",
  },
  badgeText: { fontSize: 10, fontFamily: "Inter_600SemiBold", color: "#22C55E" },
  badgeTextDanger: { color: "#F97316" },
});
