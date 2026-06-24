import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

type Category = "all" | "templates" | "assets" | "agents" | "plugins" | "exports";

const CATEGORIES: { label: string; value: Category; icon: string }[] = [
  { label: "All", value: "all", icon: "grid" },
  { label: "Templates", value: "templates", icon: "layout" },
  { label: "Assets", value: "assets", icon: "image" },
  { label: "AI Agents", value: "agents", icon: "cpu" },
  { label: "Plugins", value: "plugins", icon: "package" },
  { label: "Export Modules", value: "exports", icon: "upload" },
];

interface MarketItem {
  id: string;
  name: string;
  author: string;
  category: Exclude<Category, "all">;
  rating: number;
  reviews: number;
  price: string;
  badge?: string;
  description: string;
  tags: string[];
}

const ITEMS: MarketItem[] = [
  {
    id: "1", name: "Dark Fantasy Starter", author: "ForgeStudio", category: "templates",
    rating: 4.9, reviews: 2341, price: "Free", badge: "HOT",
    description: "Complete dark fantasy RPG template with 200+ assets, story arc, and combat system.",
    tags: ["RPG", "Dark Fantasy", "Pixel Art"],
  },
  {
    id: "2", name: "Cyberpunk Asset Pack", author: "NeonForge", category: "assets",
    rating: 4.7, reviews: 891, price: "$4.99",
    description: "500 cyberpunk sprites, backgrounds, UI elements, and sound effects.",
    tags: ["Cyberpunk", "Sprites", "Audio"],
  },
  {
    id: "3", name: "Boss AI Agent Pro", author: "AILabs", category: "agents",
    rating: 4.8, reviews: 456, price: "$9.99", badge: "NEW",
    description: "Advanced boss designer agent with multi-phase attacks and cinematic sequences.",
    tags: ["Bosses", "Combat", "AI"],
  },
  {
    id: "4", name: "Procedural Dungeon Generator", author: "DungeonCraft", category: "plugins",
    rating: 4.6, reviews: 1234, price: "$2.99",
    description: "Real-time dungeon generation with customizable biomes, traps, and puzzles.",
    tags: ["Procedural", "Dungeons", "Plugin"],
  },
  {
    id: "5", name: "Godot Export Module", author: "ExportMaster", category: "exports",
    rating: 4.9, reviews: 3421, price: "Free", badge: "OFFICIAL",
    description: "One-click Godot 4.x export with full scene conversion and asset optimization.",
    tags: ["Godot", "Export", "Official"],
  },
  {
    id: "6", name: "Cozy Farm Template", author: "CozyDev", category: "templates",
    rating: 4.5, reviews: 672, price: "Free",
    description: "Complete farming simulation with day/night cycles, seasons, and crop systems.",
    tags: ["Simulation", "Cozy", "Pixel Art"],
  },
  {
    id: "7", name: "Orchestral Music Pack", author: "SoundForge", category: "assets",
    rating: 4.8, reviews: 1122, price: "$7.99",
    description: "120 original orchestral tracks for RPG, adventure, and combat scenes.",
    tags: ["Audio", "Music", "Orchestral"],
  },
  {
    id: "8", name: "Story AI Agent Elite", author: "NarrativeLabs", category: "agents",
    rating: 4.7, reviews: 334, price: "$14.99", badge: "PRO",
    description: "Advanced narrative agent with branching dialogue, character arcs, and world lore.",
    tags: ["Story", "Narrative", "AI"],
  },
];

const BADGE_COLORS: Record<string, string> = {
  HOT: "#EF4444",
  NEW: "#22C55E",
  OFFICIAL: "#2B7FFF",
  PRO: "#7B2FFF",
};

function StarRating({ rating }: { rating: number }) {
  const colors = useColors();
  return (
    <View style={styles.stars}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Feather key={i} name="star" size={10} color={i <= Math.round(rating) ? "#F97316" : colors.border} />
      ))}
      <Text style={[styles.ratingText, { color: colors.mutedForeground }]}>{rating}</Text>
    </View>
  );
}

