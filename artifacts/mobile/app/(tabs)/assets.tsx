import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AssetCreatorModal, { type CreatedAsset } from "@/components/AssetCreatorModal";
import SpriteSheetToolsModal from "@/components/SpriteSheetToolsModal";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { ArtDisplayCard } from "@/components/gallery/ArtDisplayCard";
import { CrystalCategoryChip } from "@/components/gallery/CrystalCategoryChip";
import { GalleryEmptyState } from "@/components/gallery/GalleryEmptyState";
import { GalleryLightbox } from "@/components/gallery/GalleryLightbox";
import { GalleryLoadingSkeleton } from "@/components/gallery/GalleryLoadingSkeleton";
import { MagicFAB } from "@/components/gallery/MagicFAB";
import { RuneFilterChip } from "@/components/gallery/RuneFilterChip";
import { useAuth } from "@/context/AuthContext";

// ─── Types & Constants ────────────────────────────────────────────────────────

type AssetCategory = "all" | "cover" | "character" | "boss" | "environment";

const FILTERS: { label: string; value: AssetCategory; icon: React.ComponentProps<typeof import("@expo/vector-icons").Feather>["name"] }[] = [
  { label: "All",         value: "all",         icon: "grid" },
  { label: "Cover Art",   value: "cover",        icon: "image" },
  { label: "Characters",  value: "character",    icon: "user" },
  { label: "Bosses",      value: "boss",         icon: "shield" },
  { label: "Worlds",      value: "environment",  icon: "map" },
];

const CATEGORY_COLOR: Record<AssetCategory, string> = {
  all:         "#2B7FFF",
  cover:       "#7B2FFF",
  character:   "#2B7FFF",
  boss:        "#EF4444",
  environment: "#22C55E",
};

