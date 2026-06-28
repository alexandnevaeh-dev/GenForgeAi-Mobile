import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

import { type JobStatus } from "@/components/JobStatusCard";

const PHASE_LABELS = ["", "Foundation", "World", "Characters", "Image Gen", "QA", "Export"];

function ActiveCrystal({ color }: { color: string }) {
  const pulse = useRef(new Animated.Value(0.5)).current;
  const ring = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(ring, { toValue: 1.5, duration: 1200, useNativeDriver: true }),
        Animated.timing(ring, { toValue: 0.8, duration: 0, useNativeDriver: true }),
      ])
    ).start();
  }, [pulse, ring]);

  return (
    <View style={[ac.wrap, { borderColor: color + "60" }]}>
      <Animated.View style={[ac.ring, { borderColor: color, transform: [{ scale: ring }], opacity: pulse }]} />
      <Animated.View style={[ac.core, { backgroundColor: color, shadowColor: color, opacity: pulse }]} />
    </View>
  );
}

interface PipelineTimelineProps {
  phase: number;
  status: JobStatus;
}

export function PipelineTimeline({ phase, status }: PipelineTimelineProps) {
  const isTerminal = status === "completed" || status === "failed" || status === "cancelled";

  return (
    <View style={styles.wrap}>
      {[1, 2, 3, 4, 5, 6].map((ph, idx) => {
        const isDone = ph < phase || (isTerminal && status === "completed");
        const isActive = ph === phase && !isTerminal && status === "running";
        const isPending = !isDone && !isActive;

        const nodeColor = isDone ? "#22C55E" : isActive ? "#2B7FFF" : "#2A2448";

        return (
          <View key={ph} style={styles.step}>
            {/* Connector line before node */}
            {idx > 0 && (
              <View style={styles.connectorWrap}>
                <View style={styles.connectorBg} />
                {isDone && (
                  <LinearGradient
                    colors={["#22C55E88", "#22C55E44"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                  />
                )}
                {isActive && (
                  <LinearGradient
                    colors={["#2B7FFF44", "#2B7FFF22"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={StyleSheet.absoluteFill}
                  />
                )}
              </View>
            )}

            {/* Node */}
            <View style={styles.nodeWrap}>
              {isActive ? (
                <ActiveCrystal color="#2B7FFF" />
              ) : isDone ? (
                <View style={[styles.doneNode, { borderColor: "#22C55E60" }]}>
                  <View style={[styles.doneCore, { backgroundColor: "#22C55E", shadowColor: "#22C55E" }]} />
                </View>
              ) : (
                <View style={[styles.pendingNode, { backgroundColor: nodeColor }]} />
              )}
            </View>

            {/* Label */}
            <Text
              style={[
                styles.label,
                { color: isDone ? "#22C55E88" : isActive ? "#5BA8FF" : "#2A2448" },
              ]}
              numberOfLines={1}
            >
              {PHASE_LABELS[ph]}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

const ac = StyleSheet.create({
  wrap: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  ring: {
    position: "absolute",
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: "#2B7FFF",
  },
  core: {
    width: 6,
    height: 6,
    borderRadius: 3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 5,
    elevation: 4,
  },
});

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 0,
  },
  step: {
    flex: 1,
    alignItems: "center",
    gap: 4,
    position: "relative",
  },
  connectorWrap: {
    position: "absolute",
    left: "-50%",
    right: "50%",
    top: 6,
    height: 2,
    overflow: "hidden",
    borderRadius: 1,
  },
  connectorBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(42,38,64,0.5)",
  },
  nodeWrap: {
    height: 14,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  doneNode: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  doneCore: {
    width: 6,
    height: 6,
    borderRadius: 3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 3,
  },
  pendingNode: {
    width: 8,
    height: 8,
    borderRadius: 4,
    opacity: 0.5,
  },
  label: {
    fontSize: 8,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
});
