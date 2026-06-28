import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

interface MagicSettingsPanelProps {
  title?: string;
  children: React.ReactNode;
}

export function MagicSettingsPanel({ title, children }: MagicSettingsPanelProps) {
  return (
    <View style={styles.wrap}>
      {title && (
        <View style={styles.headerRow}>
          <View style={styles.headerLine} />
          <Text style={styles.headerText}>{title}</Text>
          <View style={styles.headerLine} />
        </View>
      )}
      <View style={styles.panel}>
        <LinearGradient colors={["#0E0C1E", "#0C0A1A"]} style={StyleSheet.absoluteFill} />
        <View style={styles.border} />
        {/* Corner accents */}
        <View style={[styles.corner, styles.cornerTL]} />
        <View style={[styles.corner, styles.cornerTR]} />
        <View style={[styles.corner, styles.cornerBL]} />
        <View style={[styles.corner, styles.cornerBR]} />
        {children}
      </View>
    </View>
  );
}

const CORNER_SIZE = 10;
const CORNER_T = 1;
const CORNER_COLOR = "rgba(59,143,255,0.2)";

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 4,
  },
  headerLine: { flex: 1, height: 1, backgroundColor: "rgba(42,38,64,0.5)" },
  headerText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1.4,
    color: "#2A2448",
  },
  panel: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(42,38,64,0.8)",
  },
  corner: {
    position: "absolute",
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: CORNER_COLOR,
  },
  cornerTL: { top: 0, left: 0, borderTopWidth: CORNER_T, borderLeftWidth: CORNER_T },
  cornerTR: { top: 0, right: 0, borderTopWidth: CORNER_T, borderRightWidth: CORNER_T },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: CORNER_T, borderLeftWidth: CORNER_T },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: CORNER_T, borderRightWidth: CORNER_T },
});
