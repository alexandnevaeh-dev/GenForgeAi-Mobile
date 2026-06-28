import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

type Platform = "google-play" | "app-store" | "steam" | "itch-io" | "epic" | "direct";

interface StoreListing {
  platform: string;
  titles: string[];
  shortDescription: string;
  fullDescription: string;
  keywords: string[];
  features: string[];
  screenshotCaptions: string[];
  releaseNotes: string;
  privacyPolicySummary: string;
  ageRating: string;
  ageRatingReason: string;
  promotionalText: string;
}

interface Props {
  projectId: string;
  platform: Platform;
  onBack: () => void;
}

const PLATFORM_LABELS: Record<Platform, string> = {
  "google-play": "Google Play",
  "app-store":   "App Store",
  "steam":       "Steam",
  "itch-io":     "itch.io",
  "epic":        "Epic Games",
  "direct":      "Direct",
};

const PLATFORM_COLORS: Record<Platform, string> = {
  "google-play": "#34A853",
  "app-store":   "#0A84FF",
  "steam":       "#66B0F0",
  "itch-io":     "#FA5C5C",
  "epic":        "#8B8B8B",
  "direct":      "#7B2FFF",
};

const AGE_COLORS: Record<string, string> = {
  E: "#22C55E", "E10+": "#22C55E", T: "#FBBF24", M: "#F97316", AO: "#EF4444",
};