function ItemCard({ item }: { item: MarketItem }) {
  const colors = useColors();
  const [installed, setInstalled] = useState(false);

  return (
    <View style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <View style={styles.itemCardHeader}>
        <View style={[styles.itemIconBox, { backgroundColor: colors.muted }]}>
          <Feather
            name={CATEGORIES.find((c) => c.value === item.category)?.icon as any ?? "box"}
            size={20}
            color={colors.primary}
          />
        </View>
        {item.badge && (
          <View style={[styles.badgeChip, { backgroundColor: BADGE_COLORS[item.badge] ?? colors.primary }]}>
            <Text style={styles.badgeText}>{item.badge}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.itemName, { color: colors.foreground }]}>{item.name}</Text>
      <Text style={[styles.itemAuthor, { color: colors.mutedForeground }]}>by {item.author}</Text>
      <Text style={[styles.itemDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
        {item.description}
      </Text>
      <View style={styles.tagsRow}>
        {item.tags.slice(0, 2).map((tag) => (
          <View key={tag} style={[styles.tag, { backgroundColor: colors.muted }]}>
            <Text style={[styles.tagText, { color: colors.mutedForeground }]}>{tag}</Text>
          </View>
        ))}
      </View>
      <StarRating rating={item.rating} />
      <View style={styles.itemFooter}>
        <Text style={[styles.price, { color: item.price === "Free" ? colors.success : colors.foreground }]}>
          {item.price}
        </Text>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setInstalled((v) => !v);
          }}
          style={[
            styles.installBtn,
            { backgroundColor: installed ? colors.success : colors.primary },
          ]}
        >
          <Feather name={installed ? "check" : "download"} size={13} color="#fff" />
          <Text style={styles.installText}>{installed ? "Installed" : "Install"}</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function MarketplaceScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [category, setCategory] = useState<Category>("all");
  const [search, setSearch] = useState("");

  const topPad = Platform.OS === "web" ? 67 : insets.top + 16;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 16;

  const filtered = ITEMS.filter((item) => {
    const matchCat = category === "all" || item.category === category;
    const matchSearch = !search || item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.description.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const featured = ITEMS.find((i) => i.badge === "HOT");

  return (
    <ScrollView
      style={[styles.scroll, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingTop: topPad, paddingBottom: bottomPad }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.inner}>
        {/* Header */}
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.title, { color: colors.foreground }]}>Marketplace</Text>
          <View style={{ width: 22 }} />
        </View>

        {/* Search */}
        <View style={[styles.searchWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search templates, assets, agents..."
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Featured Banner */}
        {featured && (
          <View style={[styles.featured, { backgroundColor: colors.primary + "22", borderColor: colors.primary }]}>
            <View style={styles.featuredLeft}>
              <Text style={[styles.featuredLabel, { color: colors.primary }]}>FEATURED</Text>
              <Text style={[styles.featuredTitle, { color: colors.foreground }]}>{featured.name}</Text>
              <Text style={[styles.featuredDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
                {featured.description}
              </Text>
            </View>
            <Pressable style={[styles.featuredBtn, { backgroundColor: colors.primary }]}>
              <Text style={styles.featuredBtnText}>Get Now</Text>
            </Pressable>
          </View>
        )}

        {/* Categories */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catRow}>
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat.value}
              onPress={() => setCategory(cat.value)}
              style={[
                styles.catChip,
                {
                  backgroundColor: category === cat.value ? colors.primary : colors.card,
                  borderColor: category === cat.value ? colors.primary : colors.border,
                },
              ]}
            >
              <Feather
                name={cat.icon as any}
                size={13}
                color={category === cat.value ? "#fff" : colors.mutedForeground}
              />
              <Text style={[styles.catText, { color: category === cat.value ? "#fff" : colors.mutedForeground }]}>
                {cat.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Grid */}
        <View style={styles.grid}>
          {filtered.map((item) => <ItemCard key={item.id} item={item} />)}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  inner: { paddingHorizontal: 16, gap: 16 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: 22, fontFamily: "Inter_700Bold" },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  featured: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 16,
    gap: 12,
  },
  featuredLeft: { flex: 1, gap: 4 },
  featuredLabel: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 0.8 },
  featuredTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  featuredDesc: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  featuredBtn: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10 },
  featuredBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#fff" },
  catRow: { marginHorizontal: -16, paddingHorizontal: 16 },
  catChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  catText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  itemCard: {
    width: "47%",
    borderRadius: 14,
    borderWidth: 1,
    padding: 14,
    gap: 7,
  },
  itemCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  itemIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeChip: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  badgeText: { fontSize: 9, fontFamily: "Inter_700Bold", color: "#fff", letterSpacing: 0.4 },
  itemName: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  itemAuthor: { fontSize: 11, fontFamily: "Inter_400Regular" },
  itemDesc: { fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 15 },
  tagsRow: { flexDirection: "row", gap: 4, flexWrap: "wrap" },
  tag: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  tagText: { fontSize: 10, fontFamily: "Inter_500Medium" },
  stars: { flexDirection: "row", alignItems: "center", gap: 2 },
  ratingText: { fontSize: 11, fontFamily: "Inter_400Regular", marginLeft: 2 },
  itemFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 2 },
  price: { fontSize: 13, fontFamily: "Inter_700Bold" },
  installBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  installText: { fontSize: 11, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
