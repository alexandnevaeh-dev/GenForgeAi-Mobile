import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import React, { memo, useEffect, useRef, useState } from "react";
import { Animated, Image, Pressable, StyleSheet, Text, View } from "react-native";

import { ApiAsset } from "@/app/(tabs)/assets";
import { GalleryFrame } from "./GalleryFrame";

const CATEGORY_COLOR: Record<string, string> = {
  all:         "#2B7FFF",
  cover:       "#7B2FFF",
  character:   "#2B7FFF",
  boss:        "#EF4444",
  environment: "#22C55E",
};

const CATEGORY_ICON: Record<string, React.ComponentProps<typeof Feather>["name"]> = {
  all:         "grid",
  cover:       "image",
  character:   "user",
  boss:        "shield",
  environment: "map",
};

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

interface Props {
  asset: ApiAsset;
  onPress: () => void;
  onFavorite: () => void;
}

export const ArtDisplayCard = memo(function ArtDisplayCard({ asset, onPress, onFavorite }: Props) {
  const [imgError, setImgError] = useState(false);
  const color = CATEGORY_COLOR[asset.category] ?? "#2B7FFF";
  const icon = CATEGORY_ICON[asset.category] ?? "image";
  const hasImage = !!asset.url && !imgError && !asset.url.startsWith("data:");

  const pressScale = useRef(new Animated.Value(1)).current;
  const imgFadeIn = useRef(new Animated.Value(0)).current;

  // Favorite animation
  const favFillOpacity = useRef(new Animated.Value(asset.isFavorite ? 1 : 0)).current;
  const favScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(favFillOpacity, {
        toValue: asset.isFavorite ? 1 : 0,
        duration: 220,
        useNativeDriver: true,
      }),
      asset.isFavorite
        ? Animated.sequence([
            Animated.spring(favScale, { toValue: 1.35, useNativeDriver: true, tension: 80, friction: 5 }),
            Animated.spring(favScale, { toValue: 1, useNativeDriver: true, tension: 60, friction: 10 }),
          ])
        : Animated.timing(favScale, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
  }, [asset.isFavorite, favFillOpacity, favScale]);

  const handleFavorite = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onFavorite();
  };

  return (
    <Animated.View
      style={[
        styles.outerWrap,
        { shadowColor: color, transform: [{ scale: pressScale }] },
      ]}
    >
      <Pressable
        onPress={onPress}
        onPressIn={() =>
          Animated.spring(pressScale, { toValue: 0.95, useNativeDriver: true, tension: 80, friction: 6 }).start()
        }
        onPressOut={() =>
          Animated.spring(pressScale, { toValue: 1, useNativeDriver: true, tension: 60, friction: 10 }).start()
        }
        style={styles.card}
      >
        <LinearGradient colors={["#0E0C1E", "#0C0A1A"]} style={StyleSheet.absoluteFill} />
        <View style={styles.staticBorder} />

        {/* Artwork thumbnail */}
        <GalleryFrame
          color={color}
          cornerSize={10}
          cornerThickness={2}
          style={styles.thumbFrame}
        >
          <View style={styles.thumb}>
            <LinearGradient colors={["#0A0818", "#0C0A18"]} style={StyleSheet.absoluteFill} />

            {hasImage ? (
              <Animated.View style={[StyleSheet.absoluteFill, { opacity: imgFadeIn }]}>
                <Image
                  source={{ uri: asset.url! }}
                  style={styles.thumbImage}
                  resizeMode="cover"
                  onLoad={() =>
                    Animated.timing(imgFadeIn, { toValue: 1, duration: 350, useNativeDriver: true }).start()
                  }
                  onError={() => setImgError(true)}
                />
              </Animated.View>
            ) : (
              <View style={[styles.fallback, { backgroundColor: color + "18" }]}>
                <Feather name={icon} size={24} color={color} style={styles.fallbackIcon} />
              </View>
            )}

            {/* Category gem badge (top-left) */}
            <View style={[styles.gemBadge, { borderColor: color + "60" }]}>
              <LinearGradient colors={["#0A0818", "#0C0A18"]} style={StyleSheet.absoluteFill} />
              <View style={[styles.gemDot, { backgroundColor: color, shadowColor: color }]} />
            </View>

            {/* Favorite crystal (top-right) */}
            <Pressable onPress={handleFavorite} style={styles.favBtn} hitSlop={6}>
              <View style={styles.favBg}>
                <LinearGradient colors={["rgba(15,12,28,0.85)", "rgba(15,12,28,0.7)"]} style={StyleSheet.absoluteFill} />
              </View>
              {/* Empty heart (always visible) */}
              <Feather name="heart" size={11} color="rgba(255,255,255,0.35)" />
              {/* Filled heart (animated opacity) */}
              <Animated.View
                style={[StyleSheet.absoluteFill, styles.favFill, { opacity: favFillOpacity }]}
                pointerEvents="none"
              >
                <Animated.View style={{ transform: [{ scale: favScale }] }}>
                  <Feather name="heart" size={11} color="#EF4444" style={styles.favGlow} />
                </Animated.View>
              </Animated.View>
            </Pressable>
          </View>
        </GalleryFrame>

        {/* Meta */}
        <View style={styles.meta}>
          <View style={[styles.catChip, { backgroundColor: color + "1A", borderColor: color + "40" }]}>
            <Text style={[styles.catText, { color }]}>
              {asset.category.toUpperCase()}
            </Text>
          </View>
          <Text style={styles.name} numberOfLines={2}>
            {asset.name}
          </Text>
          <Text style={styles.time}>{timeAgo(asset.createdAt)}</Text>
        </View>
      </Pressable>
    </Animated.View>
  );
});

const styles = StyleSheet.create({
  outerWrap: {
    width: "47%",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 7,
  },
  card: {
    borderRadius: 14,
    overflow: "hidden",
  },
  staticBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(42,38,64,0.8)",
  },
  thumbFrame: { width: "100%" },
  thumb: {
    width: "100%",
    aspectRatio: 1,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  thumbImage: { width: "100%", height: "100%" },
  fallback: { flex: 1, alignItems: "center", justifyContent: "center", width: "100%" },
  fallbackIcon: {
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 4,
  },
  gemBadge: {
    position: "absolute",
    top: 8,
    left: 8,
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    transform: [{ rotate: "45deg" }],
  },
  gemDot: {
    width: 8,
    height: 8,
    borderRadius: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 4,
    elevation: 3,
  },
  favBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  favBg: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 11,
    overflow: "hidden",
  },
  favFill: {
    alignItems: "center",
    justifyContent: "center",
  },
  favGlow: {
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 4,
  },
  meta: { padding: 10, gap: 4 },
  catChip: {
    alignSelf: "flex-start",
    borderRadius: 5,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  catText: { fontSize: 9, fontFamily: "Inter_700Bold", letterSpacing: 0.6 },
  name: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: "#C0B8E0",
    lineHeight: 17,
  },
  time: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#2A2448" },
});
