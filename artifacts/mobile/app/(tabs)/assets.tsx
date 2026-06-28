import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AssetCreatorModal, { type CreatedAsset } from "@/components/AssetCreatorModal";
import SpriteSheetToolsModal from "@/components/SpriteSheetToolsModal";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

const { width: SCREEN_W } = Dimensions.get("window");

type AssetCategory = "all" | "cover" | "character" | "boss" | "environment";

const FILTERS: { label: string; value: AssetCategory; icon: string }[] = [
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

const CATEGORY_ICON: Record<AssetCategory, string> = {
  all:         "grid",
  cover:       "image",
  character:   "user",
  boss:        "shield",
  environment: "map",
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

export default function AssetsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { accessToken, user } = useAuth();
  const isGuest = !accessToken || user?.id === "guest";

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

  const fetchAssets = useCallback(async () => {
    if (isGuest) { setLoading(false); return; }
    try {
      const res = await fetch("/api/assets", {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error("Failed to load assets");
      const data = (await res.json()) as { assets: ApiAsset[] };
      // Filter out data URLs (legacy base64 assets that can't be displayed efficiently)
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
      Alert.alert("Regeneration Failed", err instanceof Error ? err.message : "Unknown error");
    } finally {
      setRegenLoading(false);
    }
  }, [accessToken]);

  const handleDelete = useCallback(async (asset: ApiAsset) => {
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

  const filtered = activeFilter === "all"
    ? allAssets
    : allAssets.filter((a) => a.category === activeFilter);

  const counts: Record<string, number> = {};
  for (const a of allAssets) counts[a.category] = (counts[a.category] ?? 0) + 1;

  const catColor = (cat: string): string => CATEGORY_COLOR[(cat as AssetCategory)] ?? "#2B7FFF";
  const canRegen = (cat: string) => ["cover", "character", "boss", "environment"].includes(cat);

  return (
    <>
    {/* ── Asset Creator Modal ───────────────────────────────────────────── */}
    <AssetCreatorModal
      visible={creatorVisible}
      onClose={() => setCreatorVisible(false)}
      onCreated={handleAssetCreated}
    />

    {/* ── Sprite Sheet Tools Modal ──────────────────────────────────────── */}
    <SpriteSheetToolsModal
      visible={!!spriteToolsAsset}
      asset={spriteToolsAsset}
      onClose={() => setSpriteToolsAsset(null)}
      onSliced={handleSliced}
    />

    {/* ── Floating Action Button ────────────────────────────────────────── */}
    {!isGuest && (
      <Pressable
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setCreatorVisible(true); }}
        style={[styles.fab, { backgroundColor: colors.primary, bottom: bottomPad - 56 }]}
      >
        <Feather name="plus" size={22} color="#fff" />
      </Pressable>
    )}

    {/* ── Asset Lightbox Modal ─────────────────────────────────────────── */}
    <Modal
      visible={!!lightbox}
      transparent
      animationType="fade"
      onRequestClose={() => setLightbox(null)}
    >
      {lightbox && (
        <View style={styles.lightboxOverlay}>
          {/* Header */}
          <View style={[styles.lightboxHeader]}>
            <Pressable onPress={() => setLightbox(null)} style={styles.lightboxClose}>
              <Feather name="x" size={22} color="#fff" />
            </Pressable>
            <View style={styles.lightboxMeta}>
              <Text style={styles.lightboxName} numberOfLines={1}>{lightbox.name}</Text>
              <Text style={styles.lightboxSub}>
                {lightbox.category.toUpperCase()} · {timeAgo(lightbox.createdAt)}
              </Text>
            </View>
            <Pressable onPress={() => void handleFavorite(lightbox)} style={styles.lightboxFav}>
              <Feather
                name={lightbox.isFavorite ? "heart" : "heart"}
                size={22}
                color={lightbox.isFavorite ? "#EF4444" : "#ffffff88"}
              />
            </Pressable>
          </View>

          {/* Image */}
          <View style={styles.lightboxImgWrap}>
            {lightbox.url ? (
              <Image
                source={{ uri: lightbox.url }}
                style={styles.lightboxImg}
                resizeMode="contain"
              />
            ) : (
              <View style={styles.lightboxNoImg}>
                <Feather name="image" size={40} color="#ffffff44" />
                <Text style={{ color: "#ffffff66", marginTop: 8 }}>No image</Text>
              </View>
            )}
          </View>

          {/* Tags */}
          {lightbox.tags && lightbox.tags.length > 0 && (
            <View style={styles.lightboxTags}>
              {lightbox.tags.map((t) => (
                <View key={t} style={styles.lightboxTag}>
                  <Text style={styles.lightboxTagText}>{t}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Actions */}
          <View style={styles.lightboxActions}>
            {canRegen(lightbox.category) && (
              <Pressable
                onPress={() => void handleRegenerate(lightbox)}
                disabled={regenLoading}
                style={[styles.lightboxBtn, { backgroundColor: "#2B7FFF" }]}
              >
                {regenLoading
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <><Feather name="refresh-cw" size={15} color="#fff" /><Text style={styles.lightboxBtnText}>Regenerate</Text></>}
              </Pressable>
            )}
            {!!lightbox.url && !lightbox.url.startsWith("data:") && (
              <Pressable
                onPress={() => {
                  void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSpriteToolsAsset(lightbox);
                  setLightbox(null);
                }}
                style={[styles.lightboxBtn, { backgroundColor: "#7B2FFF" }]}
              >
                <Feather name="film" size={15} color="#fff" />
                <Text style={styles.lightboxBtnText}>Frames</Text>
              </Pressable>
            )}
            <Pressable
              onPress={() => void handleDelete(lightbox)}
              disabled={deleteLoading}
              style={[styles.lightboxBtn, { backgroundColor: "#EF444422", borderWidth: 1, borderColor: "#EF4444" }]}
            >
              {deleteLoading
                ? <ActivityIndicator size="small" color="#EF4444" />
                : <><Feather name="trash-2" size={15} color="#EF4444" /><Text style={[styles.lightboxBtnText, { color: "#EF4444" }]}>Delete</Text></>}
            </Pressable>
          </View>
        </View>
      )}
    </Modal>

    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: topPad, paddingBottom: bottomPad }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
      }
    >
      <View style={styles.inner}>
        <Text style={[styles.title, { color: colors.foreground }]}>Assets</Text>

        {/* Stats row */}
        {!isGuest && !loading && allAssets.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsRow}>
            {(["cover", "character", "boss", "environment"] as AssetCategory[])
              .filter((c) => counts[c])
              .map((c) => (
                <View key={c} style={[styles.statChip, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.statDot, { backgroundColor: catColor(c) }]} />
                  <Text style={[styles.statCount, { color: colors.foreground }]}>{counts[c]}</Text>
                  <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
                    {c.charAt(0).toUpperCase() + c.slice(1)}
                  </Text>
                </View>
              ))}
          </ScrollView>
        )}

        {/* Filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {FILTERS.map((f) => (
            <Pressable
              key={f.value}
              onPress={() => setActiveFilter(f.value)}
              style={[
                styles.filterChip,
                {
                  backgroundColor: activeFilter === f.value ? colors.primary : colors.card,
                  borderColor: activeFilter === f.value ? colors.primary : colors.border,
                },
              ]}
            >
              <Feather
                name={f.icon as any}
                size={13}
                color={activeFilter === f.value ? "#fff" : colors.mutedForeground}
              />
              <Text style={[styles.filterText, { color: activeFilter === f.value ? "#fff" : colors.mutedForeground }]}>
                {f.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Content */}
        {loading ? (
          <View style={styles.center}><ActivityIndicator color={colors.primary} /></View>
        ) : isGuest ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="lock" size={28} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Sign in to see your assets</Text>
            <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>
              Generated images are saved to your account. Create a game to start building your asset library.
            </Text>
          </View>
        ) : error ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="alert-circle" size={28} color="#EF4444" />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Couldn't load assets</Text>
            <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>{error}</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="image" size={28} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              {allAssets.length === 0 ? "No assets yet" : "No assets in this category"}
            </Text>
            <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>
              {allAssets.length === 0
                ? "Generate a game project to create your first sprites and concept art."
                : "Try a different filter to see your assets."}
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {filtered.map((asset) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                colors={colors}
                catColor={catColor}
                onPress={() => setLightbox(asset)}
                onFavorite={() => void handleFavorite(asset)}
              />
            ))}
          </View>
        )}
      </View>
    </ScrollView>
    </>
  );
}

