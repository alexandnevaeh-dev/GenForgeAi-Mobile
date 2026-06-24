import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

type AssetType = "all" | "sprites" | "audio" | "maps" | "scripts" | "dialogs";

const FILTERS: { label: string; value: AssetType; icon: string }[] = [
  { label: "All", value: "all", icon: "grid" },
  { label: "Sprites", value: "sprites", icon: "image" },
  { label: "Audio", value: "audio", icon: "music" },
  { label: "Maps", value: "maps", icon: "map" },
  { label: "Scripts", value: "scripts", icon: "code" },
  { label: "Dialogs", value: "dialogs", icon: "message-circle" },
];

interface Asset {
  id: string;
  name: string;
  type: Exclude<AssetType, "all">;
  project: string;
  size: string;
  generated: string;
}

const MOCK_ASSETS: Asset[] = [
  { id: "1", name: "hero_idle_spritesheet", type: "sprites", project: "Shadow Rift Chronicles", size: "248 KB", generated: "2h ago" },
  { id: "2", name: "dark_forest_theme.ogg", type: "audio", project: "Shadow Rift Chronicles", size: "1.2 MB", generated: "2h ago" },
  { id: "3", name: "castle_level_01.json", type: "maps", project: "Shadow Rift Chronicles", size: "84 KB", generated: "3h ago" },
  { id: "4", name: "enemy_ai_behavior.lua", type: "scripts", project: "Shadow Rift Chronicles", size: "12 KB", generated: "3h ago" },
  { id: "5", name: "npc_tavern_keeper.json", type: "dialogs", project: "Shadow Rift Chronicles", size: "36 KB", generated: "4h ago" },
  { id: "6", name: "player_run_animation", type: "sprites", project: "Neon Runners", size: "512 KB", generated: "1d ago" },
  { id: "7", name: "neon_city_ambient.ogg", type: "audio", project: "Neon Runners", size: "2.1 MB", generated: "1d ago" },
  { id: "8", name: "boss_encounter.lua", type: "scripts", project: "Neon Runners", size: "28 KB", generated: "1d ago" },
];

const ASSET_ICON: Record<Exclude<AssetType, "all">, string> = {
  sprites: "image",
  audio: "music",
  maps: "map",
  scripts: "code",
  dialogs: "message-circle",
};

const ASSET_COLOR: Record<Exclude<AssetType, "all">, string> = {
  sprites: "#2B7FFF",
  audio: "#7B2FFF",
  maps: "#00D4FF",
  scripts: "#22C55E",
  dialogs: "#F97316",
};

export default function AssetsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [activeFilter, setActiveFilter] = useState<AssetType>("all");

  const topPad = Platform.OS === "web" ? 67 : insets.top + 16;
  const bottomPad = Platform.OS === "web" ? 34 + 84 : insets.bottom + 84;

  const filtered = MOCK_ASSETS.filter(
    (a) => activeFilter === "all" || a.type === activeFilter
  );

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: topPad, paddingBottom: bottomPad }}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.inner}>
        <Text style={[styles.title, { color: colors.foreground }]}>Assets</Text>

        {/* Stats */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsRow}>
          {[
            { label: "Sprites", count: 2, color: ASSET_COLOR.sprites },
            { label: "Audio", count: 2, color: ASSET_COLOR.audio },
            { label: "Maps", count: 1, color: ASSET_COLOR.maps },
            { label: "Scripts", count: 2, color: ASSET_COLOR.scripts },
            { label: "Dialogs", count: 1, color: ASSET_COLOR.dialogs },
          ].map((s) => (
            <View key={s.label} style={[styles.statChip, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.statDot, { backgroundColor: s.color }]} />
              <Text style={[styles.statCount, { color: colors.foreground }]}>{s.count}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
            </View>
          ))}
        </ScrollView>

        {/* Filters */}
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

        {/* Asset List */}
        <View style={styles.list}>
          {filtered.map((asset) => (
            <Pressable key={asset.id} style={[styles.assetRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.assetIcon, { backgroundColor: ASSET_COLOR[asset.type] + "22" }]}>
                <Feather
                  name={ASSET_ICON[asset.type] as any}
                  size={18}
                  color={ASSET_COLOR[asset.type]}
                />
              </View>
              <View style={styles.assetInfo}>
                <Text style={[styles.assetName, { color: colors.foreground }]} numberOfLines={1}>
                  {asset.name}
                </Text>
                <Text style={[styles.assetMeta, { color: colors.mutedForeground }]}>
                  {asset.project} · {asset.size} · {asset.generated}
                </Text>
              </View>
              <Pressable style={styles.downloadBtn}>
                <Feather name="download" size={16} color={colors.mutedForeground} />
              </Pressable>
            </Pressable>
          ))}
        </View>
      </View>
    </ScrollView>
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
  statDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  statCount: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
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
  filterText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  list: { gap: 0 },
  assetRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  assetIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  assetInfo: { flex: 1 },
  assetName: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  assetMeta: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  downloadBtn: {
    padding: 8,
  },
});
