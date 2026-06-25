import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import {
  ASSET_DATABASE,
  AUDIO_TRACKS,
  LIVING_ASSETS,
  LOCALES,
  PIPELINE_PHASES,
  PIXEL_ART_STYLES,
  SFX_ENTRIES,
  type Asset,
  type AssetStatus,
  type AssetType,
} from "@/constants/asset-pipeline";
import { useColors } from "@/hooks/useColors";

type AssetTab = "pipeline" | "art" | "assets" | "audio" | "living";

const ASSET_TABS: { id: AssetTab; label: string; icon: string }[] = [
  { id: "pipeline", label: "Pipeline", icon: "layers" },
  { id: "art", label: "Art Style", icon: "eye" },
  { id: "assets", label: "Database", icon: "database" },
  { id: "audio", label: "Audio", icon: "music" },
  { id: "living", label: "Living", icon: "heart" },
];

const STATUS_COLORS: Record<AssetStatus, string> = {
  queued: "#6B6B80",
  generating: "#2B7FFF",
  validating: "#F97316",
  optimizing: "#7B2FFF",
  complete: "#22C55E",
  failed: "#EF4444",
};

const STATUS_ICONS: Record<AssetStatus, string> = {
  queued: "clock",
  generating: "loader",
  validating: "check-square",
  optimizing: "zap",
  complete: "check-circle",
  failed: "x-circle",
};

const TYPE_ICONS: Record<AssetType, string> = {
  sprite: "user",
  tileset: "grid",
  environment: "map",
  vfx: "star",
  ui: "layout",
  portrait: "camera",
  music: "music",
  sfx: "volume-2",
  ambient: "wind",
  animation: "film",
};

function StatusChip({ status }: { status: AssetStatus }) {
  const colors = useColors();
  const color = STATUS_COLORS[status];
  return (
    <View style={[styles.statusChip, { backgroundColor: color + "22" }]}>
      <Feather name={STATUS_ICONS[status] as any} size={10} color={color} />
      <Text style={[styles.statusChipText, { color }]}>{status}</Text>
    </View>
  );
}