function AssetCard({
  asset,
  colors,
  catColor,
  onPress,
  onFavorite,
}: {
  asset: ApiAsset;
  colors: ReturnType<typeof useColors>;
  catColor: (c: string) => string;
  onPress: () => void;
  onFavorite: () => void;
}) {
  const [imgError, setImgError] = useState(false);
  const color = catColor(asset.category);
  const icon = CATEGORY_ICON[(asset.category as AssetCategory)] ?? "image";
  const hasImage = !!asset.url && !imgError && !asset.url.startsWith("data:");

  return (
    <Pressable
      onPress={onPress}
      style={[styles.assetCard, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      {/* Thumbnail */}
      <View style={[styles.thumb, { backgroundColor: colors.muted }]}>
        {hasImage ? (
          <Image
            source={{ uri: asset.url! }}
            style={styles.thumbImage}
            resizeMode="cover"
            onError={() => setImgError(true)}
          />
        ) : (
          <View style={[styles.thumbFallback, { backgroundColor: color + "22" }]}>
            <Feather name={icon as any} size={24} color={color} />
          </View>
        )}
        {/* Favorite badge */}
        {asset.isFavorite && (
          <View style={styles.favBadge}>
            <Feather name="heart" size={10} color="#EF4444" />
          </View>
        )}
      </View>

      {/* Meta */}
      <View style={styles.assetMeta}>
        <View style={[styles.categoryChip, { backgroundColor: color + "22" }]}>
          <Text style={[styles.categoryChipText, { color }]}>
            {asset.category.toUpperCase()}
          </Text>
        </View>
        <Text style={[styles.assetName, { color: colors.foreground }]} numberOfLines={2}>
          {asset.name}
        </Text>
        <Text style={[styles.assetTime, { color: colors.mutedForeground }]}>
          {timeAgo(asset.createdAt)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  inner: { paddingHorizontal: 20, gap: 16 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", letterSpacing: -0.3 },
  statsRow: { marginHorizontal: -20, paddingHorizontal: 20 },
  statChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 8, marginRight: 8,
  },
  statDot: { width: 7, height: 7, borderRadius: 4 },
  statCount: { fontSize: 14, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  filterRow: { marginHorizontal: -20, paddingHorizontal: 20 },
  filterChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, marginRight: 8,
  },
  filterText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  center: { alignItems: "center", paddingVertical: 60 },
  emptyCard: { borderRadius: 16, borderWidth: 1, padding: 32, alignItems: "center", gap: 12 },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  emptyBody: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  assetCard: { width: "47%", borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  thumb: { width: "100%", aspectRatio: 1 },
  thumbImage: { width: "100%", height: "100%" },
  thumbFallback: { flex: 1, alignItems: "center", justifyContent: "center" },
  favBadge: {
    position: "absolute", top: 6, right: 6,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: "#ffffff22", alignItems: "center", justifyContent: "center",
  },
  assetMeta: { padding: 10, gap: 4 },
  categoryChip: { alignSelf: "flex-start", borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  categoryChipText: { fontSize: 9, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
  assetName: { fontSize: 12, fontFamily: "Inter_500Medium", lineHeight: 16 },
  assetTime: { fontSize: 11, fontFamily: "Inter_400Regular" },
  // Lightbox
  lightboxOverlay: {
    flex: 1,
    backgroundColor: "#000000EE",
    justifyContent: "space-between",
  },
  lightboxHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 12,
  },
  lightboxClose: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  lightboxMeta: { flex: 1 },
  lightboxName: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
  lightboxSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "#ffffff88" },
  lightboxFav: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  lightboxImgWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  lightboxImg: { width: SCREEN_W - 32, height: SCREEN_W - 32 },
  lightboxNoImg: { alignItems: "center", justifyContent: "center" },
  lightboxTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  lightboxTag: {
    borderRadius: 6,
    backgroundColor: "#ffffff15",
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  lightboxTagText: { fontSize: 11, fontFamily: "Inter_400Regular", color: "#ffffff99" },
  lightboxActions: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 50,
  },
  lightboxBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  lightboxBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },
  fab: {
    position: "absolute",
    right: 20,
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2B7FFF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 100,
  },
});