export function StoreListingPanel({ projectId, platform, onBack }: Props) {
  const colors = useColors();
  const { accessToken } = useAuth();

  const [listing, setListing] = useState<StoreListing | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTitle, setSelectedTitle] = useState(0);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const accentColor = PLATFORM_COLORS[platform];

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/projects/${projectId}/publish/store-listing`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
        body: JSON.stringify({ platform }),
      });
      if (!res.ok) throw new Error(await res.text());
      setListing(await res.json());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed");
    } finally {
      setLoading(false);
    }
  }

  function markCopied(field: string) {
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 1800);
  }

  function CopyBtn({ field, value }: { field: string; value: string }) {
    const copied = copiedField === field;
    return (
      <Pressable
        onPress={() => markCopied(field)}
        style={[styles.copyBtn, { backgroundColor: copied ? "#22C55E22" : accentColor + "18" }]}
      >
        <Feather name={copied ? "check" : "copy"} size={12} color={copied ? "#22C55E" : accentColor} />
        <Text style={[styles.copyBtnText, { color: copied ? "#22C55E" : accentColor }]}>
          {copied ? "Copied" : "Copy"}
        </Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Pressable onPress={onBack} style={styles.backBtn}>
          <Feather name="arrow-left" size={18} color={colors.foreground} />
        </Pressable>
        <View style={[styles.platformBadge, { backgroundColor: accentColor + "20", borderColor: accentColor }]}>
          <Text style={[styles.platformBadgeText, { color: accentColor }]}>{PLATFORM_LABELS[platform]} Listing</Text>
        </View>
      </View>

      {!listing && !loading && (
        <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="file-text" size={32} color={accentColor} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Generate Store Listing</Text>
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            AI will write a complete {PLATFORM_LABELS[platform]} store listing — title, description, keywords, captions, release notes, and age rating.
          </Text>
          <Pressable
            onPress={generate}
            style={[styles.generateBtn, { backgroundColor: accentColor }]}
          >
            <Feather name="zap" size={15} color="#fff" />
            <Text style={styles.generateBtnText}>Generate Listing</Text>
          </Pressable>
        </View>
      )}

      {loading && (
        <View style={[styles.loadingCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <ActivityIndicator color={accentColor} size="large" />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>Writing your store listing…</Text>
        </View>
      )}

      {error && (
        <View style={[styles.errorBanner, { backgroundColor: colors.destructive + "18", borderColor: colors.destructive }]}>
          <Feather name="alert-circle" size={13} color={colors.destructive} />
          <Text style={[styles.errorText, { color: colors.destructive }]}>{error}</Text>
        </View>
      )}

      {listing && (
        <View style={styles.listingContent}>
          {/* Age rating */}
          <View style={styles.ageRow}>
            <View style={[styles.ageChip, { backgroundColor: (AGE_COLORS[listing.ageRating] ?? "#6B6B80") + "22", borderColor: AGE_COLORS[listing.ageRating] ?? "#6B6B80" }]}>
              <Text style={[styles.ageText, { color: AGE_COLORS[listing.ageRating] ?? "#6B6B80" }]}>
                {listing.ageRating}
              </Text>
            </View>
            <Text style={[styles.ageReason, { color: colors.mutedForeground }]}>{listing.ageRatingReason}</Text>
          </View>

          {/* Title alternatives */}
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Title Options</Text>
            </View>
            {listing.titles.map((t, i) => (
              <Pressable
                key={i}
                onPress={() => setSelectedTitle(i)}
                style={[styles.titleOption, {
                  backgroundColor: selectedTitle === i ? accentColor + "18" : "transparent",
                  borderColor: selectedTitle === i ? accentColor : colors.border,
                }]}
              >
                <Feather name={selectedTitle === i ? "check-circle" : "circle"} size={14} color={selectedTitle === i ? accentColor : colors.mutedForeground} />
                <Text style={[styles.titleText, { color: selectedTitle === i ? accentColor : colors.foreground }]}>{t}</Text>
              </Pressable>
            ))}
          </View>

          {/* Promotional text */}
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Promotional Text</Text>
              <CopyBtn field="promo" value={listing.promotionalText} />
            </View>
            <Text style={[styles.bodyText, { color: colors.mutedForeground }]}>{listing.promotionalText}</Text>
          </View>

          {/* Short description */}
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Short Description</Text>
              <CopyBtn field="short" value={listing.shortDescription} />
            </View>
            <Text style={[styles.bodyText, { color: colors.mutedForeground }]}>{listing.shortDescription}</Text>
            <Text style={[styles.charCount, { color: listing.shortDescription.length <= 80 ? "#22C55E" : "#EF4444" }]}>
              {listing.shortDescription.length}/80 chars
            </Text>
          </View>

          {/* Full description */}
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Full Description</Text>
              <CopyBtn field="full" value={listing.fullDescription} />
            </View>
            <Text style={[styles.bodyText, { color: colors.mutedForeground }]}>{listing.fullDescription}</Text>
          </View>

          {/* Keywords */}
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Keywords</Text>
              <CopyBtn field="keywords" value={listing.keywords.join(", ")} />
            </View>
            <View style={styles.tagWrap}>
              {listing.keywords.map((kw, i) => (
                <View key={i} style={[styles.tag, { backgroundColor: accentColor + "18", borderColor: accentColor + "44" }]}>
                  <Text style={[styles.tagText, { color: accentColor }]}>{kw}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Features */}
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Feature Highlights</Text>
              <CopyBtn field="features" value={listing.features.map((f) => `• ${f}`).join("\n")} />
            </View>
            {listing.features.map((f, i) => (
              <View key={i} style={styles.bulletRow}>
                <Feather name="check" size={13} color={accentColor} />
                <Text style={[styles.bulletText, { color: colors.mutedForeground }]}>{f}</Text>
              </View>
            ))}
          </View>

          {/* Screenshot captions */}
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Screenshot Captions</Text>
            {listing.screenshotCaptions.map((cap, i) => (
              <View key={i} style={styles.captionRow}>
                <View style={[styles.captionNum, { backgroundColor: accentColor + "22" }]}>
                  <Text style={[styles.captionNumText, { color: accentColor }]}>{i + 1}</Text>
                </View>
                <Text style={[styles.captionText, { color: colors.foreground }]}>{cap}</Text>
              </View>
            ))}
          </View>

          {/* Release notes */}
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Release Notes</Text>
              <CopyBtn field="notes" value={listing.releaseNotes} />
            </View>
            <Text style={[styles.bodyText, { color: colors.mutedForeground }]}>{listing.releaseNotes}</Text>
          </View>

          {/* Privacy */}
          <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Privacy Policy Summary</Text>
            <Text style={[styles.bodyText, { color: colors.mutedForeground }]}>{listing.privacyPolicySummary}</Text>
          </View>

          {/* Regenerate */}
          <Pressable
            onPress={generate}
            style={[styles.regenBtn, { borderColor: accentColor }]}
          >
            <Feather name="refresh-cw" size={14} color={accentColor} />
            <Text style={[styles.regenText, { color: accentColor }]}>Regenerate Listing</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root:             { gap: 12 },
  headerRow:        { flexDirection: "row", alignItems: "center", gap: 12 },
  backBtn:          { padding: 4 },
  platformBadge:    { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  platformBadgeText:{ fontSize: 13, fontFamily: "Inter_700Bold" },
  emptyCard:        { alignItems: "center", gap: 12, padding: 28, borderRadius: 14, borderWidth: 1 },
  emptyTitle:       { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  emptyText:        { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
  generateBtn:      { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 10 },
  generateBtnText:  { color: "#fff", fontSize: 14, fontFamily: "Inter_600SemiBold" },
  loadingCard:      { alignItems: "center", gap: 12, padding: 40, borderRadius: 14, borderWidth: 1 },
  loadingText:      { fontSize: 14, fontFamily: "Inter_400Regular" },
  errorBanner:      { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 10, borderWidth: 1 },
  errorText:        { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  listingContent:   { gap: 10 },
  ageRow:           { flexDirection: "row", alignItems: "center", gap: 10 },
  ageChip:          { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1.5 },
  ageText:          { fontSize: 15, fontFamily: "Inter_700Bold" },
  ageReason:        { fontSize: 12, fontFamily: "Inter_400Regular", flex: 1 },
  section:          { borderRadius: 12, borderWidth: 1, padding: 14, gap: 10 },
  sectionHeader:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sectionTitle:     { fontSize: 13, fontFamily: "Inter_700Bold" },
  copyBtn:          { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  copyBtnText:      { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  titleOption:      { flexDirection: "row", alignItems: "center", gap: 10, padding: 10, borderRadius: 8, borderWidth: 1 },
  titleText:        { fontSize: 14, fontFamily: "Inter_600SemiBold", flex: 1 },
  bodyText:         { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  charCount:        { fontSize: 11, fontFamily: "Inter_500Medium", textAlign: "right" },
  tagWrap:          { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  tag:              { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  tagText:          { fontSize: 12, fontFamily: "Inter_500Medium" },
  bulletRow:        { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  bulletText:       { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1, lineHeight: 20 },
  captionRow:       { flexDirection: "row", alignItems: "center", gap: 10 },
  captionNum:       { width: 24, height: 24, borderRadius: 6, alignItems: "center", justifyContent: "center" },
  captionNumText:   { fontSize: 12, fontFamily: "Inter_700Bold" },
  captionText:      { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  regenBtn:         { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12, borderRadius: 10, borderWidth: 1 },
  regenText:        { fontSize: 13, fontFamily: "Inter_600SemiBold" },
});
