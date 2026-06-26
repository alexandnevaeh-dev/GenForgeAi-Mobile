import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

const { width: SCREEN_W } = Dimensions.get("window");

type Category = "all" | "templates" | "assets" | "agents" | "plugins" | "exports";

const CATEGORIES: { label: string; value: Category; icon: string }[] = [
  { label: "All",            value: "all",       icon: "grid" },
  { label: "Templates",      value: "templates",  icon: "layout" },
  { label: "Assets",         value: "assets",     icon: "image" },
  { label: "AI Agents",      value: "agents",     icon: "cpu" },
  { label: "Plugins",        value: "plugins",    icon: "package" },
  { label: "Export Modules", value: "exports",    icon: "upload" },
];

const BADGE_COLORS: Record<string, string> = {
  HOT:      "#EF4444",
  NEW:      "#22C55E",
  OFFICIAL: "#2B7FFF",
  PRO:      "#7B2FFF",
};

interface ApiTemplate {
  id: string;
  title: string;
  author: string;
  description: string;
  genre: string;
  artStyle: string;
  difficulty: string;
  category: string;
  tags: string[];
  rating: number;
  reviewCount: number;
  usageCount: number;
  isPremium: boolean;
  priceCents: number;
  badge: string | null;
  promptHint: string;
  coverImageUrl: string | null;
  createdAt: string;
}

function priceLabel(t: ApiTemplate): string {
  if (!t.isPremium || t.priceCents === 0) return "Free";
  return `$${(t.priceCents / 100).toFixed(2)}`;
}

function StarRating({ rating }: { rating: number }) {
  const colors = useColors();
  const stars = Math.round(rating / 10);
  return (
    <View style={styles.stars}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Feather key={i} name="star" size={10} color={i <= stars ? "#F97316" : colors.border} />
      ))}
      <Text style={[styles.ratingNum, { color: colors.mutedForeground }]}>
        {(rating / 10).toFixed(1)}
      </Text>
    </View>
  );
}

function TemplateCard({
  item,
  onPress,
}: {
  item: ApiTemplate;
  onPress: () => void;
}) {
  const colors = useColors();
  const price = priceLabel(item);

  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.iconBox, { backgroundColor: colors.muted }]}>
          <Feather name="layout" size={20} color={colors.primary} />
        </View>
        {item.badge && (
          <View style={[styles.badgeChip, { backgroundColor: BADGE_COLORS[item.badge] ?? colors.primary }]}>
            <Text style={styles.badgeText}>{item.badge}</Text>
          </View>
        )}
      </View>
      <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={2}>
        {item.title}
      </Text>
      <Text style={[styles.cardAuthor, { color: colors.mutedForeground }]}>by {item.author}</Text>
      <Text style={[styles.cardDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
        {item.description}
      </Text>
      <View style={styles.tagsRow}>
        {item.tags.slice(0, 2).map((tag) => (
          <View key={tag} style={[styles.tagPill, { backgroundColor: colors.muted }]}>
            <Text style={[styles.tagText, { color: colors.mutedForeground }]}>{tag}</Text>
          </View>
        ))}
      </View>
      <StarRating rating={item.rating} />
      <View style={styles.cardFooter}>
        <Text style={[styles.price, { color: price === "Free" ? "#22C55E" : colors.foreground }]}>
          {price}
        </Text>
        <View style={[styles.genreChip, { backgroundColor: colors.primary + "22" }]}>
          <Text style={[styles.genreText, { color: colors.primary }]}>{item.genre}</Text>
        </View>
      </View>
    </Pressable>
  );
}

