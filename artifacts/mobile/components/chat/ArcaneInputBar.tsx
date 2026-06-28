import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

const AGENT_NODES = [
  { color: "#3B8FFF" },
  { color: "#9B4BFF" },
  { color: "#10B981" },
  { color: "#00E5FF" },
  { color: "#FFB347" },
  { color: "#DC2626" },
];

function AgentNode({ color, delay }: { color: string; delay: number }) {
  const pulse = useRef(new Animated.Value(0.6)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(pulse, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.5, duration: 800, useNativeDriver: true }),
      ])
    ).start();
  }, [pulse, delay]);
  return (
    <Animated.View
      style={[
        node.dot,
        {
          backgroundColor: color,
          opacity: pulse,
          shadowColor: color,
        },
      ]}
    />
  );
}

function ToolBtn({ icon, onPress }: { icon: React.ComponentProps<typeof Feather>["name"]; onPress?: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress?.(); }}
        onPressIn={() => Animated.spring(scale, { toValue: 0.85, useNativeDriver: true, tension: 80, friction: 6 }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 60, friction: 10 }).start()}
        style={tool.btn}
      >
        <LinearGradient colors={["#1A1628", "#110E1E"]} style={StyleSheet.absoluteFill} />
        <View style={tool.border} />
        <Feather name={icon} size={16} color="#5A5478" />
      </Pressable>
    </Animated.View>
  );
}

interface ArcaneInputBarProps {
  input: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  isTyping: boolean;
  onSubmitEditing: () => void;
  bottomPad: number;
}

export function ArcaneInputBar({
  input,
  onChangeText,
  onSend,
  isTyping,
  onSubmitEditing,
  bottomPad,
}: ArcaneInputBarProps) {
  const [focused, setFocused] = useState(false);
  const focusAnim = useRef(new Animated.Value(0)).current;
  const sendScale = useRef(new Animated.Value(1)).current;
  const canSend = input.trim().length > 0 && !isTyping;

  useEffect(() => {
    Animated.timing(focusAnim, {
      toValue: focused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [focused, focusAnim]);

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(42,38,64,0.8)", "rgba(59,143,255,0.7)"],
  });

  const handleSend = () => {
    if (!canSend) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.spring(sendScale, { toValue: 0.88, useNativeDriver: true, tension: 80, friction: 6 }),
      Animated.spring(sendScale, { toValue: 1, useNativeDriver: true, tension: 60, friction: 10 }),
    ]).start();
    onSend();
  };

  return (
    <View style={[bar.outer, { paddingBottom: bottomPad }]}>
      <LinearGradient
        colors={["rgba(11,9,20,0)", "rgba(11,9,20,0.96)", "rgba(11,9,20,1)"]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      <View style={bar.topDivider} />

      {/* Toolbar row */}
      <View style={bar.toolbar}>
        <ToolBtn icon="mic" />
        <ToolBtn icon="paperclip" />
        <ToolBtn icon="image" />
        <View style={{ flex: 1 }} />
        {/* Agent network nodes */}
        <View style={bar.agentRow}>
          {AGENT_NODES.map((n, i) => (
            <AgentNode key={i} color={n.color} delay={i * 200} />
          ))}
          <Text style={bar.agentCount}>23 ready</Text>
        </View>
      </View>

      {/* Input row */}
      <Animated.View style={[bar.inputWrap, { borderColor }]}>
        <LinearGradient
          colors={["#0E0C1E", "#0C0A1A"]}
          style={StyleSheet.absoluteFill}
        />
        <TextInput
          style={bar.input}
          placeholder="Describe your game to the Director..."
          placeholderTextColor="#2A2448"
          value={input}
          onChangeText={onChangeText}
          multiline
          maxLength={500}
          returnKeyType="send"
          onSubmitEditing={onSubmitEditing}
          blurOnSubmit={false}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {/* Send crystal button */}
        <Animated.View style={{ transform: [{ scale: sendScale }] }}>
          <Pressable
            onPress={handleSend}
            disabled={!canSend}
            style={bar.sendBtn}
          >
            {canSend ? (
              <LinearGradient
                colors={["#2B7FFF", "#4B3FFF"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
            ) : (
              <LinearGradient
                colors={["#1A1628", "#110E1E"]}
                style={StyleSheet.absoluteFill}
              />
            )}
            {/* Facet gloss */}
            {canSend && (
              <LinearGradient
                colors={["rgba(255,255,255,0.2)", "rgba(255,255,255,0)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
            )}
            <View style={bar.sendBorder} />
            <Feather
              name={isTyping ? "loader" : "send"}
              size={16}
              color={canSend ? "#fff" : "#2A2448"}
              style={canSend ? bar.sendIconGlow : undefined}
            />
          </Pressable>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const node = StyleSheet.create({
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 2,
  },
});

const tool = StyleSheet.create({
  btn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(42,38,64,0.8)",
  },
});

const bar = StyleSheet.create({
  outer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 8,
    overflow: "hidden",
  },
  topDivider: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: "rgba(42,38,64,0.5)",
  },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  agentRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  agentCount: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    color: "#3A3458",
    marginLeft: 3,
  },
  inputWrap: {
    flexDirection: "row",
    alignItems: "flex-end",
    borderRadius: 16,
    borderWidth: 1.5,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 6,
    gap: 8,
    overflow: "hidden",
    shadowColor: "#3B8FFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: "#C0B8E0",
    maxHeight: 100,
    paddingVertical: 4,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  sendBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
  },
  sendIconGlow: {
    shadowColor: "#7BDBFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 3,
  },
});
