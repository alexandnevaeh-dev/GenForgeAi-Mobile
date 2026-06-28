import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

interface StatItem {
  label: string;
  value: number;
  icon: React.ComponentProps<typeof Feather>["name"];
  color: string;
}

function StatCard({ item, delay }: { item: StatItem; delay: number }) {
  const mountAnim = useRef(new Animated.Value(0)).current;
  const iconGlow = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const t = setTimeout(() => {
      Animated.timing(mountAnim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
    }, delay);
    Animated.loop(
      Animated.sequence([
        Animated.timing(iconGlow, { toValue: 1, duration: 1400, useNativeDriver: true }),
        Animated.timing(iconGlow, { toValue: 0.35, duration: 1400, useNativeDriver: true }),
      ])
    ).start();
    return () => clearTimeout(t);
  }, [mountAnim, iconGlow, delay]);

  return (
    <Animated.View style={[styles.card, { opacity: mountAnim }]}>
      <LinearGradient colors={["#0E0C1E", "#0C0A1A"]} style={StyleSheet.absoluteFill} />
      <View style={styles.border} />

      {/* Icon crystal */}
      <View style={[styles.iconWrap, { borderColor: item.color + "40", backgroundColor: item.color + "12" }]}>
        <Animated.View style={{ opacity: iconGlow }}>
          <Feather name={item.icon} size={16} color={item.color} style={[styles.iconGlow, { shadowColor: item.color }]} />
        </Animated.View>
      </View>

      <Text style={styles.value}>{item.value.toLocaleString()}</Text>
      <Text style={styles.label}>{item.label}</Text>
    </Animated.View>
  );
}

interface StatCrystalGridProps {
  items: StatItem[];
}

export function StatCrystalGrid({ items }: StatCrystalGridProps) {
  return (
    <View style={styles.grid}>
      {items.map((item, i) => (
        <StatCard key={item.label} item={item} delay={i * 80} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  card: {
    width: "47%",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderRadius: 16,
    gap: 6,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(42,38,64,0.8)",
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  iconGlow: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 6,
    elevation: 4,
  },
  value: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: "#C0B8E0",
  },
  label: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: "#3A3458",
  },
});
