import { Feather } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";

type FeatherName = React.ComponentProps<typeof Feather>["name"];

interface GlowIconProps {
  name: FeatherName;
  size?: number;
  color: string;
  glowColor?: string;
  glowing?: boolean;
  pulsing?: boolean;
}

export function GlowIcon({ name, size = 22, color, glowColor, glowing = false, pulsing = false }: GlowIconProps) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (pulsing) {
      const animation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.5, duration: 900, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        ])
      );
      animation.start();
      return () => animation.stop();
    }
    pulseAnim.setValue(1);
    return undefined;
  }, [pulsing, pulseAnim]);

  const effectiveGlow = glowColor ?? color;

  if (!glowing && !pulsing) {
    return <Feather name={name} size={size} color={color} />;
  }

  return (
    <Animated.View
      style={[
        styles.wrap,
        { opacity: pulsing ? pulseAnim : 1 },
        glowing && {
          shadowColor: effectiveGlow,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.75,
          shadowRadius: 8,
          elevation: 4,
        },
      ]}
    >
      <Feather name={name} size={size} color={color} />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    justifyContent: "center",
  },
});
