import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import React, { useRef } from "react";
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text, ViewStyle } from "react-native";

import { theme } from "@/constants/theme";

type ButtonVariant = "primary" | "secondary" | "danger" | "gold" | "accent" | "ghost";

interface MagicButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: React.ComponentProps<typeof Feather>["name"];
  iconPosition?: "left" | "right";
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
}

const VARIANT_GRADIENT: Record<ButtonVariant, readonly [string, string]> = {
  primary: theme.gradients.primary,
  secondary: theme.gradients.secondary,
  danger: theme.gradients.danger,
  gold: theme.gradients.gold,
  accent: theme.gradients.accent,
  ghost: ["rgba(255,255,255,0.07)", "rgba(255,255,255,0.04)"],
};

const VARIANT_SHADOW: Record<ButtonVariant, string> = {
  primary: "#3B8FFF",
  secondary: "#9B4BFF",
  danger: "#DC2626",
  gold: "#FFB347",
  accent: "#00E5FF",
  ghost: "#9B4BFF",
};

const VARIANT_TEXT: Record<ButtonVariant, string> = {
  primary: "#ffffff",
  secondary: "#ffffff",
  danger: "#ffffff",
  gold: "#1A0800",
  accent: "#001A1E",
  ghost: "#E8E6F0",
};

const SIZE_HEIGHT: Record<string, number> = { sm: 40, md: 50, lg: 58 };
const SIZE_FONT: Record<string, number> = { sm: 13, md: 15, lg: 16 };
const SIZE_PAD: Record<string, number> = { sm: 14, md: 20, lg: 24 };

export function MagicButton({
  title,
  onPress,
  variant = "primary",
  icon,
  iconPosition = "left",
  loading = false,
  disabled = false,
  style,
  size = "md",
  fullWidth = false,
}: MagicButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scale, { toValue: 0.95, useNativeDriver: true, ...theme.animation.springFast }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scale, { toValue: 1, useNativeDriver: true, ...theme.animation.springNormal }).start();
  };
  const handlePress = () => {
    if (disabled || loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  const gradientColors = disabled
    ? (theme.gradients.disabled as unknown as [string, string])
    : (VARIANT_GRADIENT[variant] as [string, string]);
  const shadowColor = VARIANT_SHADOW[variant];
  const textColor = disabled ? "#4A4660" : VARIANT_TEXT[variant];
  const iconColor = textColor;
  const height = SIZE_HEIGHT[size];
  const fontSize = SIZE_FONT[size];
  const paddingHorizontal = SIZE_PAD[size];

  return (
    <Animated.View
      style={[
        fullWidth && styles.fullWidth,
        { transform: [{ scale }] },
        !disabled && {
          shadowColor,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.5,
          shadowRadius: 14,
          elevation: 8,
        },
        style,
      ]}
    >
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled || loading}
        style={[styles.pressable, fullWidth && styles.fullWidth]}
      >
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.gradient,
            { height, paddingHorizontal },
            fullWidth && styles.fullWidth,
          ]}
        >
          {loading ? (
            <ActivityIndicator color={textColor} size="small" />
          ) : (
            <>
              {icon && iconPosition === "left" && (
                <Feather name={icon} size={fontSize + 2} color={iconColor} style={styles.iconLeft} />
              )}
              <Text style={[styles.label, { color: textColor, fontSize }]}>{title}</Text>
              {icon && iconPosition === "right" && (
                <Feather name={icon} size={fontSize + 2} color={iconColor} style={styles.iconRight} />
              )}
            </>
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  pressable: {
    borderRadius: 14,
    overflow: "hidden",
  },
  fullWidth: {
    width: "100%",
  },
  gradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
  },
  label: {
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
});
