import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";

const RUNES = ["᛭", "ᚱ", "ᚦ", "ᚨ"];

interface SpellCardProps {
  text: string;
  runeChar: string;
  floatDelay: number;
  onPress: () => void;
}

function SpellCard({ text, runeChar, floatDelay, onPress }: SpellCardProps) {
  const floatAnim = useRef(new Animated.Value(0)).current;
  const pressScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.delay(floatDelay),
        Animated.timing(floatAnim, {
          toValue: -4,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration: 1600,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [floatAnim, floatDelay]);

  return (
    <Animated.View
      style={[
        card.wrap,
        { transform: [{ translateY: floatAnim }, { scale: pressScale }] },
      ]}
    >
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        onPressIn={() =>
          Animated.spring(pressScale, { toValue: 0.95, useNativeDriver: true, tension: 80, friction: 6 }).start()
        }
        onPressOut={() =>
          Animated.spring(pressScale, { toValue: 1, useNativeDriver: true, tension: 60, friction: 10 }).start()
        }
        style={card.pressable}
      >
        <LinearGradient
          colors={["#14100C", "#1A1510", "#120E0A"]}
          style={StyleSheet.absoluteFill}
        />
        <View style={card.border} />
        {/* Scroll end caps */}
        <View style={[card.endCap, { left: 0 }]} />
        <View style={[card.endCap, { right: 0 }]} />

        <Text style={card.rune}>{runeChar}</Text>
        <Text style={card.text} numberOfLines={2}>{text}</Text>
        <Text style={card.arrow}>↗</Text>
      </Pressable>
    </Animated.View>
  );
}

interface SpellScrollSuggestionProps {
  suggestions: string[];
  onSelect: (s: string) => void;
}

export function SpellScrollSuggestion({ suggestions, onSelect }: SpellScrollSuggestionProps) {
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>᛭  Speak your vision...</Text>
      {suggestions.map((s, i) => (
        <SpellCard
          key={s}
          text={s}
          runeChar={RUNES[i % RUNES.length]}
          floatDelay={i * 300}
          onPress={() => onSelect(s)}
        />
      ))}
    </View>
  );
}

const card = StyleSheet.create({
  wrap: {
    shadowColor: "#8B6030",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  pressable: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 18,
    overflow: "hidden",
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#4A3010",
  },
  endCap: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 5,
    backgroundColor: "#6B420A",
    opacity: 0.7,
  },
  rune: {
    fontSize: 16,
    color: "#C8922A",
    textShadowColor: "#C8922A",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6,
    flexShrink: 0,
  },
  text: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: "#8B7055",
    lineHeight: 19,
  },
  arrow: {
    fontSize: 14,
    color: "#5A4020",
    flexShrink: 0,
  },
});

const styles = StyleSheet.create({
  wrap: {
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 20,
  },
  label: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: "#2A2448",
    marginBottom: 4,
    letterSpacing: 0.8,
  },
});
