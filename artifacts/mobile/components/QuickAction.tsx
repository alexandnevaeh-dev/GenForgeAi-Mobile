import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

interface Props {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  accent?: boolean;
  onPress: () => void;
}

export function QuickAction({ icon, label, accent, onPress }: Props) {
  const colors = useColors();
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Pressable
        onPress={handlePress}
        onPressIn={() => Animated.spring(scale, { toValue: 0.93, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()}
        style={[
          styles.btn,
          {
            backgroundColor: accent ? colors.primary : colors.card,
            borderColor: accent ? colors.primary : colors.border,
          },
        ]}
      >
        <View style={[styles.iconWrap, { backgroundColor: accent ? "rgba(255,255,255,0.15)" : colors.muted }]}>
          <Feather name={icon} size={20} color={accent ? "#fff" : colors.primary} />
        </View>
        <Text style={[styles.label, { color: accent ? "#fff" : colors.foreground }]} numberOfLines={1}>
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 90,
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    gap: 8,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },
});
