import { Feather } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import * as FileSystem from "expo-file-system/legacy";
import * as Haptics from "expo-haptics";
import * as Sharing from "expo-sharing";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import type { ApiAsset } from "@/app/(tabs)/assets";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

const { width: SCREEN_W } = Dimensions.get("window");
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "/api";

// ─── Types ──────────────────────────────────────────────────────────────────

interface SheetMeta {
  rows: number;
  cols: number;
  frameWidth: number;
  frameHeight: number;
  sheetWidth: number;
  sheetHeight: number;
  margin?: number;
  spacing?: number;
}

interface FrameMeta {
  index: number;
  row: number;
  col: number;
  url: string;
}

interface SliceResponse {
  assetId: string;
  sheet: SheetMeta;
  frames: FrameMeta[];
  asset?: Record<string, unknown>;
}

interface Props {
  visible: boolean;
  asset: ApiAsset | null;
  onClose: () => void;
  /** Bubble the new metadata up so the asset list/lightbox stays in sync. */
  onSliced: (assetId: string, metadata: Record<string, unknown>) => void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function readSliceMeta(metadata: Record<string, unknown> | null | undefined): {
  sheet: SheetMeta | null;
  frames: FrameMeta[];
} {
  if (!metadata || typeof metadata !== "object") return { sheet: null, frames: [] };
  const rawSheet = metadata["sheet"];
  const rawFrames = metadata["frames"];
  const sheet =
    rawSheet && typeof rawSheet === "object" ? (rawSheet as SheetMeta) : null;
  const frames = Array.isArray(rawFrames) ? (rawFrames as FrameMeta[]) : [];
  return { sheet, frames };
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, n));
}

// ─── Number stepper ─────────────────────────────────────────────────────────

