import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { useColors } from "@/hooks/useColors";

type ModelKey =
  | "premium"
  | "free-to-play"
  | "cosmetic"
  | "dlc"
  | "battle-pass"
  | "subscription"
  | "rewarded-ads"
  | "iap"
  | "expansion"
  | "donations";

interface Model {
  key: ModelKey;
  label: string;
  icon: string;
  color: string;
  desc: string;
  ltv: string;
  complexity: "Low" | "Medium" | "High";
}

const MODELS: Model[] = [
  { key: "premium",      label: "Premium",        icon: "shopping-bag",  color: "#FBBF24", desc: "One-time purchase. Simple and no ongoing work.", ltv: "$2–15",    complexity: "Low"    },
  { key: "free-to-play", label: "Free to Play",   icon: "gift",          color: "#22C55E", desc: "Free entry, monetize through optional purchases.", ltv: "$0.50–3",  complexity: "Medium" },
  { key: "cosmetic",     label: "Cosmetics",      icon: "award",         color: "#00D4FF", desc: "Skins, outfits, emotes — never pay-to-win.", ltv: "$1–5",     complexity: "Medium" },
  { key: "dlc",          label: "DLC",            icon: "package",       color: "#7B2FFF", desc: "Paid content packs after the base game.", ltv: "$3–20",    complexity: "Medium" },
  { key: "battle-pass",  label: "Battle Pass",    icon: "layers",        color: "#2B7FFF", desc: "Seasonal pass with free + premium reward tracks.", ltv: "$5–15",    complexity: "High"   },
  { key: "subscription", label: "Subscription",   icon: "repeat",        color: "#F97316", desc: "Monthly/yearly access to premium features.", ltv: "$3–10/mo", complexity: "High"   },
  { key: "rewarded-ads", label: "Rewarded Ads",   icon: "play-circle",   color: "#34A853", desc: "Players watch ads for in-game bonuses.", ltv: "$0.20–1",  complexity: "Low"    },
  { key: "iap",          label: "In-App Purchases", icon: "credit-card", color: "#EF4444", desc: "Currency, items, or boosts purchased in-game.", ltv: "$1–10",    complexity: "Medium" },
  { key: "expansion",    label: "Expansions",     icon: "plus-circle",   color: "#EC4899", desc: "Large paid content chapters or story expansions.", ltv: "$5–30",    complexity: "High"   },
  { key: "donations",    label: "Donations",      icon: "heart",         color: "#F43F5E", desc: "Voluntary support from fans who love your game.", ltv: "$1–50+",   complexity: "Low"    },
];

const COMPLEXITY_COLOR: Record<string, string> = {
  Low: "#22C55E", Medium: "#FBBF24", High: "#F97316",
};

