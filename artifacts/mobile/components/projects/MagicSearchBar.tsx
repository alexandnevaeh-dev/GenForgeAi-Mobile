import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, TextInput, View } from "react-native";

interface MagicSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
  placeholder?: string;
}

export function MagicSearchBar({
  value,
  onChangeText,
  onClear,
  placeholder = "Search archives...",
}: MagicSearchBarProps) {
  const [focused, setFocused] = useState(false);
  const focusAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(focusAnim, {
      toValue: focused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [focused, focusAnim]);

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(42,38,64,0.7)", "rgba(59,143,255,0.8)"],
  });
  const shadowOpacity = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.4],
  });

  return (
    <Animated.View
      style={[
        styles.wrap,
        {
          borderColor,
          shadowOpacity,
          shadowColor: "#3B8FFF",
          shadowOffset: { width: 0, height: 0 },
          shadowRadius: 10,
          elevation: focused ? 6 : 2,
        },
      ]}
    >
      <LinearGradient colors={["#0E0C1E", "#0C0A1A"]} style={StyleSheet.absoluteFill} />
      <View style={styles.inner}>
        <Feather
          name="search"
          size={16}
          color={focused ? "#5BA8FF" : "#3A3458"}
          style={focused ? styles.iconGlow : undefined}
        />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#2A2448"
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          returnKeyType="search"
          autoCorrect={false}
        />
        {value.length > 0 && (
          <Pressable onPress={onClear} style={styles.clearBtn} hitSlop={8}>
            <View style={styles.clearCircle}>
              <Feather name="x" size={11} color="#5BA8FF" />
            </View>
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 14,
    borderWidth: 1.5,
    overflow: "hidden",
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  iconGlow: {
    shadowColor: "#5BA8FF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 6,
    elevation: 3,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: "#C0B8E0",
    paddingVertical: 0,
  },
  clearBtn: {
    alignItems: "center",
    justifyContent: "center",
  },
  clearCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(59,143,255,0.15)",
    borderWidth: 1,
    borderColor: "rgba(59,143,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
});
