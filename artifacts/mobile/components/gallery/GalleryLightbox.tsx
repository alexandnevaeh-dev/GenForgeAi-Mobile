import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Easing,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ApiAsset } from "@/app/(tabs)/assets";
import { GalleryFrame } from "./GalleryFrame";

const { width: SCREEN_W } = Dimensions.get("window");

const CATEGORY_COLOR: Record<string, string> = {
  cover:       "#7B2FFF",
  character:   "#2B7FFF",
  boss:        "#EF4444",
  environment: "#22C55E",
};

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

interface GalleryLightboxProps {
  visible: boolean;
  asset: ApiAsset | null;
  onClose: () => void;
  onFavorite: (asset: ApiAsset) => void;
  onRegenerate: (asset: ApiAsset) => void;
  onOpenSpriteTools: (asset: ApiAsset) => void;
  onDelete: (asset: ApiAsset) => void;
  regenLoading: boolean;
  deleteLoading: boolean;
  canRegen: (cat: string) => boolean;
}

function BreathingImage({ uri }: { uri: string }) {
  const breathe = useRef(new Animated.Value(1)).current;
  const imgFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(breathe, { toValue: 1.03, duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(breathe, { toValue: 1, duration: 4000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();
  }, [breathe]);

  return (
    <Animated.View style={[img.wrap, { transform: [{ scale: breathe }] }]}>
      <Animated.Image
        source={{ uri }}
        style={[img.image, { opacity: imgFade }]}
        resizeMode="contain"
        onLoad={() =>
          Animated.timing(imgFade, { toValue: 1, duration: 400, useNativeDriver: true }).start()
        }
      />
    </Animated.View>
  );
}

function LightRay({ angle, delay }: { angle: string; delay: number }) {
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(opacity, { toValue: 0.06, duration: 3000, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 3000, useNativeDriver: true }),
        Animated.delay(4000),
      ])
    ).start();
  }, [opacity, delay]);
  return (
    <Animated.View
      style={[ray.base, { opacity, transform: [{ rotate: angle }] }]}
      pointerEvents="none"
    >
      <LinearGradient
        colors={["rgba(59,143,255,0)", "rgba(59,143,255,1)", "rgba(59,143,255,0)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ flex: 1 }}
      />
    </Animated.View>
  );
}

function FavoriteCrystal({ isFavorite, onPress }: { isFavorite: boolean; onPress: () => void }) {
  const fillOpacity = useRef(new Animated.Value(isFavorite ? 1 : 0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fillOpacity, { toValue: isFavorite ? 1 : 0, duration: 220, useNativeDriver: true }),
      isFavorite
        ? Animated.sequence([
            Animated.spring(scaleAnim, { toValue: 1.4, useNativeDriver: true, tension: 80, friction: 5 }),
            Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true, tension: 60, friction: 10 }),
          ])
        : Animated.timing(scaleAnim, { toValue: 1, duration: 150, useNativeDriver: true }),
    ]).start();
  }, [isFavorite, fillOpacity, scaleAnim]);

  return (
    <Pressable onPress={onPress} style={fav.btn} hitSlop={8}>
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Feather name="heart" size={22} color="rgba(255,255,255,0.25)" />
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: fillOpacity, alignItems: "center", justifyContent: "center" }]}>
          <Feather name="heart" size={22} color="#EF4444" style={fav.heartGlow} />
        </Animated.View>
      </Animated.View>
    </Pressable>
  );
}

function ActionButton({
  icon,
  label,
  gradient,
  borderColor,
  textColor,
  onPress,
  loading,
  disabled,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  gradient: [string, string];
  borderColor?: string;
  textColor?: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={[act.wrap, { transform: [{ scale }] }]}>
      <Pressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          Animated.sequence([
            Animated.spring(scale, { toValue: 0.93, useNativeDriver: true, tension: 80, friction: 6 }),
            Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 60, friction: 10 }),
          ]).start();
          onPress();
        }}
        disabled={disabled || loading}
        style={act.pressable}
      >
        <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        <LinearGradient colors={["rgba(255,255,255,0.12)", "rgba(255,255,255,0)"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
        {borderColor && <View style={[act.border, { borderColor }]} />}
        {loading
          ? <ActivityIndicator size="small" color={textColor ?? "#fff"} />
          : <>
              <Feather name={icon} size={15} color={textColor ?? "#fff"} />
              <Text style={[act.label, textColor ? { color: textColor } : undefined]}>{label}</Text>
            </>
        }
      </Pressable>
    </Animated.View>
  );
}

