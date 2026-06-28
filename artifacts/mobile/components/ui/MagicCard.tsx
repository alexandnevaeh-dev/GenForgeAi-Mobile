import { LinearGradient } from "expo-linear-gradient";
import React, { useRef } from "react";
import { Animated, Pressable, StyleSheet, View, ViewStyle } from "react-native";

import { useColors } from "@/hooks/useColors";
import { theme } from "@/constants/theme";

type CardVariant = "default" | "gold" | "purple" | "accent" | "muted";

interface MagicCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: CardVariant;
  onPress?: () => void;
  glowing?: boolean;
  noPadding?: boolean;
}

const VARIANT_GLOW: Record<CardVariant, { border: string; shadow: string }> = {
  default: { border: "#2A2640", shadow: "#9B4BFF" },
  gold: { border: "#FFB347", shadow: "#FFB347" },
  purple: { border: "#9B4BFF", shadow: "#9B4BFF" },
  accent: { border: "#00E5FF", shadow: "#00E5FF" },
  muted: { border: "#1C1A2E", shadow: "#9B4BFF" },
};

export function MagicCard({ children, style, variant = "default", onPress, glowing = false, noPadding = false }: MagicCardProps) {
  const colors = useColors();
  const scale = useRef(new Animated.Value(1)).current;
  const glowOpacity = useRef(new Animated.Value(glowing ? 1 : 0)).current;

  const { border, shadow } = VARIANT_GLOW[variant];

  const onPressIn = () => {
    if (!onPress) return;
    Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, ...theme.animation.springFast }).start();
  };
  const onPressOut = () => {
    if (!onPress) return;
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, ...theme.animation.springNormal }).start();
  };

  const cardContent = (
    <Animated.View
      style={[
        styles.card,
        {
          backgroundColor: variant === "muted" ? colors.muted : colors.card,
          borderColor: border,
          transform: [{ scale }],
        },
        !noPadding && styles.padding,
        {
          shadowColor: shadow,
          shadowOffset: { width: 0, height: glowing ? 0 : 2 },
          shadowOpacity: glowing ? 0.35 : 0.16,
          shadowRadius: glowing ? 18 : 12,
          elevation: glowing ? 10 : 6,
        },
        style,
      ]}
    >
      <LinearGradient
        colors={theme.gradients.cardSheen}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      {children}
    </Animated.View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} onPressIn={onPressIn} onPressOut={onPressOut} style={{ borderRadius: 16 }}>
        {cardContent}
      </Pressable>
    );
  }

  return cardContent;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  padding: {
    padding: 16,
  },
});