// ─── Pipeline Tab ─────────────────────────────────────────────────────────
function PipelineTab() {
  const colors = useColors();
  const [expanded, setExpanded] = useState<number | null>(3);

  const totalAssets = ASSET_DATABASE.length;
  const completeAssets = ASSET_DATABASE.filter((a) => a.status === "complete").length;
  const generatingAssets = ASSET_DATABASE.filter((a) => a.status === "generating").length;

  return (
    <View style={styles.tabContent}>
      {/* Progress overview */}
      <View style={[styles.overviewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.overviewLabel, { color: colors.mutedForeground }]}>ASSET PRODUCTION PROGRESS</Text>
        <View style={[styles.progressBg, { backgroundColor: colors.muted }]}>
          <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${Math.round((completeAssets / totalAssets) * 100)}%` as any }]} />
        </View>
        <View style={styles.overviewStats}>
          {[
            { label: "Total", value: totalAssets, color: colors.foreground },
            { label: "Complete", value: completeAssets, color: colors.success },
            { label: "Generating", value: generatingAssets, color: colors.primary },
            { label: "Queued", value: totalAssets - completeAssets - generatingAssets, color: colors.mutedForeground },
          ].map((s) => (
            <View key={s.label} style={styles.overviewStat}>
              <Text style={[styles.overviewStatValue, { color: s.color }]}>{s.value}</Text>
              <Text style={[styles.overviewStatLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Phases */}
      {PIPELINE_PHASES.map((phase) => {
        const isExpanded = expanded === phase.id;
        const phaseColor = phase.status === "complete" ? colors.success
          : phase.status === "active" ? colors.primary
          : colors.mutedForeground;

        return (
          <Pressable
            key={phase.id}
            onPress={() => setExpanded(isExpanded ? null : phase.id)}
            style={[styles.phaseCard, { backgroundColor: colors.card, borderColor: phase.status === "active" ? colors.primary : colors.border, borderWidth: phase.status === "active" ? 1.5 : 1 }]}
          >
            <View style={styles.phaseHeader}>
              <View style={[styles.phaseNum, { backgroundColor: phaseColor }]}>
                <Text style={styles.phaseNumText}>{phase.id}</Text>
              </View>
              <View style={styles.phaseInfo}>
                <Text style={[styles.phaseName, { color: colors.foreground }]}>{phase.name}</Text>
                <View style={[styles.phaseStatusChip, { backgroundColor: phaseColor + "22" }]}>
                  <Feather
                    name={phase.status === "complete" ? "check-circle" : phase.status === "active" ? "loader" : "clock"}
                    size={10}
                    color={phaseColor}
                  />
                  <Text style={[styles.phaseStatusText, { color: phaseColor }]}>{phase.status}</Text>
                </View>
              </View>
              <Feather name={isExpanded ? "chevron-up" : "chevron-down"} size={14} color={colors.mutedForeground} />
            </View>

            {isExpanded && (
              <View style={styles.phaseBody}>
                <Text style={[styles.phaseDesc, { color: colors.mutedForeground }]}>{phase.description}</Text>
                <View style={styles.phaseTasks}>
                  {phase.tasks.map((task, i) => (
                    <View key={i} style={styles.phaseTaskRow}>
                      <Feather
                        name={phase.status === "complete" ? "check" : phase.status === "active" && i < 3 ? "check" : phase.status === "active" ? "loader" : "circle"}
                        size={11}
                        color={phase.status === "complete" ? colors.success : phase.status === "active" && i < 3 ? colors.success : phase.status === "active" ? colors.primary : colors.mutedForeground}
                      />
                      <Text style={[styles.phaseTaskText, { color: phase.status === "pending" ? colors.mutedForeground : colors.foreground }]}>{task}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── Art Style Tab ────────────────────────────────────────────────────────
function ArtStyleTab() {
  const colors = useColors();

  const COLOR_PALETTE = [
    { name: "Void Indigo", hex: "#1A0D4A", role: "Background" },
    { name: "Shadow Navy", hex: "#0A0A1F", role: "Darkest" },
    { name: "Ember Blue", hex: "#2B7FFF", role: "Primary" },
    { name: "Arcane Violet", hex: "#7B2FFF", role: "Secondary" },
    { name: "Celestial Cyan", hex: "#00D4FF", role: "Accent" },
    { name: "Fire Gold", hex: "#F59E0B", role: "Warning" },
    { name: "Blood Crimson", hex: "#EF4444", role: "Danger" },
    { name: "Nature Green", hex: "#22C55E", role: "Success" },
    { name: "Bone White", hex: "#E8E4D4", role: "Text" },
    { name: "Ash Gray", hex: "#6B6B80", role: "Muted" },
  ];

  const CHAR_PROPORTIONS = [
    { part: "Head", size: "1.5 tiles × 1.5 tiles", note: "Slightly exaggerated for expressiveness" },
    { part: "Torso", size: "2 tiles × 1.5 tiles", note: "Heroic proportion, slightly wide" },
    { part: "Arms", size: "0.75 tile × 1.25 tiles", note: "Reaches to mid-thigh" },
    { part: "Legs", size: "1 tile × 2 tiles", note: "Longer than realistic for mobile readability" },
    { part: "Sprite total", size: "64×64 px (4×4 tiles)", note: "Target — all character sprites normalized" },
  ];

  const SPRITE_ANIMATIONS = [
    { name: "Idle", frames: "6–8", fps: "8", loop: "yes" },
    { name: "Walk", frames: "8", fps: "10", loop: "yes" },
    { name: "Run", frames: "8", fps: "14", loop: "yes" },
    { name: "Jump", frames: "5", fps: "12", loop: "no" },
    { name: "Attack (Light)", frames: "6–10", fps: "16", loop: "no" },
    { name: "Attack (Heavy)", frames: "10–14", fps: "12", loop: "no" },
    { name: "Cast Spell", frames: "10", fps: "14", loop: "no" },
    { name: "Hurt", frames: "4", fps: "12", loop: "no" },
    { name: "Death", frames: "12–16", fps: "10", loop: "no" },
    { name: "Dodge", frames: "6", fps: "16", loop: "no" },
  ];

  return (
    <View style={styles.tabContent}>
      {/* Active style */}
      <View style={[styles.activeStyleCard, { backgroundColor: colors.primary + "15", borderColor: colors.primary }]}>
        <Feather name="check-circle" size={14} color={colors.primary} />
        <View style={styles.activeStyleInfo}>
          <Text style={[styles.activeStyleLabel, { color: colors.primary }]}>ACTIVE ART STYLE</Text>
          <Text style={[styles.activeStyleValue, { color: colors.foreground }]}>Modern Pixel Art — 64×64</Text>
          <Text style={[styles.activeStyleSub, { color: colors.mutedForeground }]}>Full color · Shovel Knight / Owlboy inspired</Text>
        </View>
      </View>

      {/* Color palette */}
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>MASTER COLOR PALETTE</Text>
        <View style={styles.paletteGrid}>
          {COLOR_PALETTE.map((c) => (
            <View key={c.name} style={styles.paletteItem}>
              <View style={[styles.paletteSwatch, { backgroundColor: c.hex }]} />
              <Text style={[styles.paletteRole, { color: colors.mutedForeground }]}>{c.role}</Text>
              <Text style={[styles.paletteHex, { color: colors.foreground }]}>{c.hex}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Pixel art styles supported */}
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>SUPPORTED PIXEL ART STYLES</Text>
        {PIXEL_ART_STYLES.map((s) => (
          <View key={s.name} style={[styles.styleRow, { borderTopColor: colors.border }]}>
            <View style={[styles.styleSupport, { backgroundColor: s.supported ? colors.success + "22" : colors.muted }]}>
              <Feather name={s.supported ? "check" : "clock"} size={11} color={s.supported ? colors.success : colors.mutedForeground} />
            </View>
            <View style={styles.styleInfo}>
              <Text style={[styles.styleName, { color: s.supported ? colors.foreground : colors.mutedForeground }]}>{s.name}</Text>
              <Text style={[styles.styleRes, { color: colors.mutedForeground }]}>{s.resolution} · {s.colorDepth}</Text>
            </View>
            <Text style={[styles.styleExample, { color: colors.mutedForeground }]} numberOfLines={1}>{s.example}</Text>
          </View>
        ))}
      </View>

      {/* Character proportions */}
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>CHARACTER PROPORTION GUIDE</Text>
        {CHAR_PROPORTIONS.map((p) => (
          <View key={p.part} style={[styles.propRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.propPart, { color: colors.primary }]}>{p.part}</Text>
            <Text style={[styles.propSize, { color: colors.foreground }]}>{p.size}</Text>
            <Text style={[styles.propNote, { color: colors.mutedForeground }]}>{p.note}</Text>
          </View>
        ))}
      </View>

      {/* Animation standards */}
      <View style={[styles.section, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>ANIMATION STANDARDS</Text>
        <View style={styles.animTableHeader}>
          {["Animation", "Frames", "FPS", "Loop"].map((h) => (
            <Text key={h} style={[styles.animTableHead, { color: colors.mutedForeground, flex: h === "Animation" ? 2 : 1 }]}>{h}</Text>
          ))}
        </View>
        {SPRITE_ANIMATIONS.map((anim) => (
          <View key={anim.name} style={[styles.animTableRow, { borderTopColor: colors.border }]}>
            <Text style={[styles.animName, { color: colors.foreground }]}>{anim.name}</Text>
            <Text style={[styles.animCell, { color: colors.mutedForeground }]}>{anim.frames}</Text>
            <Text style={[styles.animCell, { color: colors.mutedForeground }]}>{anim.fps}</Text>
            <Text style={[styles.animCell, { color: anim.loop === "yes" ? colors.success : colors.mutedForeground }]}>{anim.loop}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

// ─── Asset Database Tab ───────────────────────────────────────────────────
function AssetDatabaseTab() {
  const colors = useColors();
  const [typeFilter, setTypeFilter] = useState<AssetType | "all">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const types: (AssetType | "all")[] = ["all", "sprite", "tileset", "vfx", "ui", "portrait", "music", "sfx", "ambient"];
  const filtered = typeFilter === "all" ? ASSET_DATABASE : ASSET_DATABASE.filter((a) => a.type === typeFilter);

  return (
    <View style={styles.tabContent}>
      {/* Stats */}
      <View style={styles.dbStats}>
        {[
          { label: "Total Assets", value: ASSET_DATABASE.length, color: colors.foreground },
          { label: "Complete", value: ASSET_DATABASE.filter((a) => a.status === "complete").length, color: colors.success },
          { label: "In Progress", value: ASSET_DATABASE.filter((a) => a.status !== "complete" && a.status !== "queued").length, color: colors.primary },
        ].map((s) => (
          <View key={s.label} style={[styles.dbStat, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.dbStatValue, { color: s.color }]}>{s.value}</Text>
            <Text style={[styles.dbStatLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Type filter */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.filterRow}>
          {types.map((t) => (
            <Pressable
              key={t}
              onPress={() => setTypeFilter(t)}
              style={[styles.filterChip, {
                backgroundColor: typeFilter === t ? colors.primary : colors.card,
                borderColor: typeFilter === t ? colors.primary : colors.border,
              }]}
            >
              {t !== "all" && <Feather name={TYPE_ICONS[t] as any} size={11} color={typeFilter === t ? "#fff" : colors.mutedForeground} />}
              <Text style={[styles.filterChipText, { color: typeFilter === t ? "#fff" : colors.mutedForeground }]}>
                {t === "all" ? "All" : t.charAt(0).toUpperCase() + t.slice(1)}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Asset list */}
      {filtered.map((asset) => {
        const isExpanded = expandedId === asset.id;
        const statusColor = STATUS_COLORS[asset.status];

        return (
          <Pressable
            key={asset.id}
            onPress={() => setExpandedId(isExpanded ? null : asset.id)}
            style={[styles.assetCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={styles.assetHeader}>
              <View style={[styles.assetTypeIcon, { backgroundColor: colors.muted }]}>
                <Feather name={TYPE_ICONS[asset.type] as any} size={14} color={colors.accent} />
              </View>
              <View style={styles.assetInfo}>
                <Text style={[styles.assetName, { color: colors.foreground }]} numberOfLines={1}>{asset.name}</Text>
                <Text style={[styles.assetMeta, { color: colors.mutedForeground }]}>
                  {asset.id} · v{asset.version} · {asset.creator}
                </Text>
              </View>
              <StatusChip status={asset.status} />
            </View>

            {isExpanded && (
              <View style={styles.assetDetails}>
                <View style={styles.assetDetailGrid}>
                  {asset.resolution && (
                    <View style={styles.assetDetailItem}>
                      <Text style={[styles.assetDetailLabel, { color: colors.mutedForeground }]}>Resolution</Text>
                      <Text style={[styles.assetDetailValue, { color: colors.foreground }]}>{asset.resolution}</Text>
                    </View>
                  )}
                  {asset.frames && (
                    <View style={styles.assetDetailItem}>
                      <Text style={[styles.assetDetailLabel, { color: colors.mutedForeground }]}>Frames</Text>
                      <Text style={[styles.assetDetailValue, { color: colors.foreground }]}>{asset.frames}</Text>
                    </View>
                  )}
                  {asset.sizeKb && (
                    <View style={styles.assetDetailItem}>
                      <Text style={[styles.assetDetailLabel, { color: colors.mutedForeground }]}>Size</Text>
                      <Text style={[styles.assetDetailValue, { color: colors.foreground }]}>{asset.sizeKb} KB</Text>
                    </View>
                  )}
                  {asset.durationSec && (
                    <View style={styles.assetDetailItem}>
                      <Text style={[styles.assetDetailLabel, { color: colors.mutedForeground }]}>Duration</Text>
                      <Text style={[styles.assetDetailValue, { color: colors.foreground }]}>{Math.floor(asset.durationSec / 60)}:{String(asset.durationSec % 60).padStart(2, "0")}</Text>
                    </View>
                  )}
                  <View style={styles.assetDetailItem}>
                    <Text style={[styles.assetDetailLabel, { color: colors.mutedForeground }]}>Method</Text>
                    <Text style={[styles.assetDetailValue, { color: colors.foreground }]}>{asset.method}</Text>
                  </View>
                </View>

                {asset.tags.length > 0 && (
                  <View style={styles.tagRow}>
                    {asset.tags.map((tag) => (
                      <View key={tag} style={[styles.tag, { backgroundColor: colors.muted }]}>
                        <Text style={[styles.tagText, { color: colors.mutedForeground }]}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}

                {asset.loreConnections && asset.loreConnections.length > 0 && (
                  <View style={[styles.loreBox, { backgroundColor: colors.secondary + "15", borderColor: colors.secondary }]}>
                    <Feather name="heart" size={11} color={colors.secondary} />
                    <Text style={[styles.loreBoxText, { color: colors.secondary }]}>
                      Living Asset · {asset.evolutionStates} evolution states
                    </Text>
                  </View>
                )}
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

// ─── Audio Tab ────────────────────────────────────────────────────────────
function AudioTab() {
  const colors = useColors();
  const [openSection, setOpenSection] = useState<string | null>("music");
  const toggle = (s: string) => setOpenSection((p) => (p === s ? null : s));

  const CATEGORY_COLORS: Record<string, string> = {
    theme: "#F59E0B",
    exploration: "#22C55E",
    combat: "#EF4444",
    boss: "#7B2FFF",
    ambient: "#00D4FF",
    menu: "#2B7FFF",
    credits: "#6B6B80",
  };

  return (
    <View style={styles.tabContent}>
      {/* Music tracks */}
      <Pressable
        onPress={() => toggle("music")}
        style={[styles.audioSecHeader, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <Feather name="music" size={14} color={colors.accent} />
        <Text style={[styles.audioSecTitle, { color: colors.foreground }]}>Music Tracks</Text>
        <View style={[styles.audioSecBadge, { backgroundColor: colors.primary + "22" }]}>
          <Text style={[styles.audioSecBadgeText, { color: colors.primary }]}>{AUDIO_TRACKS.length} tracks</Text>
        </View>
        <Feather name={openSection === "music" ? "chevron-up" : "chevron-down"} size={13} color={colors.mutedForeground} />
      </Pressable>
      {openSection === "music" && (
        <View style={styles.audioSecBody}>
          {AUDIO_TRACKS.map((track) => {
            const catColor = CATEGORY_COLORS[track.category] ?? colors.accent;
            return (
              <View key={track.id} style={[styles.trackCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.trackHeader}>
                  <View style={[styles.trackCat, { backgroundColor: catColor + "22" }]}>
                    <Text style={[styles.trackCatText, { color: catColor }]}>{track.category}</Text>
                  </View>
                  <Text style={[styles.trackName, { color: colors.foreground }]}>{track.name}</Text>
                  <StatusChip status={track.status} />
                </View>
                <Text style={[styles.trackMeta, { color: colors.mutedForeground }]}>
                  {track.tempo} · {track.duration}
                </Text>
                <View style={styles.trackInstruments}>
                  {track.instruments.map((ins) => (
                    <View key={ins} style={[styles.instrumentChip, { backgroundColor: colors.muted }]}>
                      <Text style={[styles.instrumentText, { color: colors.mutedForeground }]}>{ins}</Text>
                    </View>
                  ))}
                </View>
                {track.reactsTo.length > 1 && (
                  <View style={[styles.dynamicRow, { borderTopColor: colors.border }]}>
                    <Feather name="activity" size={11} color={colors.primary} />
                    <Text style={[styles.dynamicText, { color: colors.mutedForeground }]}>
                      Dynamic: {track.reactsTo.join(" → ")}
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* SFX */}
      <Pressable
        onPress={() => toggle("sfx")}
        style={[styles.audioSecHeader, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <Feather name="volume-2" size={14} color={colors.accent} />
        <Text style={[styles.audioSecTitle, { color: colors.foreground }]}>Sound Effects</Text>
        <View style={[styles.audioSecBadge, { backgroundColor: colors.primary + "22" }]}>
          <Text style={[styles.audioSecBadgeText, { color: colors.primary }]}>{SFX_ENTRIES.length} banks</Text>
        </View>
        <Feather name={openSection === "sfx" ? "chevron-up" : "chevron-down"} size={13} color={colors.mutedForeground} />
      </Pressable>
      {openSection === "sfx" && (
        <View style={styles.audioSecBody}>
          {["Weapons", "Magic", "Footsteps", "Interface", "Enemies", "Boss", "Ambient"].map((cat) => {
            const entries = SFX_ENTRIES.filter((s) => s.category === cat);
            if (!entries.length) return null;
            return (
              <View key={cat} style={styles.sfxGroup}>
                <Text style={[styles.sfxGroupLabel, { color: colors.mutedForeground }]}>{cat.toUpperCase()}</Text>
                {entries.map((s) => (
                  <View key={s.id} style={[styles.sfxRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Text style={[styles.sfxName, { color: colors.foreground }]}>{s.name}</Text>
                    <Text style={[styles.sfxVariants, { color: colors.mutedForeground }]}>{s.variants} vars</Text>
                    <StatusChip status={s.status} />
                  </View>
                ))}
              </View>
            );
          })}
        </View>
      )}

      {/* Localization */}
      <Pressable
        onPress={() => toggle("locale")}
        style={[styles.audioSecHeader, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <Feather name="globe" size={14} color={colors.accent} />
        <Text style={[styles.audioSecTitle, { color: colors.foreground }]}>Localization</Text>
        <View style={[styles.audioSecBadge, { backgroundColor: colors.primary + "22" }]}>
          <Text style={[styles.audioSecBadgeText, { color: colors.primary }]}>{LOCALES.length} languages</Text>
        </View>
        <Feather name={openSection === "locale" ? "chevron-up" : "chevron-down"} size={13} color={colors.mutedForeground} />
      </Pressable>
      {openSection === "locale" && (
        <View style={styles.audioSecBody}>
          {LOCALES.map((locale) => {
            const statusColor = locale.status === "complete" ? colors.success
              : locale.status === "in_progress" ? colors.primary
              : colors.mutedForeground;
            return (
              <View key={locale.code} style={[styles.localeRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={styles.localeFlag}>{locale.flag}</Text>
                <View style={styles.localeInfo}>
                  <Text style={[styles.localeName, { color: colors.foreground }]}>{locale.name}</Text>
                  <View style={[styles.localePbBg, { backgroundColor: colors.muted }]}>
                    <View style={[styles.localePbFill, { backgroundColor: statusColor, width: `${locale.coverage}%` as any }]} />
                  </View>
                </View>
                <Text style={[styles.localePct, { color: statusColor }]}>{locale.coverage}%</Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Audio mixer */}
      <View style={[styles.mixerCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>DYNAMIC AUDIO MIXER</Text>
        {[
          { label: "Music", level: 80, color: colors.primary },
          { label: "Dialogue", level: 95, color: colors.accent },
          { label: "SFX", level: 85, color: colors.success },
          { label: "Ambience", level: 60, color: colors.secondary },
        ].map((ch) => (
          <View key={ch.label} style={styles.mixerChannel}>
            <Text style={[styles.mixerLabel, { color: colors.foreground }]}>{ch.label}</Text>
            <View style={[styles.mixerBar, { backgroundColor: colors.muted }]}>
              <View style={[styles.mixerFill, { backgroundColor: ch.color, width: `${ch.level}%` as any }]} />
            </View>
            <Text style={[styles.mixerLevel, { color: ch.color }]}>{ch.level}%</Text>
          </View>
        ))}
        <View style={styles.mixerFeatures}>
          {["Dynamic ducking", "Compression", "Equalization"].map((f) => (
            <View key={f} style={[styles.mixerFeatureChip, { backgroundColor: colors.muted }]}>
              <Feather name="check" size={10} color={colors.success} />
              <Text style={[styles.mixerFeatureText, { color: colors.mutedForeground }]}>{f}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

// ─── Living Asset System Tab ───────────────────────────────────────────────
function LivingAssetTab() {
  const colors = useColors();
  const [selectedAsset, setSelectedAsset] = useState<string>(LIVING_ASSETS[0].assetId);
  const asset = LIVING_ASSETS.find((a) => a.assetId === selectedAsset)!;

  return (
    <View style={styles.tabContent}>
      {/* Exclusive feature banner */}
      <View style={[styles.livingBanner, { backgroundColor: colors.warning + "15", borderColor: colors.warning }]}>
        <Feather name="heart" size={14} color={colors.warning} />
        <View style={styles.livingBannerBody}>
          <Text style={[styles.livingBannerLabel, { color: colors.warning }]}>GENFORGEAI EXCLUSIVE — LIVING ASSET SYSTEM</Text>
          <Text style={[styles.livingBannerDesc, { color: colors.foreground }]}>
            Assets maintain full lore, faction, and quest metadata. When gameplay changes, all linked assets update automatically.
          </Text>
        </View>
      </View>

      {/* Asset selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.livingSelectorRow}>
          {LIVING_ASSETS.map((la) => (
            <Pressable
              key={la.assetId}
              onPress={() => setSelectedAsset(la.assetId)}
              style={[styles.livingSelectorChip, {
                backgroundColor: selectedAsset === la.assetId ? colors.secondary : colors.card,
                borderColor: selectedAsset === la.assetId ? colors.secondary : colors.border,
              }]}
            >
              <Feather name={TYPE_ICONS[la.type] as any} size={12} color={selectedAsset === la.assetId ? "#fff" : colors.mutedForeground} />
              <Text style={[styles.livingSelectorText, { color: selectedAsset === la.assetId ? "#fff" : colors.foreground }]}>
                {la.name}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>

      {/* Asset detail */}
      <View style={[styles.livingDetail, { backgroundColor: colors.card, borderColor: colors.secondary }]}>
        <View style={styles.livingDetailHeader}>
          <Feather name={TYPE_ICONS[asset.type] as any} size={16} color={colors.secondary} />
          <Text style={[styles.livingDetailName, { color: colors.foreground }]}>{asset.name}</Text>
          <View style={[styles.livingIdChip, { backgroundColor: colors.muted }]}>
            <Text style={[styles.livingIdText, { color: colors.mutedForeground }]}>{asset.assetId}</Text>
          </View>
        </View>

        {/* Lore connections */}
        <View style={styles.livingSection}>
          <Text style={[styles.livingSectionLabel, { color: colors.mutedForeground }]}>LORE CONNECTIONS</Text>
          {asset.loreConnections.map((lore, i) => (
            <View key={i} style={styles.loreConnectionRow}>
              <View style={[styles.loreConnectionDot, { backgroundColor: colors.secondary }]} />
              <Text style={[styles.loreConnectionText, { color: colors.foreground }]}>{lore}</Text>
            </View>
          ))}
        </View>

        {/* Ownership & quest */}
        <View style={styles.livingSection}>
          <Text style={[styles.livingSectionLabel, { color: colors.mutedForeground }]}>OWNERSHIP & QUEST</Text>
          <View style={styles.livingOwnerRow}>
            <Feather name="flag" size={12} color={colors.accent} />
            <Text style={[styles.livingOwnerLabel, { color: colors.mutedForeground }]}>Faction</Text>
            <Text style={[styles.livingOwnerValue, { color: colors.foreground }]}>{asset.factionOwner}</Text>
          </View>
          {asset.characterOwner && (
            <View style={styles.livingOwnerRow}>
              <Feather name="user" size={12} color={colors.accent} />
              <Text style={[styles.livingOwnerLabel, { color: colors.mutedForeground }]}>Character</Text>
              <Text style={[styles.livingOwnerValue, { color: colors.foreground }]}>{asset.characterOwner}</Text>
            </View>
          )}
          <View style={styles.livingOwnerRow}>
            <Feather name="map" size={12} color={colors.accent} />
            <Text style={[styles.livingOwnerLabel, { color: colors.mutedForeground }]}>Quest</Text>
            <Text style={[styles.livingOwnerValue, { color: colors.foreground }]}>{asset.questRelationship}</Text>
          </View>
        </View>

        {/* Evolution states */}
        <View style={styles.livingSection}>
          <Text style={[styles.livingSectionLabel, { color: colors.mutedForeground }]}>EVOLUTION STATES</Text>
          {asset.evolutionStates.map((ev) => (
            <View key={ev.state} style={[styles.evolutionState, { borderColor: ev.state === 1 ? colors.success : ev.state === 2 ? colors.warning : colors.destructive }]}>
              <View style={[styles.evolutionBadge, { backgroundColor: ev.state === 1 ? colors.success : ev.state === 2 ? colors.warning : colors.destructive }]}>
                <Text style={styles.evolutionBadgeText}>{ev.state}</Text>
              </View>
              <View style={styles.evolutionBody}>
                <Text style={[styles.evolutionLabel, { color: colors.foreground }]}>{ev.label}</Text>
                <Text style={[styles.evolutionTrigger, { color: colors.mutedForeground }]}>Trigger: {ev.triggerCondition}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Auto-synced systems */}
        <View style={styles.livingSection}>
          <Text style={[styles.livingSectionLabel, { color: colors.mutedForeground }]}>AUTO-SYNCED SYSTEMS</Text>
          <View style={styles.syncedGrid}>
            {asset.syncedSystems.map((sys) => (
              <View key={sys} style={[styles.syncedChip, { backgroundColor: colors.secondary + "18", borderColor: colors.secondary }]}>
                <Feather name="refresh-cw" size={10} color={colors.secondary} />
                <Text style={[styles.syncedText, { color: colors.secondary }]}>{sys}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Upgrade path */}
      <View style={[styles.upgradeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>UPGRADE PATH</Text>
        <View style={styles.upgradeRow}>
          {asset.upgradePath.map((stage, i) => (
            <React.Fragment key={stage}>
              <View style={[styles.upgradeStage, { backgroundColor: i === 0 ? colors.success + "22" : colors.muted, borderColor: i === 0 ? colors.success : colors.border }]}>
                <Text style={[styles.upgradeStageName, { color: i === 0 ? colors.success : colors.mutedForeground }]}>{stage}</Text>
              </View>
              {i < asset.upgradePath.length - 1 && (
                <Feather name="arrow-right" size={12} color={colors.mutedForeground} />
              )}
            </React.Fragment>
          ))}
        </View>
      </View>
    </View>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────
export function AssetGenerationPanel() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<AssetTab>("pipeline");

  return (
    <View style={styles.root}>
      {/* Tab bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.tabBar, { backgroundColor: colors.muted }]} contentContainerStyle={styles.tabBarContent}>
        {ASSET_TABS.map((tab) => (
          <Pressable
            key={tab.id}
            onPress={() => setActiveTab(tab.id)}
            style={[styles.tab, activeTab === tab.id && [styles.tabActive, { backgroundColor: colors.card }]]}
          >
            <Feather name={tab.icon as any} size={13} color={activeTab === tab.id ? colors.primary : colors.mutedForeground} />
            <Text style={[styles.tabLabel, { color: activeTab === tab.id ? colors.primary : colors.mutedForeground }]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {activeTab === "pipeline" && <PipelineTab />}
      {activeTab === "art" && <ArtStyleTab />}
      {activeTab === "assets" && <AssetDatabaseTab />}
      {activeTab === "audio" && <AudioTab />}
      {activeTab === "living" && <LivingAssetTab />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 12 },
  tabBar: { borderRadius: 12, flexGrow: 0 },
  tabBarContent: { padding: 3, gap: 2, flexDirection: "row" },
  tab: { flexDirection: "row", alignItems: "center", gap: 5, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 9 },
  tabActive: { shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 2, elevation: 2 },
  tabLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  tabContent: { gap: 10 },
  // Pipeline
  overviewCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 10 },
  overviewLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1 },
  progressBg: { height: 8, borderRadius: 4, overflow: "hidden" },
  progressFill: { height: 8, borderRadius: 4 },
  overviewStats: { flexDirection: "row", justifyContent: "space-around" },
  overviewStat: { alignItems: "center", gap: 2 },
  overviewStatValue: { fontSize: 22, fontFamily: "Inter_700Bold" },
  overviewStatLabel: { fontSize: 10, fontFamily: "Inter_400Regular" },
  phaseCard: { borderRadius: 12, overflow: "hidden" },
  phaseHeader: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12 },
  phaseNum: { width: 28, height: 28, borderRadius: 7, alignItems: "center", justifyContent: "center" },
  phaseNumText: { fontSize: 12, fontFamily: "Inter_700Bold", color: "#fff" },
  phaseInfo: { flex: 1, gap: 4 },
  phaseName: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  phaseStatusChip: { alignSelf: "flex-start", flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 7, paddingVertical: 2, borderRadius: 5 },
  phaseStatusText: { fontSize: 10, fontFamily: "Inter_600SemiBold", textTransform: "capitalize" },
  phaseBody: { paddingHorizontal: 14, paddingBottom: 14, gap: 8 },
  phaseDesc: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  phaseTasks: { gap: 6 },
  phaseTaskRow: { flexDirection: "row", alignItems: "center", gap: 7 },
  phaseTaskText: { fontSize: 12, fontFamily: "Inter_400Regular", flex: 1 },
  // Art Style
  activeStyleCard: { flexDirection: "row", alignItems: "flex-start", gap: 10, borderRadius: 12, borderWidth: 1, padding: 12 },
  activeStyleInfo: { flex: 1, gap: 3 },
  activeStyleLabel: { fontSize: 9, fontFamily: "Inter_700Bold", letterSpacing: 0.8 },
  activeStyleValue: { fontSize: 14, fontFamily: "Inter_700Bold" },
  activeStyleSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  section: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 10 },
  sectionLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1 },
  paletteGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  paletteItem: { alignItems: "center", gap: 3, width: "18%" },
  paletteSwatch: { width: 36, height: 36, borderRadius: 8 },
  paletteRole: { fontSize: 9, fontFamily: "Inter_400Regular" },
  paletteHex: { fontSize: 9, fontFamily: "Inter_500Medium" },
  styleRow: { flexDirection: "row", alignItems: "center", gap: 8, borderTopWidth: 1, paddingTop: 8 },
  styleSupport: { width: 26, height: 26, borderRadius: 6, alignItems: "center", justifyContent: "center" },
  styleInfo: { flex: 1 },
  styleName: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  styleRes: { fontSize: 10, fontFamily: "Inter_400Regular" },
  styleExample: { fontSize: 10, fontFamily: "Inter_400Regular", maxWidth: 100 },
  propRow: { borderTopWidth: 1, paddingTop: 8, gap: 2 },
  propPart: { fontSize: 12, fontFamily: "Inter_700Bold" },
  propSize: { fontSize: 12, fontFamily: "Inter_500Medium" },
  propNote: { fontSize: 11, fontFamily: "Inter_400Regular" },
  animTableHeader: { flexDirection: "row", paddingBottom: 4 },
  animTableHead: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  animTableRow: { flexDirection: "row", alignItems: "center", borderTopWidth: 1, paddingTop: 7, paddingBottom: 3 },
  animName: { flex: 2, fontSize: 12, fontFamily: "Inter_400Regular" },
  animCell: { flex: 1, fontSize: 11, fontFamily: "Inter_400Regular" },
  // Asset Database
  dbStats: { flexDirection: "row", gap: 8 },
  dbStat: { flex: 1, borderRadius: 10, borderWidth: 1, padding: 10, alignItems: "center", gap: 3 },
  dbStatValue: { fontSize: 20, fontFamily: "Inter_700Bold" },
  dbStatLabel: { fontSize: 10, fontFamily: "Inter_400Regular", textAlign: "center" },
  filterRow: { flexDirection: "row", gap: 6, paddingBottom: 4 },
  filterChip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  filterChipText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  assetCard: { borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  assetHeader: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12 },
  assetTypeIcon: { width: 34, height: 34, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  assetInfo: { flex: 1 },
  assetName: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  assetMeta: { fontSize: 10, fontFamily: "Inter_400Regular", marginTop: 1 },
  assetDetails: { paddingHorizontal: 12, paddingBottom: 12, gap: 8 },
  assetDetailGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  assetDetailItem: { gap: 2 },
  assetDetailLabel: { fontSize: 10, fontFamily: "Inter_500Medium" },
  assetDetailValue: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  tagRow: { flexDirection: "row", flexWrap: "wrap", gap: 5 },
  tag: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5 },
  tagText: { fontSize: 10, fontFamily: "Inter_400Regular" },
  loreBox: { flexDirection: "row", alignItems: "center", gap: 7, borderRadius: 8, borderWidth: 1, padding: 8 },
  loreBoxText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  statusChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5 },
  statusChipText: { fontSize: 9, fontFamily: "Inter_600SemiBold", textTransform: "capitalize" },
  // Audio
  audioSecHeader: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 11, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 11 },
  audioSecTitle: { flex: 1, fontSize: 13, fontFamily: "Inter_600SemiBold" },
  audioSecBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  audioSecBadgeText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  audioSecBody: { gap: 8, paddingLeft: 4 },
  trackCard: { borderRadius: 10, borderWidth: 1, padding: 12, gap: 7 },
  trackHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  trackCat: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5 },
  trackCatText: { fontSize: 9, fontFamily: "Inter_700Bold", textTransform: "uppercase" },
  trackName: { flex: 1, fontSize: 13, fontFamily: "Inter_600SemiBold" },
  trackMeta: { fontSize: 11, fontFamily: "Inter_400Regular" },
  trackInstruments: { flexDirection: "row", flexWrap: "wrap", gap: 5 },
  instrumentChip: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5 },
  instrumentText: { fontSize: 10, fontFamily: "Inter_400Regular" },
  dynamicRow: { flexDirection: "row", alignItems: "flex-start", gap: 6, borderTopWidth: 1, paddingTop: 7 },
  dynamicText: { flex: 1, fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 16 },
  sfxGroup: { gap: 5 },
  sfxGroupLabel: { fontSize: 9, fontFamily: "Inter_700Bold", letterSpacing: 0.8 },
  sfxRow: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 8, borderWidth: 1, paddingHorizontal: 10, paddingVertical: 7 },
  sfxName: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular" },
  sfxVariants: { fontSize: 11, fontFamily: "Inter_400Regular" },
  localeRow: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 8, borderWidth: 1, padding: 10 },
  localeFlag: { fontSize: 20 },
  localeInfo: { flex: 1, gap: 5 },
  localeName: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  localePbBg: { height: 4, borderRadius: 2, overflow: "hidden" },
  localePbFill: { height: 4, borderRadius: 2 },
  localePct: { fontSize: 12, fontFamily: "Inter_700Bold", width: 36, textAlign: "right" },
  mixerCard: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 10 },
  mixerChannel: { flexDirection: "row", alignItems: "center", gap: 10 },
  mixerLabel: { fontSize: 12, fontFamily: "Inter_500Medium", width: 60 },
  mixerBar: { flex: 1, height: 6, borderRadius: 3, overflow: "hidden" },
  mixerFill: { height: 6, borderRadius: 3 },
  mixerLevel: { fontSize: 11, fontFamily: "Inter_700Bold", width: 36, textAlign: "right" },
  mixerFeatures: { flexDirection: "row", flexWrap: "wrap", gap: 6, paddingTop: 4 },
  mixerFeatureChip: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  mixerFeatureText: { fontSize: 11, fontFamily: "Inter_400Regular" },
  // Living Assets
  livingBanner: { flexDirection: "row", alignItems: "flex-start", gap: 10, borderRadius: 12, borderWidth: 1, padding: 12 },
  livingBannerBody: { flex: 1, gap: 4 },
  livingBannerLabel: { fontSize: 9, fontFamily: "Inter_700Bold", letterSpacing: 0.8 },
  livingBannerDesc: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  livingSelectorRow: { flexDirection: "row", gap: 8 },
  livingSelectorChip: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10, borderWidth: 1 },
  livingSelectorText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  livingDetail: { borderRadius: 14, borderWidth: 1.5, padding: 14, gap: 14 },
  livingDetailHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  livingDetailName: { flex: 1, fontSize: 16, fontFamily: "Inter_700Bold" },
  livingIdChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  livingIdText: { fontSize: 10, fontFamily: "Inter_400Regular" },
  livingSection: { gap: 8 },
  livingSectionLabel: { fontSize: 9, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  loreConnectionRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  loreConnectionDot: { width: 6, height: 6, borderRadius: 3, marginTop: 5 },
  loreConnectionText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  livingOwnerRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  livingOwnerLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", width: 60 },
  livingOwnerValue: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular" },
  evolutionState: { flexDirection: "row", alignItems: "flex-start", gap: 10, borderRadius: 10, borderWidth: 1, padding: 10 },
  evolutionBadge: { width: 24, height: 24, borderRadius: 6, alignItems: "center", justifyContent: "center" },
  evolutionBadgeText: { fontSize: 11, fontFamily: "Inter_700Bold", color: "#fff" },
  evolutionBody: { flex: 1, gap: 3 },
  evolutionLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  evolutionTrigger: { fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 16 },
  syncedGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  syncedChip: { flexDirection: "row", alignItems: "center", gap: 5, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  syncedText: { fontSize: 10, fontFamily: "Inter_500Medium" },
  upgradeCard: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 10 },
  upgradeRow: { flexDirection: "row", alignItems: "center", flexWrap: "wrap", gap: 6 },
  upgradeStage: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8, borderWidth: 1 },
  upgradeStageName: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
});