export interface ApiAsset {
  id: string;
  projectId: string | null;
  name: string;
  type: string;
  category: string;
  url: string | null;
  thumbnailUrl: string | null;
  mimeType: string | null;
  tags: string[] | null;
  metadata: Record<string, unknown> | null;
  isFavorite: boolean;
  createdAt: string;
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const m = Math.floor(ms / 60000);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

// ─── Gallery Title with shimmer ───────────────────────────────────────────────

function GalleryTitle() {
  const shimmerX = useRef(new Animated.Value(-60)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.delay(4000),
        Animated.timing(shimmerX, { toValue: 160, duration: 800, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(shimmerX, { toValue: -60, duration: 0, useNativeDriver: true }),
      ])
    ).start();
  }, [shimmerX]);
  return (
    <View style={title.wrap}>
      <Text style={title.text}>Assets</Text>
      <Animated.View style={[title.shimmer, { transform: [{ translateX: shimmerX }] }]} pointerEvents="none">
        <LinearGradient
          colors={["rgba(255,255,255,0)", "rgba(255,255,255,0.45)", "rgba(255,255,255,0)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={{ flex: 1 }}
        />
      </Animated.View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function AssetsScreen() {
  const insets = useSafeAreaInsets();
  const { accessToken, user } = useAuth();
  const isGuest = !accessToken || user?.id === "guest";

  // ── All existing state — unchanged ────────────────────────────────────────
  const [allAssets, setAllAssets] = useState<ApiAsset[]>([]);
  const [activeFilter, setActiveFilter] = useState<AssetCategory>("all");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [lightbox, setLightbox] = useState<ApiAsset | null>(null);
  const [regenLoading, setRegenLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [creatorVisible, setCreatorVisible] = useState(false);
  const [spriteToolsAsset, setSpriteToolsAsset] = useState<ApiAsset | null>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top + 16;
  const bottomPad = Platform.OS === "web" ? 34 + 84 : insets.bottom + 84;

  // ── All existing callbacks — unchanged ────────────────────────────────────

  const fetchAssets = useCallback(async () => {
    if (isGuest) { setLoading(false); return; }
    try {
      const res = await fetch("/api/assets", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error("Failed to load assets");
      const data = (await res.json()) as { assets: ApiAsset[] };
      setAllAssets(data.assets.filter((a) => !a.url?.startsWith("data:")));
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load assets");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isGuest, accessToken]);

  useEffect(() => { fetchAssets(); }, [fetchAssets]);

  const onRefresh = useCallback(() => { setRefreshing(true); fetchAssets(); }, [fetchAssets]);

  const handleFavorite = useCallback(async (asset: ApiAsset) => {
    const next = !asset.isFavorite;
    setAllAssets((prev) => prev.map((a) => a.id === asset.id ? { ...a, isFavorite: next } : a));
    if (lightbox?.id === asset.id) setLightbox((l) => l ? { ...l, isFavorite: next } : l);
    await fetch(`/api/assets/${asset.id}/favorite`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
      body: JSON.stringify({ isFavorite: next }),
    });
  }, [accessToken, lightbox]);

  const handleRegenerate = useCallback(async (asset: ApiAsset) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRegenLoading(true);
    try {
      const res = await fetch(`/api/assets/${asset.id}/regenerate`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) {
        const d = (await res.json()) as { error?: string };
        throw new Error(d.error ?? "Regeneration failed");
      }
      const data = (await res.json()) as { asset: ApiAsset };
      setAllAssets((prev) => prev.map((a) => a.id === asset.id ? { ...a, ...data.asset } : a));
      setLightbox((l) => l?.id === asset.id ? { ...l, ...data.asset } : l);
    } catch (err) {
      const { Alert } = await import("react-native");
      Alert.alert("Regeneration Failed", err instanceof Error ? err.message : "Unknown error");
    } finally {
      setRegenLoading(false);
    }
  }, [accessToken]);

  const handleDelete = useCallback(async (asset: ApiAsset) => {
    const { Alert } = await import("react-native");
    Alert.alert("Delete Asset", `Delete "${asset.name}"? This cannot be undone.`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete", style: "destructive",
        onPress: async () => {
          setDeleteLoading(true);
          try {
            await fetch(`/api/assets/${asset.id}`, {
              method: "DELETE",
              headers: { Authorization: `Bearer ${accessToken}` },
            });
            setAllAssets((prev) => prev.filter((a) => a.id !== asset.id));
            setLightbox(null);
          } finally {
            setDeleteLoading(false);
          }
        },
      },
    ]);
  }, [accessToken]);

  const handleSliced = useCallback((assetId: string, metadata: Record<string, unknown>) => {
    setAllAssets((prev) => prev.map((a) => a.id === assetId ? { ...a, metadata } : a));
    setLightbox((l) => l?.id === assetId ? { ...l, metadata } : l);
    setSpriteToolsAsset((s) => s?.id === assetId ? { ...s, metadata } : s);
  }, []);

  const handleAssetCreated = useCallback((asset: CreatedAsset) => {
    const newAsset: ApiAsset = {
      id:           asset.id,
      projectId:    null,
      name:         asset.name,
      type:         asset.category,
      category:     asset.category,
      url:          asset.url,
      thumbnailUrl: asset.thumbnailUrl,
      mimeType:     "image/png",
      tags:         asset.tags,
      metadata:     null,
      isFavorite:   false,
      createdAt:    asset.createdAt,
    };
    setAllAssets((prev) => [newAsset, ...prev]);
    setActiveFilter("all");
  }, []);

  // ── Derived state — unchanged ──────────────────────────────────────────────

  const filtered = activeFilter === "all"
    ? allAssets
    : allAssets.filter((a) => a.category === activeFilter);

  const counts: Record<string, number> = {};
  for (const a of allAssets) counts[a.category] = (counts[a.category] ?? 0) + 1;

  const catColor = (cat: string): string => CATEGORY_COLOR[(cat as AssetCategory)] ?? "#2B7FFF";
  const canRegen = (cat: string) => ["cover", "character", "boss", "environment"].includes(cat);

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Asset Creator Modal ─────────────────────────────────────────── */}
      <AssetCreatorModal
        visible={creatorVisible}
        onClose={() => setCreatorVisible(false)}
        onCreated={handleAssetCreated}
      />

      {/* ── Sprite Sheet Tools Modal ────────────────────────────────────── */}
      <SpriteSheetToolsModal
        visible={!!spriteToolsAsset}
        asset={spriteToolsAsset}
        onClose={() => setSpriteToolsAsset(null)}
        onSliced={handleSliced}
      />

      {/* ── Immersive Lightbox ──────────────────────────────────────────── */}
      <GalleryLightbox
        visible={!!lightbox}
        asset={lightbox}
        onClose={() => setLightbox(null)}
        onFavorite={(a) => void handleFavorite(a)}
        onRegenerate={(a) => void handleRegenerate(a)}
        onOpenSpriteTools={(a) => setSpriteToolsAsset(a)}
        onDelete={(a) => void handleDelete(a)}
        regenLoading={regenLoading}
        deleteLoading={deleteLoading}
        canRegen={canRegen}
      />

      {/* ── Magic Forge FAB ─────────────────────────────────────────────── */}
      {!isGuest && (
        <MagicFAB
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setCreatorVisible(true);
          }}
          bottom={bottomPad - 56}
        />
      )}

      {/* ── Main gallery view ───────────────────────────────────────────── */}
      <View style={s.root}>
        <AnimatedBackground />
        <LinearGradient
          colors={["rgba(11,9,20,0.95)", "rgba(11,9,20,0.84)"]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        <ScrollView
          style={s.scroll}
          contentContainerStyle={{ paddingTop: topPad, paddingBottom: bottomPad }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#3B8FFF"
            />
          }
        >
          <View style={s.inner}>
            {/* Metallic shimmer title */}
            <GalleryTitle />

            {/* Crystal category stat chips */}
            {!isGuest && !loading && allAssets.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={s.statsRow}
                contentContainerStyle={s.statsContent}
              >
                {(["cover", "character", "boss", "environment"] as AssetCategory[])
                  .filter((c) => counts[c])
                  .map((c) => (
                    <CrystalCategoryChip
                      key={c}
                      color={catColor(c)}
                      count={counts[c]}
                      label={c.charAt(0).toUpperCase() + c.slice(1)}
                    />
                  ))}
              </ScrollView>
            )}

            {/* Enchanted rune filter chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={s.filterRow}
              contentContainerStyle={s.filterContent}
            >
              {FILTERS.map((f) => (
                <RuneFilterChip
                  key={f.value}
                  label={f.label}
                  icon={f.icon}
                  active={activeFilter === f.value}
                  onPress={() => setActiveFilter(f.value)}
                />
              ))}
            </ScrollView>

            {/* Rune divider */}
            <View style={s.divider}>
              <View style={s.divLine} />
              <View style={s.divDot} />
              <View style={s.divLine} />
            </View>

            {/* Content area */}
            {loading ? (
              <GalleryLoadingSkeleton />
            ) : isGuest ? (
              <GalleryEmptyState variant="guest" />
            ) : error ? (
              <GalleryEmptyState variant="error" errorMessage={error} />
            ) : filtered.length === 0 ? (
              allAssets.length === 0 ? (
                <GalleryEmptyState
                  variant="empty"
                  onGeneratePress={() => setCreatorVisible(true)}
                />
              ) : (
                <GalleryEmptyState
                  variant="filtered"
                  filterName={FILTERS.find((f) => f.value === activeFilter)?.label}
                />
              )
            ) : (
              <View style={s.grid}>
                {filtered.map((asset) => (
                  <ArtDisplayCard
                    key={asset.id}
                    asset={asset}
                    onPress={() => setLightbox(asset)}
                    onFavorite={() => void handleFavorite(asset)}
                  />
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const title = StyleSheet.create({
  wrap: { overflow: "hidden", alignSelf: "flex-start" },
  text: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
    color: "#C0B8E0",
    textShadowColor: "rgba(140,120,255,0.3)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  shimmer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 60,
    transform: [{ skewX: "-15deg" }],
  },
});

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0B0914" },
  scroll: { flex: 1 },
  inner: { paddingHorizontal: 20, gap: 14 },

  statsRow: { marginHorizontal: -20 },
  statsContent: { paddingHorizontal: 20 },
  filterRow: { marginHorizontal: -20 },
  filterContent: { paddingHorizontal: 20 },

  divider: { flexDirection: "row", alignItems: "center", gap: 8, marginVertical: 2 },
  divLine: { flex: 1, height: 1, backgroundColor: "rgba(42,38,64,0.5)" },
  divDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: "#2A2448", transform: [{ rotate: "45deg" }] },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, paddingBottom: 8 },
});