function TemplateDetailModal({
  template,
  onClose,
  onUse,
  loading,
}: {
  template: ApiTemplate | null;
  onClose: () => void;
  onUse: (tpl: ApiTemplate, customPrompt?: string) => void;
  loading: boolean;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [customPrompt, setCustomPrompt] = useState("");

  useEffect(() => {
    if (template) setCustomPrompt("");
  }, [template]);

  if (!template) return null;
  const price = priceLabel(template);

  return (
    <Modal visible={!!template} animationType="slide" transparent onRequestClose={onClose}>
      <View style={[styles.detailOverlay]}>
        <Pressable style={styles.detailBackdrop} onPress={onClose} />
        <View style={[styles.detailSheet, { backgroundColor: colors.card, paddingBottom: insets.bottom + 24 }]}>
          {/* Handle */}
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: "100%" }}>
            {/* Header */}
            <View style={styles.detailHeader}>
              <View style={[styles.detailIconBig, { backgroundColor: colors.muted }]}>
                <Feather name="layout" size={28} color={colors.primary} />
              </View>
              <View style={styles.detailHeaderText}>
                <Text style={[styles.detailTitle, { color: colors.foreground }]}>{template.title}</Text>
                <Text style={[styles.detailAuthor, { color: colors.mutedForeground }]}>by {template.author}</Text>
              </View>
              {template.badge && (
                <View style={[styles.badgeChip, { backgroundColor: BADGE_COLORS[template.badge] ?? colors.primary }]}>
                  <Text style={styles.badgeText}>{template.badge}</Text>
                </View>
              )}
            </View>

            {/* Stats row */}
            <View style={styles.statsRow}>
              {[
                { icon: "star", val: (template.rating / 10).toFixed(1), label: "Rating" },
                { icon: "users", val: template.reviewCount.toLocaleString(), label: "Reviews" },
                { icon: "download", val: template.usageCount.toLocaleString(), label: "Uses" },
              ].map(({ icon, val, label }) => (
                <View key={label} style={[styles.statBox, { backgroundColor: colors.muted }]}>
                  <Feather name={icon as any} size={14} color={colors.primary} />
                  <Text style={[styles.statVal, { color: colors.foreground }]}>{val}</Text>
                  <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
                </View>
              ))}
            </View>

            {/* Meta chips */}
            <View style={styles.metaRow}>
              {[
                { icon: "tag", val: template.genre },
                { icon: "pen-tool", val: template.artStyle },
                { icon: "bar-chart-2", val: template.difficulty },
              ].map(({ icon, val }) => (
                <View key={val} style={[styles.metaChip, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                  <Feather name={icon as any} size={11} color={colors.mutedForeground} />
                  <Text style={[styles.metaChipText, { color: colors.mutedForeground }]}>{val}</Text>
                </View>
              ))}
            </View>

            {/* Description */}
            <Text style={[styles.detailSectionTitle, { color: colors.foreground }]}>About</Text>
            <Text style={[styles.detailDesc, { color: colors.mutedForeground }]}>{template.description}</Text>

            {/* Tags */}
            <Text style={[styles.detailSectionTitle, { color: colors.foreground }]}>Tags</Text>
            <View style={styles.tagsRow}>
              {template.tags.map((tag) => (
                <View key={tag} style={[styles.tagPill, { backgroundColor: colors.muted }]}>
                  <Text style={[styles.tagText, { color: colors.mutedForeground }]}>{tag}</Text>
                </View>
              ))}
            </View>

            {/* Custom prompt */}
            <Text style={[styles.detailSectionTitle, { color: colors.foreground }]}>
              Customize (optional)
            </Text>
            <Text style={[styles.hintText, { color: colors.mutedForeground }]}>
              Add your own twist to the template prompt, or leave blank to use the default.
            </Text>
            <View style={[styles.promptInput, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <TextInput
                style={[styles.promptInputText, { color: colors.foreground }]}
                placeholder={template.promptHint.slice(0, 100) + "…"}
                placeholderTextColor={colors.mutedForeground}
                value={customPrompt}
                onChangeText={setCustomPrompt}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* CTA */}
            <View style={styles.detailActions}>
              <Pressable onPress={onClose} style={[styles.cancelBtn, { borderColor: colors.border }]}>
                <Text style={[styles.cancelBtnText, { color: colors.mutedForeground }]}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() => onUse(template, customPrompt.trim() || undefined)}
                disabled={loading}
                style={[styles.useBtn, { backgroundColor: colors.primary }]}
              >
                {loading
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <>
                      <Feather name="zap" size={15} color="#fff" />
                      <Text style={styles.useBtnText}>
                        {price === "Free" ? "Use Template" : `Use · ${price}`}
                      </Text>
                    </>}
              </Pressable>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default function MarketplaceScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { accessToken } = useAuth();

  const [templates, setTemplates] = useState<ApiTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<Category>("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<ApiTemplate | null>(null);
  const [using, setUsing] = useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top + 16;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 24;

  const fetchTemplates = useCallback(async (cat?: string, q?: string) => {
    try {
      const params = new URLSearchParams();
      if (cat && cat !== "all") params.set("category", cat);
      if (q) params.set("search", q);
      const res = await fetch(`/api/templates?${params}`);
      if (!res.ok) throw new Error("Failed to load templates");
      const data = (await res.json()) as { templates: ApiTemplate[] };
      setTemplates(data.templates);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load templates");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { void fetchTemplates(category, search); }, [fetchTemplates, category, search]);
  const onRefresh = useCallback(() => { setRefreshing(true); void fetchTemplates(category, search); }, [fetchTemplates, category, search]);

  const handleUse = useCallback(async (tpl: ApiTemplate, customPrompt?: string) => {
    if (!accessToken) {
      Alert.alert("Sign in required", "Please sign in to use templates.");
      return;
    }
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setUsing(true);
    try {
      const res = await fetch(`/api/templates/${tpl.id}/use`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ customPrompt }),
      });
      if (!res.ok) {
        const d = (await res.json()) as { error?: string };
        throw new Error(d.error ?? "Failed to start project");
      }
      const data = (await res.json()) as { project: { id: string } };
      setSelected(null);
      router.push(`/project/${data.project.id}` as any);
    } catch (e) {
      Alert.alert("Error", e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setUsing(false);
    }
  }, [accessToken]);

  const featured = templates.find((t) => t.badge === "HOT") ?? templates[0];

  const filtered = templates.filter((t) => {
    if (category !== "all" && t.category !== category) return false;
    if (search) {
      const q = search.toLowerCase();
      return t.title.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <>
      <TemplateDetailModal
        template={selected}
        onClose={() => setSelected(null)}
        onUse={handleUse}
        loading={using}
      />

      <ScrollView
        style={[styles.scroll, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingTop: topPad, paddingBottom: bottomPad }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        <View style={styles.inner}>
          {/* Header */}
          <View style={styles.headerRow}>
            <Pressable onPress={() => router.canGoBack() ? router.back() : router.push("/(tabs)" as any)}>
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
              placeholder="Search templates..."
              placeholderTextColor={colors.mutedForeground}
              value={search}
              onChangeText={setSearch}
            />
            {search.length > 0 && (
              <Pressable onPress={() => setSearch("")}>
                <Feather name="x" size={15} color={colors.mutedForeground} />
              </Pressable>
            )}
          </View>

          {/* Featured Banner */}
          {!loading && featured && (
            <Pressable
              onPress={() => setSelected(featured)}
              style={[styles.featured, { backgroundColor: colors.primary + "18", borderColor: colors.primary + "66" }]}
            >
              <View style={styles.featuredLeft}>
                <Text style={[styles.featuredLabel, { color: colors.primary }]}>⚡ FEATURED</Text>
                <Text style={[styles.featuredTitle, { color: colors.foreground }]} numberOfLines={1}>
                  {featured.title}
                </Text>
                <Text style={[styles.featuredDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
                  {featured.description}
                </Text>
                <View style={styles.featuredMeta}>
                  <Feather name="star" size={12} color="#F97316" />
                  <Text style={[styles.featuredRating, { color: colors.mutedForeground }]}>
                    {(featured.rating / 10).toFixed(1)} · {featured.usageCount.toLocaleString()} uses
                  </Text>
                </View>
              </View>
              <View style={[styles.featuredBtn, { backgroundColor: colors.primary }]}>
                <Text style={styles.featuredBtnText}>
                  {priceLabel(featured) === "Free" ? "Get Free" : priceLabel(featured)}
                </Text>
              </View>
            </Pressable>
          )}

          {/* Category Filters */}
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
                <Feather name={cat.icon as any} size={13} color={category === cat.value ? "#fff" : colors.mutedForeground} />
                <Text style={[styles.catText, { color: category === cat.value ? "#fff" : colors.mutedForeground }]}>
                  {cat.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>

          {/* Content */}
          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : error ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="alert-circle" size={28} color="#EF4444" />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Couldn't load templates</Text>
              <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>{error}</Text>
            </View>
          ) : filtered.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="search" size={28} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No results</Text>
              <Text style={[styles.emptyBody, { color: colors.mutedForeground }]}>
                Try a different filter or search term.
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.resultsRow}>
                <Text style={[styles.resultsLabel, { color: colors.mutedForeground }]}>
                  {filtered.length} {filtered.length === 1 ? "result" : "results"}
                </Text>
              </View>
              <View style={styles.grid}>
                {filtered.map((item) => (
                  <TemplateCard key={item.id} item={item} onPress={() => setSelected(item)} />
                ))}
              </View>
            </>
          )}
        </View>
      </ScrollView>
    </>
  );
}

const CARD_W = (SCREEN_W - 32 - 40 - 12) / 2;

const styles = StyleSheet.create({
  scroll: { flex: 1 },
  inner: { paddingHorizontal: 20, gap: 16 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontSize: 22, fontFamily: "Inter_700Bold" },
  searchWrap: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  featured: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 16, borderWidth: 1.5, padding: 16, gap: 12,
  },
  featuredLeft: { flex: 1, gap: 5 },
  featuredLabel: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 0.8 },
  featuredTitle: { fontSize: 16, fontFamily: "Inter_700Bold" },
  featuredDesc: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  featuredMeta: { flexDirection: "row", alignItems: "center", gap: 4 },
  featuredRating: { fontSize: 11, fontFamily: "Inter_400Regular" },
  featuredBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, alignItems: "center" },
  featuredBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#fff" },
  catRow: { marginHorizontal: -20, paddingHorizontal: 20 },
  catChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: 20, borderWidth: 1, marginRight: 8,
  },
  catText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  center: { alignItems: "center", paddingVertical: 60 },
  emptyCard: { borderRadius: 16, borderWidth: 1, padding: 32, alignItems: "center", gap: 10 },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", textAlign: "center" },
  emptyBody: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 19 },
  resultsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  resultsLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  card: { width: CARD_W, borderRadius: 14, borderWidth: 1, padding: 13, gap: 7 },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  iconBox: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  badgeChip: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 5 },
  badgeText: { fontSize: 9, fontFamily: "Inter_700Bold", color: "#fff", letterSpacing: 0.4 },
  cardTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold", lineHeight: 18 },
  cardAuthor: { fontSize: 11, fontFamily: "Inter_400Regular" },
  cardDesc: { fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 15 },
  tagsRow: { flexDirection: "row", gap: 5, flexWrap: "wrap" },
  tagPill: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5 },
  tagText: { fontSize: 10, fontFamily: "Inter_500Medium" },
  stars: { flexDirection: "row", alignItems: "center", gap: 2 },
  ratingNum: { fontSize: 11, fontFamily: "Inter_400Regular", marginLeft: 3 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 2 },
  price: { fontSize: 13, fontFamily: "Inter_700Bold" },
  genreChip: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5 },
  genreText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  // Detail modal
  detailOverlay: { flex: 1, justifyContent: "flex-end" },
  detailBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "#000000BB" },
  detailSheet: {
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingHorizontal: 20, paddingTop: 12, maxHeight: "90%",
  },
  handle: { width: 36, height: 4, borderRadius: 2, alignSelf: "center", marginBottom: 16 },
  detailHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12, marginBottom: 16 },
  detailIconBig: { width: 52, height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  detailHeaderText: { flex: 1 },
  detailTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  detailAuthor: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  statsRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  statBox: {
    flex: 1, alignItems: "center", gap: 3,
    paddingVertical: 10, borderRadius: 12,
  },
  statVal: { fontSize: 14, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 10, fontFamily: "Inter_400Regular" },
  metaRow: { flexDirection: "row", gap: 8, flexWrap: "wrap", marginBottom: 16 },
  metaChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1,
  },
  metaChipText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  detailSectionTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginBottom: 6, marginTop: 8 },
  detailDesc: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20, marginBottom: 6 },
  hintText: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17, marginBottom: 8 },
  promptInput: {
    borderRadius: 12, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 12, marginBottom: 16,
  },
  promptInputText: { fontSize: 13, fontFamily: "Inter_400Regular", minHeight: 72 },
  detailActions: { flexDirection: "row", gap: 12, marginTop: 4 },
  cancelBtn: {
    flex: 1, alignItems: "center", justifyContent: "center",
    paddingVertical: 14, borderRadius: 14, borderWidth: 1,
  },
  cancelBtnText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  useBtn: {
    flex: 2, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 14, borderRadius: 14,
  },
  useBtnText: { fontSize: 15, fontFamily: "Inter_700Bold", color: "#fff" },
});