export function GalleryLightbox({
  visible,
  asset,
  onClose,
  onFavorite,
  onRegenerate,
  onOpenSpriteTools,
  onDelete,
  regenLoading,
  deleteLoading,
  canRegen,
}: GalleryLightboxProps) {
  const insets = useSafeAreaInsets();
  const catColor = CATEGORY_COLOR[asset?.category ?? ""] ?? "#2B7FFF";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      {asset && (
        <View style={lb.root}>
          {/* Ambient light rays */}
          <LightRay angle="-15deg" delay={0} />
          <LightRay angle="15deg" delay={4000} />
          <LightRay angle="0deg" delay={8000} />

          {/* Fog overlay */}
          <LinearGradient
            colors={["rgba(5,3,14,0.0)", "rgba(11,9,20,0.6)", "rgba(5,3,14,0.0)"]}
            style={[StyleSheet.absoluteFill]}
            pointerEvents="none"
          />

          {/* Header */}
          <View style={[lb.header, { paddingTop: insets.top + 12 }]}>
            {/* Close crystal */}
            <Pressable onPress={onClose} style={lb.closeBtn}>
              <LinearGradient colors={["#1A1628", "#110E1E"]} style={StyleSheet.absoluteFill} />
              <View style={lb.closeBorder} />
              <Feather name="x" size={18} color="#C0B8E0" />
            </Pressable>

            {/* Title + category */}
            <View style={lb.meta}>
              <Text style={lb.name} numberOfLines={1}>{asset.name}</Text>
              <View style={lb.subRow}>
                <View style={[lb.catBadge, { backgroundColor: catColor + "22", borderColor: catColor + "55" }]}>
                  <Text style={[lb.catText, { color: catColor }]}>
                    {asset.category.toUpperCase()}
                  </Text>
                </View>
                <Text style={lb.time}>· {timeAgo(asset.createdAt)}</Text>
              </View>
            </View>

            {/* Favorite crystal */}
            <FavoriteCrystal
              isFavorite={asset.isFavorite}
              onPress={() => onFavorite(asset)}
            />
          </View>

          {/* Artwork frame */}
          <View style={lb.artWrap}>
            <GalleryFrame
              color={catColor}
              cornerSize={18}
              cornerThickness={2}
              style={lb.frame}
            >
              {asset.url ? (
                <BreathingImage uri={asset.url} />
              ) : (
                <View style={lb.noImg}>
                  <Feather name="image" size={40} color="rgba(255,255,255,0.2)" />
                  <Text style={lb.noImgText}>No image</Text>
                </View>
              )}
            </GalleryFrame>
          </View>

          {/* Tags — rune chips */}
          {asset.tags && asset.tags.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={lb.tagsRow}
              contentContainerStyle={lb.tagsContent}
            >
              {asset.tags.map((t) => (
                <View key={t} style={lb.runeTag}>
                  <LinearGradient colors={["#14100C", "#1A1510"]} style={StyleSheet.absoluteFill} />
                  <View style={lb.runeTagBorder} />
                  <Text style={lb.runeTagText}>᛫ {t}</Text>
                </View>
              ))}
            </ScrollView>
          )}

          {/* Action buttons */}
          <View style={[lb.actions, { paddingBottom: insets.bottom + 28 }]}>
            {canRegen(asset.category) && (
              <ActionButton
                icon="refresh-cw"
                label="Regenerate"
                gradient={["#1A3A8A", "#2B7FFF"]}
                onPress={() => onRegenerate(asset)}
                loading={regenLoading}
                disabled={regenLoading}
              />
            )}
            {!!asset.url && !asset.url.startsWith("data:") && (
              <ActionButton
                icon="film"
                label="Frames"
                gradient={["#3A1A8A", "#7B2FFF"]}
                onPress={() => { onOpenSpriteTools(asset); onClose(); }}
              />
            )}
            <ActionButton
              icon="trash-2"
              label="Delete"
              gradient={["#2A0A0A", "#1A0808"]}
              borderColor="#EF444480"
              textColor="#EF4444"
              onPress={() => onDelete(asset)}
              loading={deleteLoading}
              disabled={deleteLoading}
            />
          </View>
        </View>
      )}
    </Modal>
  );
}

const img = StyleSheet.create({
  wrap: {
    width: SCREEN_W - 48,
    height: SCREEN_W - 48,
    alignItems: "center",
    justifyContent: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
});

const ray = StyleSheet.create({
  base: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 60,
    alignSelf: "center",
  },
});

const fav = StyleSheet.create({
  btn: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  heartGlow: {
    shadowColor: "#EF4444",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 5,
  },
});

const act = StyleSheet.create({
  wrap: {
    flex: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  pressable: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 13,
    borderRadius: 14,
    overflow: "hidden",
  },
  border: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
    borderWidth: 1,
  },
  label: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },
});

const lb = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#04020E",
    justifyContent: "space-between",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    flexShrink: 0,
  },
  closeBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(42,38,64,0.8)",
  },
  meta: { flex: 1, gap: 4 },
  name: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#C0B8E0" },
  subRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  catBadge: {
    borderRadius: 5,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  catText: { fontSize: 9, fontFamily: "Inter_700Bold", letterSpacing: 0.6 },
  time: { fontSize: 11, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.35)" },

  artWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  frame: {
    borderRadius: 4,
    shadowColor: "#3B8FFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },

  noImg: { width: SCREEN_W - 48, height: SCREEN_W - 48, alignItems: "center", justifyContent: "center", gap: 10 },
  noImgText: { color: "rgba(255,255,255,0.3)", fontFamily: "Inter_400Regular", fontSize: 14 },

  tagsRow: { flexGrow: 0, marginBottom: 8 },
  tagsContent: { paddingHorizontal: 20, gap: 6, flexDirection: "row" },
  runeTag: {
    borderRadius: 8,
    overflow: "hidden",
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  runeTagBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#4A3010",
  },
  runeTagText: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#7A6040" },

  actions: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 20,
  },
});
