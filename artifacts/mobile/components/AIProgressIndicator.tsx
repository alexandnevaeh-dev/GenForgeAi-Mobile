import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

import { GenerationStep } from "@/context/ProjectsContext";
import { useColors } from "@/hooks/useColors";

interface Props {
  steps: GenerationStep[];
}

function StepRow({ step }: { step: GenerationStep }) {
  const colors = useColors();
  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    if (step.status === "active") {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 0.4, duration: 700, useNativeDriver: true }),
        ])
      );
      anim.start();
      return () => anim.stop();
    } else {
      pulse.setValue(step.status === "done" ? 1 : 0.3);
    }
  }, [step.status, pulse]);

  const dotColor =
    step.status === "done"
      ? colors.success
      : step.status === "active"
      ? colors.primary
      : colors.border;

  const textColor =
    step.status === "done"
      ? colors.foreground
      : step.status === "active"
      ? colors.primary
      : colors.mutedForeground;

  return (
    <View style={styles.row}>
      <Animated.View
        style={[styles.dot, { backgroundColor: dotColor, opacity: pulse }]}
      />
      <Text style={[styles.label, { color: textColor, fontFamily: step.status === "active" ? "Inter_600SemiBold" : "Inter_400Regular" }]}>
        {step.status === "done" ? "✓ " : step.status === "active" ? "" : "  "}
        {step.label}
      </Text>
    </View>
  );
}

export function AIProgressIndicator({ steps }: Props) {
  const colors = useColors();
  return (
    <View style={[styles.container, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.heading, { color: colors.mutedForeground }]}>AI AGENTS</Text>
      {steps.map((step) => (
        <StepRow key={step.id} step={step} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  heading: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.2,
    marginBottom: 4,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  label: {
    fontSize: 14,
  },
});
