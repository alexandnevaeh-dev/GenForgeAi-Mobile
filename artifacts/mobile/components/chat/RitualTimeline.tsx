import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";

const PANEL_HEIGHT = 268;

interface TaskStep {
  id: string;
  label: string;
  done: boolean;
}

function RuneNode({ done, active }: { done: boolean; active: boolean }) {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (active) {
      const anim = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.5, duration: 600, useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 1, duration: 600, useNativeDriver: true }),
        ])
      );
      anim.start();
      return () => anim.stop();
    }
    pulse.setValue(1);
    return undefined;
  }, [active, pulse]);

  const color = done ? "#10B981" : active ? "#3B8FFF" : "#2A2640";
  const glowColor = done ? "#10B981" : active ? "#3B8FFF" : "transparent";

  return (
    <View style={rune.wrap}>
      {/* Glow halo */}
      <Animated.View
        style={[
          rune.halo,
          { backgroundColor: glowColor + "33", transform: [{ scale: pulse }] },
        ]}
      />
      {/* Diamond crystal */}
      <Animated.View
        style={[
          rune.diamond,
          {
            backgroundColor: color,
            shadowColor: glowColor,
            shadowOpacity: active || done ? 0.9 : 0,
            shadowRadius: active ? 8 : 4,
            transform: [{ rotate: "45deg" }],
          },
        ]}
      />
      {/* Check for done */}
      {done && (
        <Text style={rune.checkmark}>✓</Text>
      )}
    </View>
  );
}

interface Props {
  steps: TaskStep[];
  visible: boolean;
}

export function RitualTimeline({ steps, visible }: Props) {
  const expandAnim = useRef(new Animated.Value(0)).current;
  const activeIdx = steps.findIndex((s) => !s.done);

  useEffect(() => {
    Animated.timing(expandAnim, {
      toValue: visible ? 1 : 0,
      duration: 280,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: false,
    }).start();
  }, [visible, expandAnim]);

  const panelHeight = expandAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, PANEL_HEIGHT],
  });
  const panelOpacity = expandAnim.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0, 0, 1],
  });

  return (
    <Animated.View style={[styles.outer, { height: panelHeight, opacity: panelOpacity }]}>
      <View style={styles.panel}>
        <LinearGradient
          colors={["#0C0A1E", "#0E0C20", "#0A0818"]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.panelBorder} />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerRune}>᛭</Text>
          <Text style={styles.headerTitle}>AI RITUAL PROGRESS</Text>
        </View>

        {/* Steps */}
        <View style={styles.steps}>
          {steps.map((step, i) => {
            const isActive = i === activeIdx;
            const lineColor = step.done ? "#10B981" : "#1A1840";
            return (
              <View key={step.id} style={styles.stepRow}>
                {/* Rune node column */}
                <View style={styles.nodeCol}>
                  <RuneNode done={step.done} active={isActive} />
                  {i < steps.length - 1 && (
                    <View style={[styles.connector, { backgroundColor: lineColor }]}>
                      {step.done && (
                        <LinearGradient
                          colors={["#10B981", "#3B8FFF"]}
                          style={StyleSheet.absoluteFill}
                        />
                      )}
                    </View>
                  )}
                </View>
                {/* Label */}
                <Text
                  style={[
                    styles.stepLabel,
                    step.done && styles.stepDone,
                    isActive && styles.stepActive,
                  ]}
                >
                  {step.label}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </Animated.View>
  );
}

const rune = StyleSheet.create({
  wrap: {
    width: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  halo: {
    position: "absolute",
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  diamond: {
    width: 10,
    height: 10,
    borderRadius: 2,
    shadowOffset: { width: 0, height: 0 },
    elevation: 3,
  },
  checkmark: {
    position: "absolute",
    fontSize: 7,
    color: "#fff",
    fontFamily: "Inter_700Bold",
    lineHeight: 10,
  },
});

const styles = StyleSheet.create({
  outer: {
    overflow: "hidden",
    paddingHorizontal: 16,
  },
  panel: {
    borderRadius: 16,
    overflow: "hidden",
    padding: 14,
    marginTop: 8,
    shadowColor: "#3B8FFF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  panelBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(42,38,64,0.9)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 12,
  },
  headerRune: {
    fontSize: 14,
    color: "#3B8FFF",
    textShadowColor: "#3B8FFF",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
  },
  headerTitle: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
    color: "#4A4468",
    letterSpacing: 1.4,
  },
  steps: {
    gap: 0,
  },
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    minHeight: 32,
  },
  nodeCol: {
    alignItems: "center",
    width: 18,
  },
  connector: {
    width: 2,
    flex: 1,
    minHeight: 14,
    borderRadius: 1,
    overflow: "hidden",
  },
  stepLabel: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: "#3A3458",
    flex: 1,
    paddingTop: 2,
    lineHeight: 18,
  },
  stepDone: {
    color: "#10B981",
    fontFamily: "Inter_500Medium",
  },
  stepActive: {
    color: "#5BA8FF",
    fontFamily: "Inter_600SemiBold",
  },
});
