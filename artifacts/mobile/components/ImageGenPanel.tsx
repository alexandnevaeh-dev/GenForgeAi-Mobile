import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

type ImageType = "cover" | "protagonist" | "boss" | "environment";

interface ImageSlot {
  type: ImageType;
  label: string;
  icon: string;
  description: string;
  color: string;
}

const SLOTS: ImageSlot[] = [
  { type: "cover",        label: "Cover Art",       icon: "image",   description: "Game box art — hero, world, dramatic composition", color: "#2B7FFF" },
  { type: "protagonist",  label: "Protagonist",     icon: "user",    description: "Full-body character concept, white background",    color: "#7B2FFF" },
  { type: "boss",         label: "Boss / Villain",  icon: "shield",  description: "Antagonist concept art, menacing pose",            color: "#EF4444" },
  { type: "environment",  label: "Environment",     icon: "map",     description: "World environment scene, atmospheric lighting",    color: "#22C55E" },
];

interface Props {
  projectId: string;
  projectTitle: string;
  genre?: string | null;
  artStyle?: string | null;
}

export function ImageGenPanel({ projectId }: Props) {
  const colors = useColors();
  const { accessToken, user } = useAuth();
  const isGuest = !accessToken || user?.id === "guest";

  const [images, setImages]   = useState<Partial<Record<ImageType, string>>>({});
  const [loading, setLoading] = useState<Partial<Record<ImageType, boolean>>>({});
  const [errors, setErrors]   = useState<Partial<Record<ImageType, string>>>({});
  const [allLoading, setAllLoading] = useState(false);

  async function generate(type: ImageType) {
    setLoading((p) => ({ ...p, [type]: true }));
    setErrors((p) => ({ ...p, [type]: undefined }));
    try {
      const res = await fetch(`/api/projects/${projectId}/images/${type}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const d = (await res.json()) as { error?: string };
        throw new Error(d.error ?? "Generation failed");
      }
      const data = (await res.json()) as { url: string };
      setImages((p) => ({ ...p, [type]: data.url }));
    } catch (e) {
      setErrors((p) => ({ ...p, [type]: e instanceof Error ? e.message : "Failed" }));
    } finally {
      setLoading((p) => ({ ...p, [type]: false }));
    }
  }

  async function generateAll() {
    setAllLoading(true);
    setErrors({});
    try {
      const res = await fetch(`/api/projects/${projectId}/images/generate-all`, {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}`, "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Failed");
      const data = (await res.json()) as { results: Partial<Record<ImageType, string | null>>; errors: Record<string, string> };
      const next: Partial<Record<ImageType, string>> = {};
      for (const [k, v] of Object.entries(data.results)) {
        if (v) next[k as ImageType] = v;
      }
      setImages((p) => ({ ...p, ...next }));
      if (Object.keys(data.errors).length) {
        const errMap: Partial<Record<ImageType, string>> = {};
        for (const [k, v] of Object.entries(data.errors)) errMap[k as ImageType] = v;
        setErrors(errMap);
      }
    } catch (e) {
      setErrors({ cover: "Batch generation failed" });
    } finally {
      setAllLoading(false);
    }
  }

  // ── Guest / not signed in ──
  if (isGuest) {
    return (
      <View style={[styles.emptyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name="image" size={22} color={colors.mutedForeground} />
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Sign in to generate artwork</Text>
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
          AI image generation runs on the server against a saved project. Sign in with an account to create cover art, characters, and environments.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* Header */}
      <View style={[styles.headerCard, { backgroundColor: colors.card, borderColor: colors.primary }]}>
        <Feather name="image" size={18} color={colors.primary} />
        <View style={styles.headerText}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>AI Image Generation</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            Real artwork powered by gpt-image-1 · Styled to your art direction
          </Text>
        </View>
      </View>

      {/* Generate all button */}
      <Pressable
        onPress={generateAll}
        disabled={allLoading}
        style={[styles.allBtn, { backgroundColor: allLoading ? colors.border : colors.primary }]}
      >
        {allLoading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Feather name="zap" size={16} color="#fff" />
        )}
        <Text style={styles.allBtnText}>
          {allLoading ? "Generating all 4 images…" : "Generate All Images"}
        </Text>
      </Pressable>

      {/* Image slots */}
      <View style={styles.grid}>
        {SLOTS.map((slot) => {
          const url    = images[slot.type];
          const busy   = loading[slot.type] ?? allLoading;
          const err    = errors[slot.type];

          return (
            <View
              key={slot.type}
              style={[styles.slotCard, { backgroundColor: colors.card, borderColor: url ? slot.color : colors.border }]}
            >
              {/* Preview area */}
              <View style={[styles.preview, { backgroundColor: colors.muted }]}>
                {busy ? (
                  <View style={styles.previewCenter}>
                    <ActivityIndicator color={slot.color} size="large" />
                    <Text style={[styles.previewGenText, { color: slot.color }]}>Generating…</Text>
                  </View>
                ) : url ? (
                  <Image source={{ uri: url }} style={styles.previewImg} resizeMode="cover" />
                ) : (
                  <View style={styles.previewCenter}>
                    <View style={[styles.previewIconCircle, { backgroundColor: slot.color + "20" }]}>
                      <Feather name={slot.icon as any} size={28} color={slot.color} />
                    </View>
                    <Text style={[styles.previewEmptyText, { color: colors.mutedForeground }]}>
                      {slot.description}
                    </Text>
                  </View>
                )}
              </View>

              {/* Slot footer */}
              <View style={styles.slotFooter}>
                <View style={styles.slotLabelRow}>
                  <View style={[styles.slotDot, { backgroundColor: url ? slot.color : colors.border }]} />
                  <Text style={[styles.slotLabel, { color: colors.foreground }]}>{slot.label}</Text>
                </View>

                {err && (
                  <Text style={[styles.errText, { color: colors.destructive }]} numberOfLines={1}>{err}</Text>
                )}

                <Pressable
                  onPress={() => generate(slot.type)}
                  disabled={busy}
                  style={[
                    styles.genBtn,
                    { backgroundColor: url ? slot.color + "20" : slot.color, borderColor: slot.color }
                  ]}
                >
                  {busy ? (
                    <ActivityIndicator color={url ? slot.color : "#fff"} size="small" />
                  ) : (
                    <Feather name={url ? "refresh-cw" : "image"} size={13} color={url ? slot.color : "#fff"} />
                  )}
                  <Text style={[styles.genBtnText, { color: url ? slot.color : "#fff" }]}>
                    {url ? "Regenerate" : "Generate"}
                  </Text>
                </Pressable>
              </View>
            </View>
          );
        })}
      </View>

      <Text style={[styles.footerNote, { color: colors.mutedForeground }]}>
        Images are generated using your project's genre, art style, and story data. Cover art is automatically saved as your project cover.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root:               { gap: 12 },
  headerCard:         { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, borderWidth: 1, padding: 14 },
  headerText:         { flex: 1, gap: 2 },
  headerTitle:        { fontSize: 14, fontFamily: "Inter_700Bold" },
  headerSub:          { fontSize: 11, fontFamily: "Inter_400Regular" },
  allBtn:             { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 13, borderRadius: 12 },
  allBtnText:         { color: "#fff", fontSize: 14, fontFamily: "Inter_600SemiBold" },
  grid:               { gap: 12 },
  slotCard:           { borderRadius: 14, borderWidth: 1.5, overflow: "hidden" },
  preview:            { height: 180, alignItems: "center", justifyContent: "center" },
  previewCenter:      { alignItems: "center", gap: 10, padding: 20 },
  previewGenText:     { fontSize: 13, fontFamily: "Inter_500Medium" },
  previewImg:         { width: "100%", height: "100%" },
  previewIconCircle:  { width: 60, height: 60, borderRadius: 30, alignItems: "center", justifyContent: "center" },
  previewEmptyText:   { fontSize: 11, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 17 },
  slotFooter:         { padding: 12, gap: 8 },
  slotLabelRow:       { flexDirection: "row", alignItems: "center", gap: 6 },
  slotDot:            { width: 8, height: 8, borderRadius: 4 },
  slotLabel:          { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  errText:            { fontSize: 11, fontFamily: "Inter_400Regular" },
  genBtn:             { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  genBtnText:         { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  footerNote:         { fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 17, textAlign: "center" },
  emptyCard:          { alignItems: "center", gap: 8, borderRadius: 12, borderWidth: 1, padding: 24 },
  emptyTitle:         { fontSize: 14, fontFamily: "Inter_700Bold", textAlign: "center" },
  emptyText:          { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18, textAlign: "center" },
});
