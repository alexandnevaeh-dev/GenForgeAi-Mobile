import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import { Animated, LayoutChangeEvent, Pressable, StyleSheet, Text, View } from "react-native";

interface Tab {
  label: string;
  value: string;
  icon: React.ComponentProps<typeof Feather>["name"];
}

interface RuneSegmentedControlProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (value: string) => void;
}

export function RuneSegmentedControl({ tabs, activeTab, onTabChange }: RuneSegmentedControlProps) {
  const [containerW, setContainerW] = useState(0);
  const activeIndex = tabs.findIndex((t) => t.value === activeTab);
  const slideAnim = useRef(new Animated.Value(activeIndex)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: activeIndex,
      useNativeDriver: true,
      tension: 70,
      friction: 10,
    }).start();
  }, [activeIndex, slideAnim]);

  const tabWidth = containerW > 0 ? (containerW - 8) / tabs.length : 0;

  const handleLayout = (e: LayoutChangeEvent) => {
    setContainerW(e.nativeEvent.layout.width);
  };

  return (
    <View style={styles.wrap} onLayout={handleLayout}>
      <LinearGradient colors={["#0A0818", "#0C0A14"]} style={StyleSheet.absoluteFill} />
      <View style={styles.border} />

      {/* Sliding crystal indicator */}
      {tabWidth > 0 && (
        <Animated.View
          style={[
            styles.indicator,
            {
              width: tabWidth - 4,
              transform: [
                {
                  translateX: slideAnim.interpolate({
                    inputRange: tabs.map((_, i) => i),
                    outputRange: tabs.map((_, i) => 4 + i * tabWidth),
                  }),
                },
              ],
            },
          ]}
          pointerEvents="none"
        >
          <LinearGradient colors={["#1A3A8A", "#2B5FBF", "#3B8FFF"]} style={StyleSheet.absoluteFill} />
          <LinearGradient
            colors={["rgba(255,255,255,0.15)", "rgba(255,255,255,0)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.indicatorBorder} />
        </Animated.View>
      )}

      {/* Tab buttons */}
      {tabs.map((tab) => {
        const isActive = tab.value === activeTab;
        return (
          <Pressable
            key={tab.value}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onTabChange(tab.value);
            }}
            style={styles.tab}
          >
            <Feather
              name={tab.icon}
              size={13}
              color={isActive ? "#AADCFF" : "#3A3458"}
              style={isActive ? styles.activeIcon : undefined}
            />
            <Text style={[styles.tabLabel, isActive ? styles.tabLabelActive : styles.tabLabelInactive]}>
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    borderRadius: 14,
    padding: 4,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
    position: "relative",
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(42,38,64,0.8)",
  },
  indicator: {
    position: "absolute",
    top: 4,
    bottom: 4,
    borderRadius: 10,
    overflow: "hidden",
    shadowColor: "#3B8FFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  indicatorBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(59,143,255,0.5)",
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 9,
    borderRadius: 10,
    zIndex: 1,
  },
  tabLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  tabLabelActive: { color: "#D0E8FF" },
  tabLabelInactive: { color: "#3A3458" },
  activeIcon: {
    shadowColor: "#AADCFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 5,
    elevation: 3,
  },
});
