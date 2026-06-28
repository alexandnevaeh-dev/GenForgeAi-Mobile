import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

import { ChatMessage as ChatMessageType } from "@/context/ChatContext";

interface Props {
  message: ChatMessageType;
}

const ORB_COLORS = ["#3B8FFF", "#9B4BFF", "#00E5FF"] as const;

function TypingOrbs() {
  const orbs = useRef([
    new Animated.Value(0),
    new Animated.Value(0),
    new Animated.Value(0),
  ]).current;

  useEffect(() => {
    const anims = orbs.map((orb, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 180),
          Animated.timing(orb, { toValue: -7, duration: 380, useNativeDriver: true }),
          Animated.timing(orb, { toValue: 0, duration: 380, useNativeDriver: true }),
          Animated.delay(600),
        ])
      )
    );
    anims.forEach((a) => a.start());
    return () => anims.forEach((a) => a.stop());
  }, []);

  return (
    <View style={s.orbsRow}>
      {orbs.map((orb, i) => (
        <Animated.View
          key={i}
          style={[
            s.orb,
            {
              backgroundColor: ORB_COLORS[i],
              shadowColor: ORB_COLORS[i],
              transform: [{ translateY: orb }],
            },
          ]}
        />
      ))}
    </View>
  );
}

function StreamingShimmer() {
  const shimmer = useRef(new Animated.Value(-80)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, { toValue: 260, duration: 1400, useNativeDriver: true }),
        Animated.timing(shimmer, { toValue: -80, duration: 0, useNativeDriver: true }),
        Animated.delay(300),
      ])
    ).start();
  }, [shimmer]);
  return (
    <Animated.View
      style={[s.shimmerLayer, { transform: [{ translateX: shimmer }] }]}
      pointerEvents="none"
    >
      <LinearGradient
        colors={["rgba(255,255,255,0)", "rgba(255,255,255,0.07)", "rgba(255,255,255,0)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ flex: 1 }}
      />
    </Animated.View>
  );
}

function AIAvatar() {
  const pulse = useRef(new Animated.Value(0.8)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.7, duration: 1800, useNativeDriver: true }),
      ])
    ).start();
  }, [pulse]);
  return (
    <Animated.View style={[s.avatar, { opacity: pulse }]}>
      <LinearGradient colors={["#1E3A8A", "#0A1A40"]} style={StyleSheet.absoluteFill} />
      <View style={s.avatarBorder} />
      <Feather name="cpu" size={11} color="#5BA8FF" />
    </Animated.View>
  );
}

export function ChatBubble({ message }: Props) {
  const isUser = message.role === "user";
  const mountAnim = useRef(new Animated.Value(0)).current;
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (!hasAnimated.current) {
      hasAnimated.current = true;
      Animated.timing(mountAnim, { toValue: 1, duration: 320, useNativeDriver: true }).start();
    }
  }, [mountAnim]);

  const slideY = mountAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] });

  return (
    <Animated.View
      style={[
        s.wrapper,
        isUser ? s.wrapperRight : s.wrapperLeft,
        { opacity: mountAnim, transform: [{ translateY: slideY }] },
      ]}
    >
      {!isUser && <AIAvatar />}

      <View
        style={[
          s.bubble,
          isUser ? s.bubbleUser : s.bubbleAI,
          !isUser && message.isStreaming && s.bubbleStreaming,
        ]}
      >
        {/* User: crystal gradient bg */}
        {isUser && (
          <LinearGradient
            colors={["#1A4090", "#0D2050", "#0A1A40"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        )}
        {/* AI: parchment-warm dark bg */}
        {!isUser && (
          <LinearGradient
            colors={["#171210", "#1C1610", "#14100D"]}
            style={StyleSheet.absoluteFill}
          />
        )}
        {/* AI: left magic edge lighting */}
        {!isUser && (
          <LinearGradient
            colors={["rgba(59,143,255,0.18)", "rgba(59,143,255,0)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0.3, y: 0 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
        )}
        {/* Streaming shimmer */}
        {!isUser && message.isStreaming && message.content !== "" && <StreamingShimmer />}

        {message.isStreaming && message.content === "" ? (
          <TypingOrbs />
        ) : (
          <Text
            style={[
              s.text,
              isUser ? s.textUser : s.textAI,
            ]}
          >
            {message.content}
          </Text>
        )}
      </View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 14,
    gap: 8,
    paddingHorizontal: 16,
  },
  wrapperLeft: { justifyContent: "flex-start" },
  wrapperRight: { justifyContent: "flex-end" },

  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
    overflow: "hidden",
    shadowColor: "#3B8FFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 6,
    elevation: 3,
    flexShrink: 0,
  },
  avatarBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(59,143,255,0.4)",
  },

  bubble: {
    maxWidth: "78%",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    overflow: "hidden",
  },
  bubbleUser: {
    borderBottomRightRadius: 5,
    borderWidth: 1,
    borderColor: "rgba(59,143,255,0.5)",
    shadowColor: "#3B8FFF",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  bubbleAI: {
    borderBottomLeftRadius: 5,
    borderWidth: 1,
    borderColor: "rgba(100,60,20,0.6)",
    shadowColor: "#6B420A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  bubbleStreaming: {
    borderColor: "rgba(59,143,255,0.35)",
  },
  shimmerLayer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 80,
  },

  text: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },
  textUser: { color: "#D8EEFF" },
  textAI: { color: "#C4B090" },

  orbsRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 2,
    height: 26,
  },
  orb: {
    width: 9,
    height: 9,
    borderRadius: 5,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 3,
  },
});