export function MonetizationPanel() {
  const colors = useColors();
  const [enabled, setEnabled] = useState<Set<ModelKey>>(new Set(["premium"]));
  const [expanded, setExpanded] = useState<ModelKey | null>(null);

  function toggle(key: ModelKey) {
    setEnabled((prev) => {
      const next = new Set(prev);
      if (next.has(key)) { next.delete(key); } else { next.add(key); }
      return next;
    });
  }

  const activeModels = MODELS.filter((m) => enabled.has(m.key));
  const estimatedLTV = activeModels.length > 0
    ? `~$${activeModels.length * 2}–${activeModels.length * 8} per user`
    : "No models selected";

  return (
    <View style={styles.root}>
      <View style={[styles.headerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name="dollar-sign" size={20} color="#FBBF24" />
        <View style={styles.headerText}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Monetization Toolkit</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            Choose your business models
          </Text>
        </View>
      </View>

      {/* Summary */}
      {enabled.size > 0 && (
        <View style={[styles.summaryCard, { backgroundColor: "#FBBF2412", borderColor: "#FBBF24" }]}>
          <View style={styles.summaryRow}>
            <Text style={[styles.summaryLabel, { color: "#FBBF24" }]}>{enabled.size} model{enabled.size !== 1 ? "s" : ""} enabled</Text>
            <Text style={[styles.summaryLTV, { color: "#FBBF24" }]}>{estimatedLTV}</Text>
          </View>
          <View style={styles.activeChips}>
            {activeModels.map((m) => (
              <View key={m.key} style={[styles.activeChip, { backgroundColor: m.color + "20", borderColor: m.color }]}>
                <Feather name={m.icon as any} size={11} color={m.color} />
                <Text style={[styles.activeChipText, { color: m.color }]}>{m.label}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Model list */}
      {MODELS.map((m) => {
        const isEnabled = enabled.has(m.key);
        const isExp = expanded === m.key;
        return (
          <View
            key={m.key}
            style={[styles.modelCard, {
              backgroundColor: colors.card,
              borderColor: isEnabled ? m.color : colors.border,
            }]}
          >
            <Pressable onPress={() => setExpanded(isExp ? null : m.key)} style={styles.modelHeader}>
              <View style={[styles.modelIcon, { backgroundColor: m.color + "20" }]}>
                <Feather name={m.icon as any} size={16} color={m.color} />
              </View>
              <View style={styles.modelInfo}>
                <Text style={[styles.modelLabel, { color: colors.foreground }]}>{m.label}</Text>
                <Text style={[styles.modelDesc, { color: colors.mutedForeground }]} numberOfLines={isExp ? undefined : 1}>
                  {m.desc}
                </Text>
              </View>
              <Pressable
                onPress={() => toggle(m.key)}
                style={[
                  styles.toggle,
                  {
                    backgroundColor: isEnabled ? m.color : colors.border,
                    borderColor: isEnabled ? m.color : colors.border,
                  }
                ]}
              >
                <View style={[styles.toggleKnob, { transform: [{ translateX: isEnabled ? 14 : 0 }] }]} />
              </Pressable>
            </Pressable>

            {isExp && (
              <View style={styles.modelDetails}>
                <View style={styles.modelMetaRow}>
                  <View style={[styles.metaChip, { backgroundColor: "#FBBF2420" }]}>
                    <Feather name="dollar-sign" size={11} color="#FBBF24" />
                    <Text style={[styles.metaChipText, { color: "#FBBF24" }]}>LTV: {m.ltv}</Text>
                  </View>
                  <View style={[styles.metaChip, { backgroundColor: COMPLEXITY_COLOR[m.complexity] + "20" }]}>
                    <Feather name="settings" size={11} color={COMPLEXITY_COLOR[m.complexity]} />
                    <Text style={[styles.metaChipText, { color: COMPLEXITY_COLOR[m.complexity] }]}>
                      {m.complexity} complexity
                    </Text>
                  </View>
                </View>
                <Text style={[styles.modelFullDesc, { color: colors.mutedForeground }]}>{m.desc}</Text>
                <Pressable
                  onPress={() => toggle(m.key)}
                  style={[styles.enableBtn, { backgroundColor: isEnabled ? "#EF444420" : m.color + "20", borderColor: isEnabled ? "#EF4444" : m.color }]}
                >
                  <Text style={[styles.enableBtnText, { color: isEnabled ? "#EF4444" : m.color }]}>
                    {isEnabled ? "Disable" : "Enable"}
                  </Text>
                </Pressable>
              </View>
            )}
          </View>
        );
      })}

      {/* Tips */}
      <View style={[styles.tipsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.tipsTitle, { color: colors.foreground }]}>Monetization Tips</Text>
        {[
          "Combine Premium + DLC for content-focused games",
          "F2P + Cosmetics works best for competitive/multiplayer",
          "Battle Pass adds recurring revenue to F2P games",
          "Rewarded Ads work well for casual/hypercasual games",
          "Never combine subscription + IAP without clear value",
        ].map((tip, i) => (
          <View key={i} style={styles.tipRow}>
            <Feather name="arrow-right" size={12} color="#FBBF24" />
            <Text style={[styles.tipText, { color: colors.mutedForeground }]}>{tip}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:              { gap: 12 },
  headerCard:        { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, borderWidth: 1, padding: 14 },
  headerText:        { gap: 2 },
  headerTitle:       { fontSize: 15, fontFamily: "Inter_700Bold" },
  headerSub:         { fontSize: 12, fontFamily: "Inter_400Regular" },
  summaryCard:       { borderRadius: 12, borderWidth: 1, padding: 14, gap: 10 },
  summaryRow:        { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  summaryLabel:      { fontSize: 14, fontFamily: "Inter_700Bold" },
  summaryLTV:        { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  activeChips:       { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  activeChip:        { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 9, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  activeChipText:    { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  modelCard:         { borderRadius: 12, borderWidth: 1, padding: 14, gap: 10 },
  modelHeader:       { flexDirection: "row", alignItems: "center", gap: 10 },
  modelIcon:         { width: 36, height: 36, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  modelInfo:         { flex: 1, gap: 3 },
  modelLabel:        { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  modelDesc:         { fontSize: 12, fontFamily: "Inter_400Regular" },
  toggle:            { width: 36, height: 22, borderRadius: 11, borderWidth: 1, justifyContent: "center", paddingHorizontal: 2 },
  toggleKnob:        { width: 18, height: 18, borderRadius: 9, backgroundColor: "#fff" },
  modelDetails:      { gap: 10, paddingTop: 4 },
  modelMetaRow:      { flexDirection: "row", gap: 8 },
  metaChip:          { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 9, paddingVertical: 5, borderRadius: 7 },
  metaChipText:      { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  modelFullDesc:     { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  enableBtn:         { alignSelf: "flex-start", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, borderWidth: 1 },
  enableBtnText:     { fontSize: 13, fontFamily: "Inter_700Bold" },
  tipsCard:          { borderRadius: 12, borderWidth: 1, padding: 14, gap: 10 },
  tipsTitle:         { fontSize: 14, fontFamily: "Inter_700Bold" },
  tipRow:            { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  tipText:           { fontSize: 12, fontFamily: "Inter_400Regular", flex: 1, lineHeight: 18 },
});