function Stepper({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  const colors = useColors();
  const set = (next: number) => {
    if (disabled) return;
    Haptics.selectionAsync();
    onChange(clamp(next, min, max));
  };
  return (
    <View style={styles.stepper}>
      <Text style={[styles.stepperLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <View style={[styles.stepperRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Pressable
          onPress={() => set(value - step)}
          disabled={disabled || value <= min}
          style={styles.stepperBtn}
        >
          <Feather name="minus" size={16} color={value <= min || disabled ? colors.mutedForeground : colors.foreground} />
        </Pressable>
        <Text style={[styles.stepperValue, { color: colors.foreground }]}>{value}</Text>
        <Pressable
          onPress={() => set(value + step)}
          disabled={disabled || value >= max}
          style={styles.stepperBtn}
        >
          <Feather name="plus" size={16} color={value >= max || disabled ? colors.mutedForeground : colors.foreground} />
        </Pressable>
      </View>
    </View>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function SpriteSheetToolsModal({ visible, asset, onClose, onSliced }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { accessToken } = useAuth();

  const [rows, setRows] = useState(2);
  const [cols, setCols] = useState(2);
  const [margin, setMargin] = useState(0);
  const [spacing, setSpacing] = useState(0);

  const [sheet, setSheet] = useState<SheetMeta | null>(null);
  const [frames, setFrames] = useState<FrameMeta[]>([]);

  const [slicing, setSlicing] = useState(false);
  const [sliceError, setSliceError] = useState<string | null>(null);

  const [playing, setPlaying] = useState(false);
  const [fps, setFps] = useState(12);
  const [current, setCurrent] = useState(0);

  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [exportNote, setExportNote] = useState<string | null>(null);

  // Initialise from the asset's persisted slice when the modal opens.
  useEffect(() => {
    if (!visible || !asset) return;
    const { sheet: s, frames: f } = readSliceMeta(asset.metadata);
    setSheet(s);
    setFrames(f);
    if (s) {
      setRows(clamp(s.rows, 1, 16));
      setCols(clamp(s.cols, 1, 16));
      setMargin(clamp(s.margin ?? 0, 0, 512));
      setSpacing(clamp(s.spacing ?? 0, 0, 512));
    } else {
      setRows(2);
      setCols(2);
      setMargin(0);
      setSpacing(0);
    }
    setPlaying(false);
    setCurrent(0);
    setSliceError(null);
    setExportError(null);
    setExportNote(null);
  }, [visible, asset]);

  // Animation loop — cycle frames while playing.
  useEffect(() => {
    if (!playing || frames.length === 0) return;
    const id = setInterval(() => {
      setCurrent((c) => (c + 1) % frames.length);
    }, Math.max(1, Math.round(1000 / fps)));
    return () => clearInterval(id);
  }, [playing, fps, frames.length]);

  const frameCount = rows * cols;
  const tooManyFrames = frameCount > 144;

  async function handleSlice() {
    if (!asset || !accessToken || slicing) return;
    if (tooManyFrames) {
      setSliceError("Grid too large: rows × cols must be at most 144 frames.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSlicing(true);
    setSliceError(null);
    setPlaying(false);
    try {
      const res = await fetch(`${BASE_URL}/assets/${asset.id}/slice`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ rows, cols, margin, spacing }),
      });
      const data = (await res.json()) as SliceResponse & { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Slicing failed");

      setSheet(data.sheet);
      setFrames(data.frames);
      setCurrent(0);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      if (data.asset && typeof data.asset === "object") {
        const md = (data.asset as { metadata?: Record<string, unknown> }).metadata;
        if (md) onSliced(asset.id, md);
      } else {
        onSliced(asset.id, { sheet: data.sheet, frames: data.frames });
      }
    } catch (err) {
      setSliceError(err instanceof Error ? err.message : "Slicing failed");
    } finally {
      setSlicing(false);
    }
  }

  async function handleExport() {
    if (!asset || !accessToken || exporting || frames.length === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setExporting(true);
    setExportError(null);
    setExportNote(null);

    const url = `${BASE_URL}/assets/${asset.id}/export`;
    const slug =
      (asset.name || "spritesheet")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "")
        .slice(0, 40) || "spritesheet";
    const filename = `${slug}-spritesheet.zip`;
    const headers = { Authorization: `Bearer ${accessToken}` };

    try {
      if (Platform.OS === "web") {
        const res = await fetch(url, { headers });
        if (!res.ok) {
          const d = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(d.error ?? "Export failed");
        }
        const blob = await res.blob();
        const g = globalThis as unknown as {
          URL: { createObjectURL: (b: Blob) => string; revokeObjectURL: (u: string) => void };
          document: Document;
        };
        const objectUrl = g.URL.createObjectURL(blob);
        const a = g.document.createElement("a");
        a.href = objectUrl;
        a.download = filename;
        g.document.body.appendChild(a);
        a.click();
        a.remove();
        g.URL.revokeObjectURL(objectUrl);
        setExportNote("Download started.");
      } else {
        const fileUri = `${FileSystem.cacheDirectory ?? ""}${filename}`;
        const { uri, status } = await FileSystem.downloadAsync(url, fileUri, { headers });
        if (status !== 200) {
          throw new Error(`Export failed (status ${status})`);
        }
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(uri, {
            mimeType: "application/zip",
            dialogTitle: "Export sprite sheet",
            UTI: "public.zip-archive",
          });
        } else {
          setExportNote(`Saved to ${uri}`);
        }
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Export failed";
      setExportError(msg);
      Alert.alert("Export failed", msg);
    } finally {
      setExporting(false);
    }
  }

  const previewW = SCREEN_W - 40;
  const sheetAspect = sheet && sheet.sheetHeight > 0 ? sheet.sheetWidth / sheet.sheetHeight : 1;

  // Frame grid sizing: fit cols per row, max 4 per visual row for readability.
  const gridCols = sheet ? clamp(sheet.cols, 1, 6) : 4;
  const cellSize = useMemo(
    () => (previewW - (gridCols - 1) * 8) / gridCols,
    [previewW, gridCols]
  );

  const hasFrames = frames.length > 0;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border, paddingTop: insets.top + 8 }]}>
          <View style={styles.headerLeft}>
            <View style={[styles.headerIconBox, { backgroundColor: colors.primary + "20" }]}>
              <Feather name="film" size={16} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>
                Sprite Sheet Tools
              </Text>
              <Text style={[styles.headerSub, { color: colors.mutedForeground }]} numberOfLines={1}>
                {asset?.name ?? "Slice, preview & export"}
              </Text>
            </View>
          </View>
          <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
            <Feather name="x" size={20} color={colors.mutedForeground} />
          </Pressable>
        </View>

        <ScrollView
          contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Sheet preview */}
          {asset?.url ? (
            <ExpoImage
              source={{ uri: asset.url }}
              style={[styles.sheetPreview, { width: previewW, aspectRatio: sheetAspect, borderColor: colors.border }]}
              contentFit="contain"
              transition={120}
            />
          ) : (
            <View style={[styles.sheetPreview, styles.noSheet, { width: previewW, borderColor: colors.border, backgroundColor: colors.card }]}>
              <Feather name="image" size={28} color={colors.mutedForeground} />
              <Text style={{ color: colors.mutedForeground, marginTop: 8 }}>No image to slice</Text>
            </View>
          )}

          {/* ── Slice controls ─────────────────────────────────────────────── */}
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Grid</Text>
          <View style={styles.gridControls}>
            <Stepper label="ROWS" value={rows} min={1} max={16} onChange={setRows} disabled={slicing} />
            <Stepper label="COLUMNS" value={cols} min={1} max={16} onChange={setCols} disabled={slicing} />
          </View>
          <View style={styles.gridControls}>
            <Stepper label="MARGIN" value={margin} min={0} max={512} step={1} onChange={setMargin} disabled={slicing} />
            <Stepper label="SPACING" value={spacing} min={0} max={512} step={1} onChange={setSpacing} disabled={slicing} />
          </View>

          <Text style={[styles.frameCountHint, { color: tooManyFrames ? "#EF4444" : colors.mutedForeground }]}>
            {frameCount} frame{frameCount === 1 ? "" : "s"} ({rows} × {cols})
            {tooManyFrames ? " — max 144" : ""}
          </Text>

          <Pressable
            onPress={() => void handleSlice()}
            disabled={slicing || tooManyFrames || !asset?.url}
            style={[
              styles.primaryBtn,
              { backgroundColor: slicing || tooManyFrames || !asset?.url ? colors.muted : colors.primary },
            ]}
          >
            {slicing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Feather name="scissors" size={15} color={slicing || tooManyFrames || !asset?.url ? colors.mutedForeground : "#fff"} />
                <Text style={[styles.primaryBtnText, { color: slicing || tooManyFrames || !asset?.url ? colors.mutedForeground : "#fff" }]}>
                  {hasFrames ? "Re-slice into frames" : "Slice into frames"}
                </Text>
              </>
            )}
          </Pressable>

          {sliceError && (
            <View style={[styles.errorBox, { borderColor: "#EF4444", backgroundColor: "#EF444415" }]}>
              <Feather name="alert-circle" size={14} color="#EF4444" />
              <Text style={[styles.errorText, { color: "#EF4444" }]}>{sliceError}</Text>
            </View>
          )}

          {/* ── Animation preview ──────────────────────────────────────────── */}
          {hasFrames && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Animation</Text>
              <View style={[styles.animStage, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <ExpoImage
                  source={{ uri: frames[current]?.url }}
                  style={styles.animFrame}
                  contentFit="contain"
                  transition={0}
                />
                <View style={[styles.animBadge, { backgroundColor: colors.background + "CC" }]}>
                  <Text style={[styles.animBadgeText, { color: colors.foreground }]}>
                    {current + 1}/{frames.length}
                  </Text>
                </View>
              </View>
              <View style={styles.animControls}>
                <Pressable
                  onPress={() => {
                    Haptics.selectionAsync();
                    setPlaying((p) => !p);
                  }}
                  style={[styles.playBtn, { backgroundColor: colors.primary }]}
                >
                  <Feather name={playing ? "pause" : "play"} size={16} color="#fff" />
                  <Text style={styles.playBtnText}>{playing ? "Pause" : "Play"}</Text>
                </Pressable>
                <Stepper label="FPS" value={fps} min={1} max={30} onChange={setFps} />
              </View>

              {/* ── Frame grid ───────────────────────────────────────────────── */}
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Frames ({frames.length})
              </Text>
              <View style={styles.frameGrid}>
                {frames.map((f) => {
                  const active = f.index === current && playing;
                  return (
                    <Pressable
                      key={f.index}
                      onPress={() => {
                        setPlaying(false);
                        setCurrent(f.index);
                        Haptics.selectionAsync();
                      }}
                      style={[
                        styles.frameCell,
                        {
                          width: cellSize,
                          height: cellSize,
                          borderColor: active ? colors.primary : colors.border,
                          borderWidth: active ? 2 : 1,
                          backgroundColor: colors.card,
                        },
                      ]}
                    >
                      <ExpoImage source={{ uri: f.url }} style={styles.frameThumb} contentFit="contain" transition={0} />
                      <View style={[styles.frameIdx, { backgroundColor: colors.background + "CC" }]}>
                        <Text style={[styles.frameIdxText, { color: colors.foreground }]}>{f.index}</Text>
                      </View>
                    </Pressable>
                  );
                })}
              </View>

              {/* ── Export ───────────────────────────────────────────────────── */}
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Export</Text>
              <Text style={[styles.exportHint, { color: colors.mutedForeground }]}>
                Downloads a zip with the sheet, individual frame PNGs, a TexturePacker
                atlas (Phaser-ready) and a manifest.
              </Text>
              <Pressable
                onPress={() => void handleExport()}
                disabled={exporting}
                style={[styles.primaryBtn, { backgroundColor: exporting ? colors.muted : colors.secondary }]}
              >
                {exporting ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Feather name="download" size={15} color="#fff" />
                    <Text style={[styles.primaryBtnText, { color: "#fff" }]}>Export for game engine</Text>
                  </>
                )}
              </Pressable>
              {exportNote && (
                <View style={[styles.errorBox, { borderColor: colors.success, backgroundColor: colors.success + "15" }]}>
                  <Feather name="check-circle" size={14} color={colors.success} />
                  <Text style={[styles.errorText, { color: colors.success }]}>{exportNote}</Text>
                </View>
              )}
              {exportError && (
                <View style={[styles.errorBox, { borderColor: "#EF4444", backgroundColor: "#EF444415" }]}>
                  <Feather name="alert-circle" size={14} color="#EF4444" />
                  <Text style={[styles.errorText, { color: "#EF4444" }]}>{exportError}</Text>
                </View>
              )}
            </>
          )}

          {!hasFrames && !slicing && (
            <View style={[styles.emptyHint, { borderColor: colors.border, backgroundColor: colors.card }]}>
              <Feather name="grid" size={22} color={colors.mutedForeground} />
              <Text style={[styles.emptyHintText, { color: colors.mutedForeground }]}>
                Choose a grid and slice the sheet to preview frames, play the animation and export.
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10, flex: 1 },
  headerIconBox: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  headerSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  closeBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  body: { paddingHorizontal: 20, paddingTop: 16, gap: 12 },
  sheetPreview: { borderRadius: 12, borderWidth: 1, alignSelf: "center" },
  noSheet: { aspectRatio: 1.6, alignItems: "center", justifyContent: "center" },
  sectionTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold", marginTop: 8 },
  gridControls: { flexDirection: "row", gap: 12 },
  stepper: { flex: 1, gap: 6 },
  stepperLabel: { fontSize: 11, fontFamily: "Inter_500Medium", letterSpacing: 0.4 },
  stepperRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 6,
    height: 44,
  },
  stepperBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  stepperValue: { fontSize: 16, fontFamily: "Inter_700Bold", minWidth: 28, textAlign: "center" },
  frameCountHint: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center" },
  primaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 50,
    borderRadius: 14,
  },
  primaryBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  errorBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  errorText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular" },
  animStage: {
    width: "100%",
    aspectRatio: 1,
    maxHeight: 280,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  animFrame: { width: "82%", height: "82%" },
  animBadge: {
    position: "absolute",
    top: 10,
    right: 10,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  animBadgeText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  animControls: { flexDirection: "row", alignItems: "flex-end", gap: 12 },
  playBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 44,
    borderRadius: 12,
  },
  playBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold", color: "#fff" },
  frameGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  frameCell: { borderRadius: 8, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  frameThumb: { width: "100%", height: "100%" },
  frameIdx: {
    position: "absolute",
    bottom: 3,
    left: 3,
    borderRadius: 5,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  frameIdxText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  exportHint: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 18 },
  emptyHint: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 20,
    alignItems: "center",
    gap: 10,
    marginTop: 8,
  },
  emptyHintText: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 19 },
});
