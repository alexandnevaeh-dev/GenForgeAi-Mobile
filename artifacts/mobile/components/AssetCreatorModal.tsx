import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

// ─── Types ────────────────────────────────────────────────────────────────────

type AssetCategory = "sprite" | "portrait" | "background" | "icon" | "tileset" | "vfx" | "environment" | "cover";

interface CategoryDef {
  id: AssetCategory;
  label: string;
  icon: string;
  description: string;
}

interface StyleDef {
  name: string;
  emoji: string;
}

export interface CreatedAsset {
  id: string;
  name: string;
  category: string;
  url: string | null;
  thumbnailUrl: string | null;
  tags: string[] | null;
  createdAt: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  onCreated: (asset: CreatedAsset) => void;
  defaultProjectId?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const CATEGORIES: CategoryDef[] = [
  { id: "sprite",      label: "Character Sprite",  icon: "user",      description: "Animated game character, game-ready" },
  { id: "portrait",    label: "Portrait",           icon: "camera",    description: "Face & shoulders, expressive detail" },
  { id: "background",  label: "Background",         icon: "image",     description: "Wide scene for game levels" },
  { id: "environment", label: "Environment Art",    icon: "map",       description: "Landscapes, concept environments" },
  { id: "cover",       label: "Cover Art",          icon: "star",      description: "Cinematic title / marketing art" },
  { id: "tileset",     label: "Tileset",            icon: "grid",      description: "Seamlessly tiling texture pattern" },
  { id: "icon",        label: "Game Icon / UI",     icon: "layout",    description: "Small UI icons with clear silhouette" },
  { id: "vfx",         label: "VFX / Particle",     icon: "zap",       description: "Magic, impact, or particle effects" },
];

const STYLES: StyleDef[] = [
  { name: "Pixel Art",    emoji: "🎮" },
  { name: "Anime",        emoji: "✨" },
  { name: "Fantasy",      emoji: "⚔️" },
  { name: "Sci-Fi",       emoji: "🚀" },
  { name: "Cartoon",      emoji: "🎨" },
  { name: "Realistic",    emoji: "📷" },
  { name: "Hand-painted", emoji: "🖌️" },
  { name: "Cyberpunk",    emoji: "🌃" },
  { name: "Isometric",    emoji: "📐" },
  { name: "Chibi",        emoji: "🐣" },
  { name: "Low Poly",     emoji: "💎" },
  { name: "Retro",        emoji: "🕹️" },
  { name: "Voxel",        emoji: "🧱" },
  { name: "Steampunk",    emoji: "⚙️" },
  { name: "Horror",       emoji: "💀" },
  { name: "Stylized 3D",  emoji: "🎭" },
];

const PROMPT_HINTS: Partial<Record<AssetCategory, string>> = {
  sprite:      "e.g. armored elven ranger with a glowing bow",
  portrait:    "e.g. wise old wizard with a long silver beard",
  background:  "e.g. misty forest at dawn with ancient ruins",
  environment: "e.g. volcanic mountain pass with lava rivers",
  cover:       "e.g. hero standing before a dark castle gate",
  tileset:     "e.g. mossy stone dungeon floor with cracks",
  icon:        "e.g. fire sword icon for attack ability",
  vfx:         "e.g. purple arcane explosion with sparks",
};

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepDot({ active, done, num }: { active: boolean; done: boolean; num: number }) {
  const colors = useColors();
  const bg = done ? colors.success : active ? colors.primary : colors.muted;
  return (
    <View style={[styles.stepDot, { backgroundColor: bg }]}>
      {done
        ? <Feather name="check" size={9} color="#fff" />
        : <Text style={styles.stepDotNum}>{num}</Text>
      }
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AssetCreatorModal({ visible, onClose, onCreated, defaultProjectId }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { accessToken } = useAuth();

  const [step, setStep]             = useState<1 | 2 | 3>(1);
  const [category, setCategory]     = useState<AssetCategory | null>(null);
  const [style, setStyle]           = useState<string | null>(null);
  const [prompt, setPrompt]         = useState("");
  const [assetName, setAssetName]   = useState("");
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated]   = useState<CreatedAsset | null>(null);

  // Scanning animation for the generation state
  const scanAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) {
      setStep(1);
      setCategory(null);
      setStyle(null);
      setPrompt("");
      setAssetName("");
      setGenerating(false);
      setGenerated(null);
    }
  }, [visible]);

  useEffect(() => {
    if (generating) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(scanAnim, { toValue: 1, duration: 1400, useNativeDriver: true }),
          Animated.timing(scanAnim, { toValue: 0, duration: 0,    useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [generating]);

  function handleSelectCategory(cat: AssetCategory) {
    Haptics.selectionAsync();
    setCategory(cat);
    setStep(2);
  }

  function handleSelectStyle(s: string) {
    Haptics.selectionAsync();
    setStyle(s);
    setStep(3);
  }

  async function handleGenerate() {
    if (!category || !style || prompt.trim().length < 3) return;
    if (!accessToken) {
      Alert.alert("Sign in required", "Please sign in to generate assets.");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setGenerating(true);

    try {
      const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "/api";
      const resp = await fetch(`${BASE_URL}/assets/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          style,
          category,
          name: assetName.trim() || undefined,
          projectId: defaultProjectId,
        }),
      });

      const data = await resp.json() as { asset?: CreatedAsset; error?: string };
      if (!resp.ok || !data.asset) {
        throw new Error(data.error ?? "Generation failed");
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setGenerated(data.asset);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      Alert.alert("Generation failed", msg);
    } finally {
      setGenerating(false);
    }
  }

  function handleDone() {
    if (generated) onCreated(generated);
    onClose();
  }

  // ── Step 1: Pick category ──────────────────────────────────────────────────

  function renderStep1() {
    return (
      <>
        <Text style={[styles.stepTitle, { color: colors.foreground }]}>What do you want to create?</Text>
        <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
          Choose an asset category to get started
        </Text>
        <View style={styles.categoryGrid}>
          {CATEGORIES.map((cat) => (
            <Pressable
              key={cat.id}
              onPress={() => handleSelectCategory(cat.id)}
              style={({ pressed }) => [
                styles.categoryCard,
                {
                  backgroundColor: colors.card,
                  borderColor: category === cat.id ? colors.primary : colors.border,
                  borderWidth: category === cat.id ? 1.5 : 1,
                  opacity: pressed ? 0.7 : 1,
                },
              ]}
            >
              <View style={[styles.catIconBox, { backgroundColor: colors.primary + "20" }]}>
                <Feather name={cat.icon as any} size={18} color={colors.primary} />
              </View>
              <Text style={[styles.catLabel, { color: colors.foreground }]}>{cat.label}</Text>
              <Text style={[styles.catDesc, { color: colors.mutedForeground }]} numberOfLines={2}>
                {cat.description}
              </Text>
            </Pressable>
          ))}
        </View>
      </>
    );
  }

  // ── Step 2: Pick style ────────────────────────────────────────────────────

  function renderStep2() {
    return (
      <>
        <Pressable onPress={() => setStep(1)} style={styles.backBtn}>
          <Feather name="arrow-left" size={14} color={colors.primary} />
          <Text style={[styles.backBtnText, { color: colors.primary }]}>Back</Text>
        </Pressable>
        <Text style={[styles.stepTitle, { color: colors.foreground }]}>Choose an art style</Text>
        <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
          16 styles available — select one to define the visual look
        </Text>
        <View style={styles.styleGrid}>
          {STYLES.map((s) => {
            const active = style === s.name;
            return (
              <Pressable
                key={s.name}
                onPress={() => handleSelectStyle(s.name)}
                style={({ pressed }) => [
                  styles.styleChip,
                  {
                    backgroundColor: active ? colors.primary : colors.card,
                    borderColor: active ? colors.primary : colors.border,
                    opacity: pressed ? 0.7 : 1,
                  },
                ]}
              >
                <Text style={styles.styleEmoji}>{s.emoji}</Text>
                <Text style={[styles.styleName, { color: active ? "#fff" : colors.foreground }]}>
                  {s.name}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </>
    );
  }

  // ── Step 3: Prompt + generate ─────────────────────────────────────────────

  function renderStep3() {
    const catDef = CATEGORIES.find((c) => c.id === category);
    const hint = (category && PROMPT_HINTS[category]) ?? "Describe the asset you want to generate...";
    const canGenerate = prompt.trim().length >= 3 && !generating;

    if (generating) {
      return (
        <View style={styles.generatingBox}>
          <View style={[styles.scanBox, { backgroundColor: colors.card, borderColor: colors.primary }]}>
            <Animated.View
              style={[
                styles.scanLine,
                {
                  backgroundColor: colors.accent + "60",
                  transform: [{
                    translateY: scanAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 120] }),
                  }],
                },
              ]}
            />
            <Feather name="cpu" size={32} color={colors.primary} style={{ marginBottom: 12 }} />
            <Text style={[styles.generatingTitle, { color: colors.foreground }]}>
              Generating {style} {catDef?.label}…
            </Text>
            <Text style={[styles.generatingPrompt, { color: colors.mutedForeground }]} numberOfLines={2}>
              "{prompt}"
            </Text>
            <ActivityIndicator color={colors.primary} style={{ marginTop: 16 }} />
            <Text style={[styles.generatingHint, { color: colors.mutedForeground }]}>
              AI is painting your asset — this takes ~15–30s
            </Text>
          </View>
        </View>
      );
    }

    if (generated) {
      return (
        <View style={styles.resultBox}>
          {generated.url && (
            <Image
              source={{ uri: generated.url }}
              style={[styles.resultImage, { borderColor: colors.primary }]}
              resizeMode="contain"
            />
          )}
          <View style={[styles.resultMeta, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.resultRow}>
              <Feather name="check-circle" size={14} color={colors.success} />
              <Text style={[styles.resultName, { color: colors.foreground }]}>{generated.name}</Text>
            </View>
            <View style={styles.resultTagRow}>
              {(generated.tags ?? []).map((t) => (
                <View key={t} style={[styles.resultTag, { backgroundColor: colors.primary + "20" }]}>
                  <Text style={[styles.resultTagText, { color: colors.primary }]}>{t}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.resultActions}>
            <Pressable
              onPress={() => {
                setGenerated(null);
                setPrompt("");
                setAssetName("");
              }}
              style={[styles.resultBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Feather name="refresh-cw" size={14} color={colors.foreground} />
              <Text style={[styles.resultBtnText, { color: colors.foreground }]}>Create Another</Text>
            </Pressable>
            <Pressable
              onPress={handleDone}
              style={[styles.resultBtn, styles.resultBtnPrimary, { backgroundColor: colors.primary }]}
            >
              <Feather name="check" size={14} color="#fff" />
              <Text style={[styles.resultBtnText, { color: "#fff" }]}>Add to Library</Text>
            </Pressable>
          </View>
        </View>
      );
    }

    return (
      <>
        <Pressable onPress={() => setStep(2)} style={styles.backBtn}>
          <Feather name="arrow-left" size={14} color={colors.primary} />
          <Text style={[styles.backBtnText, { color: colors.primary }]}>Back</Text>
        </Pressable>

        {/* Selection summary */}
        <View style={[styles.selectionRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.selectionChip, { backgroundColor: colors.primary + "20" }]}>
            <Feather name={catDef?.icon as any ?? "image"} size={11} color={colors.primary} />
            <Text style={[styles.selectionChipText, { color: colors.primary }]}>{catDef?.label}</Text>
          </View>
          <Feather name="chevron-right" size={11} color={colors.mutedForeground} />
          <View style={[styles.selectionChip, { backgroundColor: colors.secondary + "20" }]}>
            <Text style={[styles.selectionChipText, { color: colors.secondary }]}>{style}</Text>
          </View>
        </View>

        {/* Optional name */}
        <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>ASSET NAME (OPTIONAL)</Text>
        <TextInput
          style={[styles.nameInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
          placeholder={`e.g. ${style} ${catDef?.label}`}
          placeholderTextColor={colors.mutedForeground}
          value={assetName}
          onChangeText={setAssetName}
          maxLength={80}
          returnKeyType="next"
        />

        {/* Prompt */}
        <Text style={[styles.inputLabel, { color: colors.mutedForeground }]}>DESCRIBE YOUR ASSET *</Text>
        <TextInput
          style={[styles.promptInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
          placeholder={hint}
          placeholderTextColor={colors.mutedForeground}
          value={prompt}
          onChangeText={setPrompt}
          multiline
          numberOfLines={4}
          maxLength={500}
          textAlignVertical="top"
        />
        <Text style={[styles.charCount, { color: colors.mutedForeground }]}>{prompt.length}/500</Text>

        {/* Style tip */}
        <View style={[styles.tipBox, { backgroundColor: colors.accent + "10", borderColor: colors.accent + "40" }]}>
          <Feather name="info" size={12} color={colors.accent} />
          <Text style={[styles.tipText, { color: colors.mutedForeground }]}>
            Your prompt is automatically enhanced with <Text style={{ color: colors.accent }}>{style}</Text> style
            cues for best results.
          </Text>
        </View>

        {/* Generate button */}
        <Pressable
          onPress={handleGenerate}
          disabled={!canGenerate}
          style={({ pressed }) => [
            styles.generateBtn,
            {
              backgroundColor: canGenerate ? colors.primary : colors.muted,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <Feather name="cpu" size={15} color={canGenerate ? "#fff" : colors.mutedForeground} />
          <Text style={[styles.generateBtnText, { color: canGenerate ? "#fff" : colors.mutedForeground }]}>
            Generate Asset
          </Text>
        </Pressable>
      </>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={[styles.root, { backgroundColor: colors.background }]}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border, paddingTop: insets.top + 8 }]}>
          <View style={styles.headerLeft}>
            <View style={[styles.headerIconBox, { backgroundColor: colors.primary + "20" }]}>
              <Feather name="cpu" size={16} color={colors.primary} />
            </View>
            <View>
              <Text style={[styles.headerTitle, { color: colors.foreground }]}>Asset Creator</Text>
              <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>AI-powered generation studio</Text>
            </View>
          </View>
          <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
            <Feather name="x" size={20} color={colors.mutedForeground} />
          </Pressable>
        </View>

        {/* Step indicators */}
        {!generating && !generated && (
          <View style={[styles.steps, { borderBottomColor: colors.border }]}>
            {[1, 2, 3].map((n) => (
              <React.Fragment key={n}>
                <StepDot num={n} active={step === n} done={step > n} />
                {n < 3 && (
                  <View style={[styles.stepLine, { backgroundColor: step > n ? colors.success : colors.muted }]} />
                )}
              </React.Fragment>
            ))}
            <Text style={[styles.stepLabel, { color: colors.mutedForeground }]}>
              {step === 1 ? "Category" : step === 2 ? "Style" : "Prompt"}
            </Text>
          </View>
        )}

        <ScrollView
          contentContainerStyle={[styles.body, { paddingBottom: insets.bottom + 32 }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLeft:    { flexDirection: "row", alignItems: "center", gap: 10 },
  headerIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  headerTitle:   { fontSize: 16, fontWeight: "700", letterSpacing: -0.3 },
  headerSub:     { fontSize: 11, marginTop: 1 },
  closeBtn:      { padding: 4 },

  steps: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 6,
  },
  stepDot:    { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  stepDotNum: { fontSize: 11, fontWeight: "700", color: "#fff" },
  stepLine:   { flex: 1, height: 1.5, borderRadius: 1 },
  stepLabel:  { fontSize: 11, marginLeft: 6 },

  body: { padding: 20 },

  backBtn:     { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 16 },
  backBtnText: { fontSize: 13, fontWeight: "600" },

  stepTitle: { fontSize: 18, fontWeight: "700", letterSpacing: -0.4, marginBottom: 4 },
  stepSub:   { fontSize: 13, marginBottom: 20, lineHeight: 18 },

  // Category grid
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  categoryCard: {
    width: "47%",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  catIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  catLabel:   { fontSize: 13, fontWeight: "700", letterSpacing: -0.2 },
  catDesc:    { fontSize: 11, lineHeight: 15 },

  // Style grid
  styleGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  styleChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  styleEmoji: { fontSize: 14 },
  styleName:  { fontSize: 12, fontWeight: "600" },

  // Step 3 — prompt
  selectionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 20,
  },
  selectionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  selectionChipText: { fontSize: 11, fontWeight: "600" },

  inputLabel: { fontSize: 10, fontWeight: "700", letterSpacing: 1, marginBottom: 6 },
  nameInput: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    marginBottom: 16,
  },
  promptInput: {
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
    fontSize: 14,
    minHeight: 100,
    marginBottom: 4,
  },
  charCount: { fontSize: 10, textAlign: "right", marginBottom: 14 },

  tipBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 20,
  },
  tipText: { flex: 1, fontSize: 12, lineHeight: 17 },

  generateBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 48,
    borderRadius: 12,
  },
  generateBtnText: { fontSize: 15, fontWeight: "700" },

  // Generating state
  generatingBox: { alignItems: "center", paddingTop: 40 },
  scanBox: {
    width: "100%",
    alignItems: "center",
    padding: 32,
    borderRadius: 16,
    borderWidth: 1.5,
    overflow: "hidden",
  },
  scanLine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  generatingTitle:  { fontSize: 16, fontWeight: "700", letterSpacing: -0.3, textAlign: "center" },
  generatingPrompt: { fontSize: 12, textAlign: "center", marginTop: 6, fontStyle: "italic" },
  generatingHint:   { fontSize: 11, textAlign: "center", marginTop: 10 },

  // Result state
  resultBox: { gap: 14 },
  resultImage: {
    width: "100%",
    height: 240,
    borderRadius: 14,
    borderWidth: 1.5,
    backgroundColor: "#0A0A0F",
  },
  resultMeta:   { padding: 14, borderRadius: 12, borderWidth: 1, gap: 8 },
  resultRow:    { flexDirection: "row", alignItems: "center", gap: 8 },
  resultName:   { fontSize: 14, fontWeight: "700", flex: 1 },
  resultTagRow: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  resultTag:    { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  resultTagText: { fontSize: 11, fontWeight: "600" },
  resultActions: { flexDirection: "row", gap: 10 },
  resultBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
  },
  resultBtnPrimary: { borderWidth: 0 },
  resultBtnText: { fontSize: 13, fontWeight: "700" },
});
