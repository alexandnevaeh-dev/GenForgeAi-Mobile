import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

import { type JobStatus } from "@/components/JobStatusCard";

const STATUS_META: Record<
  JobStatus,
  { icon: React.ComponentProps<typeof Feather>["name"]; color: string; label: string }
> = {
  pending:   { icon: "clock",        color: "#F97316", label: "Queued"    },
  running:   { icon: "zap",          color: "#2B7FFF", label: "Running"   },
  completed: { icon: "check-circle", color: "#22C55E", label: "Complete"  },
  failed:    { icon: "alert-circle", color: "#EF4444", label: "Failed"    },
  cancelled: { icon: "x-circle",     color: "#6B6B80", label: "Cancelled" },
};

interface CrystalStatusBadgeProps {
  status: JobStatus;
}

export function CrystalStatusBadge({ status }: CrystalStatusBadgeProps) {
  const meta = STATUS_META[status] ?? STATUS_META.pending;
  const isActive = status === "pending" || status === "running";
  const glow = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    if (!isActive) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(glow, { toValue: 0.4, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [isActive, glow]);

  return (
    <View style={[styles.wrap, { borderColor: meta.color + "40" }]}>
      <LinearGradient colors={[meta.color + "18", meta.color + "08"]} style={StyleSheet.absoluteFill} />
      {isActive && (
        <Animated.View
          style={[styles.glowRing, { borderColor: meta.color, opacity: glow }]}
          pointerEvents="none"
        />
      )}
      <Feather name={meta.icon} size={11} color={meta.color} />
      <Text style={[styles.label, { color: meta.color }]}>{meta.label.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    overflow: "hidden",
  },
  glowRing: {
    position: "absolute",
    inset: 0,
    borderRadius: 8,
    borderWidth: 1,
  },
  label: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
});
