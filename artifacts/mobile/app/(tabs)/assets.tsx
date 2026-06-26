import { Feather } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

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

interface ApiAsset {
  id: string;
  projectId: string | null;
  name: string;
  type: string;
  category: string;
  url: string | null;
  thumbnailUrl: string | null;
  mimeType: string | null;
  tags: string[] | null;
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

  const topPad = Platform.OS === "web" ? 67 : insets.top + 16;
  const bottomPad = Platform.OS === "web" ? 34 + 84 : insets.bottom + 84;

  const fetchAssets = useCallback(async () => {
    if (isGuest) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch("/api/assets", {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      });
      if (!res.ok) throw new Error("Failed to load assets");
      const data = (await res.json()) as { assets: ApiAsset[] };
      setAllAssets(data.assets);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load assets");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isGuest, accessToken]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchAssets();
  }, [fetchAssets]);

  const filtered = activeFilter === "all"
    ? allAssets
    : allAssets.filter((a) => a.category === activeFilter);

  const counts: Record<string, number> = {};
  for (const a of allAssets) {
    counts[a.category] = (counts[a.category] ?? 0) + 1;
  }

  const catColor = (cat: string): string =>
    CATEGORY_COLOR[(cat as AssetCategory)] ?? "#2B7FFF";

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: topPad, paddingBottom: bottomPad }}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={colors.primary}
        />
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
          <View style={styles.center}>
            <ActivityIndicator color={colors.primary} />
          </View>
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
              <AssetCard key={asset.id} asset={asset} colors={colors} catColor={catColor} />
            ))}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

function AssetCard({
  asset,
  colors,
  catColor,
}: {
  asset: ApiAsset;
  colors: ReturnType<typeof useColors>;
  catColor: (c: string) => string;
}) {
  const [imgError, setImgError] = useState(false);
  const color = catColor(asset.category);
  const icon = CATEGORY_ICON[(asset.category as AssetCategory)] ?? "image";
  const hasImage = !!asset.url && !imgError;

  return (
    <View style={[styles.assetCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  inner: { paddingHorizontal: 20, gap: 16 },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
  },
  statsRow: { marginHorizontal: -20, paddingHorizontal: 20 },
  statChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  statDot: { width: 7, height: 7, borderRadius: 4 },
  statCount: { fontSize: 14, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  filterRow: { marginHorizontal: -20, paddingHorizontal: 20 },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  filterText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  center: { alignItems: "center", paddingVertical: 60 },
  emptyCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 32,
    alignItems: "center",
    gap: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  emptyBody: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  assetCard: {
    width: "47%",
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  thumb: {
    width: "100%",
    aspectRatio: 1,
  },
  thumbImage: {
    width: "100%",
    height: "100%",
  },
  thumbFallback: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  assetMeta: {
    padding: 10,
    gap: 4,
  },
  categoryChip: {
    alignSelf: "flex-start",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  categoryChipText: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
  assetName: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    lineHeight: 16,
  },
  assetTime: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
});
