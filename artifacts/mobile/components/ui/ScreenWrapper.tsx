import React from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AnimatedBackground } from "./AnimatedBackground";

interface ScreenWrapperProps {
  children: React.ReactNode;
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  showBackground?: boolean;
  edges?: React.ComponentProps<typeof SafeAreaView>["edges"];
}

export function ScreenWrapper({
  children,
  style,
  contentStyle,
  showBackground = true,
  edges = ["top", "left", "right"],
}: ScreenWrapperProps) {
  return (
    <View style={[styles.root, style]}>
      {showBackground && <AnimatedBackground />}
      <SafeAreaView style={[styles.safe, contentStyle]} edges={edges}>
        {children}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0B0914",
  },
  safe: {
    flex: 1,
  },
});
