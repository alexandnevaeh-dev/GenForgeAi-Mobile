import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import React, { useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

interface PrefChipProps {
  label: string;
  active: boolean;
  accentColor?: string;
  onPress: () => void;
}

function PrefChip({ label, active, accentColor = "#2B7FFF", onPress }: PrefChipProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.spring(scale, { toValue: 0.88, useNativeDriver: true, tension: 100, friction: 6 }),
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 60, friction: 10 }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View style={[styles.chipWrap, active && { shadowColor: accentColor, shadowOpacity: 0.5, shadowRadius: 8 }, { transform: [{ scale }] }]}>
      <Pressable onPress={handlePress} style={styles.chipPress}>
        {active ? (
          <LinearGradient
            colors={[accentColor + "CC", accentColor]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        ) : (
          <LinearGradient colors={["#141228", "#0E0C1E"]} style={StyleSheet.absoluteFill} />
        )}
        <LinearGradient
          colors={["rgba(255,255,255,0.1)", "rgba(255,255,255,0)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.chipBorder, active && { borderColor: accentColor + "60" }]} />
        <Text style={[styles.chipLabel, active ? styles.chipLabelActive : styles.chipLabelInactive]}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

interface PrefChipPickerProps {
  sectionLabel: string;
  options: readonly string[];
  selected: string;
  onSelect: (value: string) => void;
  accentColor?: string;
}

export function PrefChipPicker({ sectionLabel, options, selected, onSelect, accentColor }: PrefChipPickerProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.sectionLabel}>{sectionLabel}</Text>
      <View style={styles.chipGrid}>
        {options.map((opt) => (
          <PrefChip
            key={opt}
            label={opt}
            active={selected === opt}
            accentColor={accentColor}
            onPress={() => onSelect(opt)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  sectionLabel: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.2,
    color: "#3A3458",
  },
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 7 },
  chipWrap: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  chipPress: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 9,
    overflow: "hidden",
  },
  chipBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "rgba(42,38,64,0.7)",
  },
  chipLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  chipLabelActive: { color: "#FFFFFF" },
  chipLabelInactive: { color: "#3A3458" },
});
