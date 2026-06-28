import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
  KeyboardTypeOptions,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

interface MagicInputProps {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  secureTextEntry?: boolean;
  showPasswordToggle?: boolean;
  showPassword?: boolean;
  onTogglePassword?: () => void;
  keyboardType?: KeyboardTypeOptions;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  autoCorrect?: boolean;
  autoFocus?: boolean;
}

export function MagicInput({
  icon,
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry,
  showPasswordToggle,
  showPassword,
  onTogglePassword,
  keyboardType,
  autoCapitalize = "none",
  autoCorrect = false,
  autoFocus,
}: MagicInputProps) {
  const [focused, setFocused] = useState(false);

  return (
    <View style={s.wrap}>
      <Text style={s.label}>{label}</Text>
      <View style={[s.inputBox, focused && s.inputBoxFocused]}>
        <LinearGradient colors={["#08060F", "#0A0818"]} style={StyleSheet.absoluteFill} />
        <View style={[s.border, focused && s.borderFocused]} />
        {focused && <View style={s.focusGlow} pointerEvents="none" />}

        {/* Icon crystal */}
        <View style={[s.iconWrap, focused && s.iconWrapFocused]}>
          <Feather name={icon} size={16} color={focused ? "#5BA8FF" : "#3A3458"} />
        </View>

        <TextInput
          style={s.input}
          placeholder={placeholder}
          placeholderTextColor="#2A2448"
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          autoFocus={autoFocus}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          selectionColor="#3B8FFF"
          keyboardAppearance="dark"
        />

        {showPasswordToggle && onTogglePassword && (
          <Pressable onPress={onTogglePassword} hitSlop={6}>
            <Feather name={showPassword ? "eye-off" : "eye"} size={16} color="#3A3458" />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { gap: 7 },
  label: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.3,
    color: "#3A3458",
  },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  inputBoxFocused: {
    shadowColor: "#3B8FFF",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 6,
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(42,38,64,0.8)",
  },
  borderFocused: { borderColor: "rgba(59,143,255,0.5)" },
  focusGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
    backgroundColor: "rgba(59,143,255,0.04)",
  },
  iconWrap: { width: 22, alignItems: "center" },
  iconWrapFocused: {},
  input: {
    flex: 1,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: "#C0B8E0",
  },
});
