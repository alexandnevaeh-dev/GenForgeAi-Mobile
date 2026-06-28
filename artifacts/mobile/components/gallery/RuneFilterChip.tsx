import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import React, { useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

interface RuneFilterChipProps {
  label: string;
  icon: React.ComponentProps<typeof Feather>["name"];
  active: boolean;
  onPress: () => void;
}

export function RuneFilterChip({ label, icon, active, onPress }: RuneFilterChipProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.91, useNativeDriver: true, tension: 100, friction: 6 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 60, friction: 10 }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View
      style={[
        styles.wrap,
        active && styles.wrapActive,
        { transform: [{ scale }] },
      ]}
    >
      <Pressable onPress={handlePress} style={styles.pressable}>
        {active ? (
          <LinearGradient
            colors={["#1A3A8A", "#2B5FBF", "#3B8FFF"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        ) : (
          <LinearGradient colors={["#14111E", "#100E1A"]} style={StyleSheet.absoluteFill} />
        )}
        <View style={[styles.border, active && styles.borderActive]} />

        <Feather
          name={icon}
          size={13}
          color={active ? "#AADCFF" : "#3A3458"}
          style={active ? styles.iconGlow : undefined}
        />
        <Text style={[styles.label, active ? styles.labelActive : styles.labelInactive]}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginRight: 8,
    borderRadius: 22,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  wrapActive: {
    shadowColor: "#3B8FFF",
    shadowOpacity: 0.55,
    shadowRadius: 10,
    elevation: 6,
  },
  pressable: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 22,
    overflow: "hidden",
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(42,38,64,0.6)",
  },
  borderActive: {
    borderColor: "rgba(59,143,255,0.5)",
  },
  label: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  labelActive: { color: "#D0E8FF" },
  labelInactive: { color: "#3A3458" },
  iconGlow: {
    shadowColor: "#AADCFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
});
