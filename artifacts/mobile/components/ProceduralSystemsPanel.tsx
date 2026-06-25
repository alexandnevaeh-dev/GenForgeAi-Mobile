import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import {
  BIOMES,
  COMBAT_MECHANICS,
  CRAFTING_RECIPES,
  ECONOMY_PARAMS,
  ENEMY_BEHAVIORS,
  FACTIONS,
  GLOBAL_EVENTS,
  LOOT_TABLES,
  REPLAYABILITY,
  SKILL_TREE_NODES,
  WEATHER_SYSTEMS,
  WORLD_REGIONS,
} from "@/constants/procedural-systems";
import { useColors } from "@/hooks/useColors";

type SystemTab =
  | "world"
  | "story"
  | "combat"
  | "enemies"
  | "loot"
  | "replay";

const SYSTEM_TABS: { id: SystemTab; label: string; icon: string }[] = [
  { id: "world", label: "World", icon: "globe" },
  { id: "story", label: "Story", icon: "book-open" },
  { id: "combat", label: "Combat", icon: "zap" },
  { id: "enemies", label: "Enemies", icon: "shield" },
  { id: "loot", label: "Loot", icon: "package" },
  { id: "replay", label: "Replay", icon: "refresh-cw" },
];

function SectionHeader({
  title,
  icon,
  expanded,
  onToggle,
  badge,
}: {
  title: string;
  icon: string;
  expanded: boolean;
  onToggle: () => void;
  badge?: string;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onToggle}
      style={[styles.secHeader, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <Feather name={icon as any} size={15} color={colors.accent} />
      <Text style={[styles.secTitle, { color: colors.foreground }]}>{title}</Text>
      {badge && (
        <View style={[styles.secBadge, { backgroundColor: colors.primary + "22" }]}>
          <Text style={[styles.secBadgeText, { color: colors.primary }]}>{badge}</Text>
        </View>
      )}
      <Feather name={expanded ? "chevron-up" : "chevron-down"} size={14} color={colors.mutedForeground} />
    </Pressable>
  );
}

// ─── World Tab ────────────────────────────────────────────────────────────
function WorldTab() {
  const colors = useColors();
  const [openSection, setOpenSection] = useState<string | null>("regions");
  const toggle = (s: string) => setOpenSection((p) => (p === s ? null : s));

  return (
    <View style={styles.tabContent}>
      {/* World type */}
      <View style={[styles.worldTypeBanner, { backgroundColor: colors.primary + "15", borderColor: colors.primary }]}>
        <Feather name="map" size={14} color={colors.primary} />
        <View style={styles.worldTypeInfo}>
          <Text style={[styles.worldTypeLabel, { color: colors.primary }]}>WORLD TYPE</Text>
          <Text style={[styles.worldTypeValue, { color: colors.foreground }]}>Semi-Open World · Metroidvania Structure</Text>
        </View>
        <View style={[styles.worldSeedChip, { backgroundColor: colors.muted }]}>
          <Text style={[styles.worldSeedText, { color: colors.mutedForeground }]}>Seed: 8f4a2c91</Text>
        </View>
      </View>

      {/* Regions */}
      <SectionHeader title="Regions & Zones" icon="map-pin" expanded={openSection === "regions"} onToggle={() => toggle("regions")} badge={`${WORLD_REGIONS.length} zones`} />
      {openSection === "regions" && (
        <View style={styles.secBody}>
          {WORLD_REGIONS.map((r) => (
            <View key={r.id} style={[styles.regionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.regionHeader}>
                <View style={[styles.regionLevel, { backgroundColor: colors.primary + "22" }]}>
                  <Text style={[styles.regionLevelText, { color: colors.primary }]}>Lv {r.level}</Text>
                </View>
                <Text style={[styles.regionName, { color: colors.foreground }]}>{r.name}</Text>
                <Text style={[styles.regionBiome, { color: colors.mutedForeground }]}>{r.biome}</Text>
              </View>
              {r.bossName && (
                <View style={styles.regionBossRow}>
                  <Feather name="alert-circle" size={11} color={colors.destructive} />
                  <Text style={[styles.regionBoss, { color: colors.destructive }]}>Boss: {r.bossName}</Text>
                </View>
              )}
              <Text style={[styles.regionUnlock, { color: colors.mutedForeground }]}>
                🔓 {r.unlockCondition} · {r.secrets} secrets
              </Text>
            </View>
          ))}
        </View>
      )}

      {/* Biomes */}
      <SectionHeader title="Biome Ecosystem" icon="layers" expanded={openSection === "biomes"} onToggle={() => toggle("biomes")} badge={`${BIOMES.length} biomes`} />
      {openSection === "biomes" && (
        <View style={styles.secBody}>
          {BIOMES.map((b) => (
            <View key={b.name} style={[styles.biomeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.biomeColorBar, { backgroundColor: b.color }]} />
              <View style={styles.biomeBody}>
                <Text style={[styles.biomeName, { color: colors.foreground }]}>{b.name}</Text>
                <Text style={[styles.biomeClimate, { color: colors.mutedForeground }]}>{b.climate}</Text>
                <View style={styles.biomeRows}>
                  <View style={styles.biomeRow}>
                    <Feather name="alert-triangle" size={11} color={colors.warning} />
                    <Text style={[styles.biomeRowLabel, { color: colors.mutedForeground }]}>Hazards</Text>
                    <Text style={[styles.biomeRowValue, { color: colors.foreground }]}>{b.hazards.join(" · ")}</Text>
                  </View>
                  <View style={styles.biomeRow}>
                    <Feather name="package" size={11} color={colors.success} />
                    <Text style={[styles.biomeRowLabel, { color: colors.mutedForeground }]}>Resources</Text>
                    <Text style={[styles.biomeRowValue, { color: colors.foreground }]}>{b.resources.join(" · ")}</Text>
                  </View>
                </View>
                <View style={[styles.densityChip, {
                  backgroundColor: b.enemyDensity === "dense" ? colors.destructive + "22"
                    : b.enemyDensity === "moderate" ? colors.warning + "22"
                    : colors.success + "22",
                }]}>
                  <Text style={[styles.densityText, {
                    color: b.enemyDensity === "dense" ? colors.destructive
                      : b.enemyDensity === "moderate" ? colors.warning
                      : colors.success,
                  }]}>
                    Enemy density: {b.enemyDensity}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Weather */}
      <SectionHeader title="Weather System" icon="cloud" expanded={openSection === "weather"} onToggle={() => toggle("weather")} badge={`${WEATHER_SYSTEMS.length} conditions`} />
      {openSection === "weather" && (
        <View style={styles.secBody}>
          {WEATHER_SYSTEMS.map((w) => (
            <View key={w.type} style={[styles.weatherRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.weatherIcon, { backgroundColor: colors.muted }]}>
                <Feather name={w.icon as any} size={16} color={colors.accent} />
              </View>
              <View style={styles.weatherBody}>
                <Text style={[styles.weatherType, { color: colors.foreground }]}>{w.type}</Text>
                <Text style={[styles.weatherEffect, { color: colors.mutedForeground }]}>{w.effect}</Text>
              </View>
              <Text style={[styles.weatherFreq, { color: colors.primary }]}>{w.frequency}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Global Events */}
      <SectionHeader title="Global Events" icon="activity" expanded={openSection === "events"} onToggle={() => toggle("events")} badge={`${GLOBAL_EVENTS.length} events`} />
      {openSection === "events" && (
        <View style={styles.secBody}>
          {GLOBAL_EVENTS.map((e) => (
            <View key={e.name} style={[styles.eventCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.eventHeader}>
                <Text style={[styles.eventName, { color: colors.foreground }]}>{e.name}</Text>
                <View style={[styles.eventProb, { backgroundColor: colors.accent + "22" }]}>
                  <Text style={[styles.eventProbText, { color: colors.accent }]}>{e.probability}</Text>
                </View>
              </View>
              <Text style={[styles.eventMeta, { color: colors.mutedForeground }]}>
                Trigger: {e.trigger} · Duration: {e.duration}
              </Text>
              {e.effects.map((ef, i) => (
                <View key={i} style={styles.effectRow}>
                  <View style={[styles.effectDot, { backgroundColor: colors.primary }]} />
                  <Text style={[styles.effectText, { color: colors.foreground }]}>{ef}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Story Tab ────────────────────────────────────────────────────────────
function StoryTab() {
  const colors = useColors();
  const [openSection, setOpenSection] = useState<string | null>("structure");
  const toggle = (s: string) => setOpenSection((p) => (p === s ? null : s));

  const ACTS = [
    { act: "I", title: "The Awakening", chapters: 4, focus: "Introduction, inciting incident, first major threat", status: "complete" },
    { act: "II", title: "The Shattered World", chapters: 8, focus: "Faction conflicts, truth revealed, protagonist tested", status: "in_progress" },
    { act: "III", title: "The Final Rift", chapters: 5, focus: "Convergence, sacrifice choice, climactic battle, ending", status: "pending" },
  ];

  const NARRATIVE_BEATS = [
    { beat: "Inciting Incident", chapter: "Ch. 1", desc: "Ancient seal breaks — Void entities begin crossing over." },
    { beat: "First Revelation", chapter: "Ch. 3", desc: "Protagonist is the last descendant of the Void Architects." },
    { beat: "Betrayal", chapter: "Ch. 6", desc: "Trusted faction leader was working for the Wraithmere Cult." },
    { beat: "Dark Night of Soul", chapter: "Ch. 10", desc: "All factions abandon protagonist. Must choose who to trust." },
    { beat: "Final Choice", chapter: "Ch. 16", desc: "Seal the Void and lose magic forever, or merge with it." },
  ];

  const NARRATIVE_TYPES = [
    "Hero's Journey", "Political Intrigue", "Mystery",
    "Survival Narrative", "Emergent Narrative",
  ];

  return (
    <View style={styles.tabContent}>
      {/* Narrative summary */}
      <View style={[styles.narrativeSummary, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.narrativeSummaryLabel, { color: colors.mutedForeground }]}>NARRATIVE STRUCTURE</Text>
        <View style={styles.narrativeChips}>
          {NARRATIVE_TYPES.map((n) => (
            <View key={n} style={[styles.narrativeChip, { backgroundColor: colors.primary + "18", borderColor: colors.primary }]}>
              <Text style={[styles.narrativeChipText, { color: colors.primary }]}>{n}</Text>
            </View>
          ))}
        </View>
        <View style={styles.narrativeStats}>
          {[
            { label: "Acts", value: "3" },
            { label: "Chapters", value: "17" },
            { label: "Endings", value: "3" },
            { label: "Branches", value: "24" },
          ].map((s) => (
            <View key={s.label} style={styles.narrativeStat}>
              <Text style={[styles.narrativeStatValue, { color: colors.foreground }]}>{s.value}</Text>
              <Text style={[styles.narrativeStatLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Acts */}
      <SectionHeader title="Story Acts" icon="book" expanded={openSection === "structure"} onToggle={() => toggle("structure")} badge="3 acts" />
      {openSection === "structure" && (
        <View style={styles.secBody}>
          {ACTS.map((a) => {
            const color = a.status === "complete" ? colors.success : a.status === "in_progress" ? colors.primary : colors.mutedForeground;
            return (
              <View key={a.act} style={[styles.actCard, { backgroundColor: colors.card, borderColor: color }]}>
                <View style={[styles.actBadge, { backgroundColor: color }]}>
                  <Text style={styles.actBadgeText}>ACT {a.act}</Text>
                </View>
                <View style={styles.actBody}>
                  <Text style={[styles.actTitle, { color: colors.foreground }]}>{a.title}</Text>
                  <Text style={[styles.actChapters, { color: color }]}>{a.chapters} chapters</Text>
                  <Text style={[styles.actFocus, { color: colors.mutedForeground }]}>{a.focus}</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Narrative beats */}
      <SectionHeader title="Narrative Beats" icon="git-commit" expanded={openSection === "beats"} onToggle={() => toggle("beats")} badge={`${NARRATIVE_BEATS.length} beats`} />
      {openSection === "beats" && (
        <View style={styles.secBody}>
          {NARRATIVE_BEATS.map((b, i) => (
            <View key={i} style={styles.beatRow}>
              <View style={styles.beatLeft}>
                <View style={[styles.beatDot, { backgroundColor: colors.secondary }]} />
                {i < NARRATIVE_BEATS.length - 1 && <View style={[styles.beatLine, { backgroundColor: colors.border }]} />}
              </View>
              <View style={[styles.beatCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.beatHeader}>
                  <Text style={[styles.beatName, { color: colors.foreground }]}>{b.beat}</Text>
                  <View style={[styles.beatChapter, { backgroundColor: colors.muted }]}>
                    <Text style={[styles.beatChapterText, { color: colors.mutedForeground }]}>{b.chapter}</Text>
                  </View>
                </View>
                <Text style={[styles.beatDesc, { color: colors.mutedForeground }]}>{b.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Faction System */}
      <SectionHeader title="Faction System" icon="users" expanded={openSection === "factions"} onToggle={() => toggle("factions")} badge={`${FACTIONS.length} factions`} />
      {openSection === "factions" && (
        <View style={styles.secBody}>
          {FACTIONS.map((f) => {
            const alignColor = f.alignment === "friendly" ? colors.success
              : f.alignment === "hostile" ? colors.destructive
              : f.alignment === "variable" ? colors.warning
              : colors.mutedForeground;
            return (
              <View key={f.name} style={[styles.factionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.factionHeader}>
                  <Text style={[styles.factionName, { color: colors.foreground }]}>{f.name}</Text>
                  <View style={[styles.factionAlign, { backgroundColor: alignColor + "22" }]}>
                    <Text style={[styles.factionAlignText, { color: alignColor }]}>{f.alignment}</Text>
                  </View>
                </View>
                <Text style={[styles.factionSpec, { color: colors.mutedForeground }]}>{f.specialty}</Text>
                <View style={styles.factionMeta}>
                  <Feather name="map-pin" size={11} color={colors.accent} />
                  <Text style={[styles.factionTerritory, { color: colors.accent }]}>{f.territory}</Text>
                  {f.questGiver && (
                    <>
                      <Feather name="message-circle" size={11} color={colors.success} />
                      <Text style={[styles.factionQG, { color: colors.success }]}>Quest giver</Text>
                    </>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Dynamic Story Engine */}
      <SectionHeader title="Dynamic Story Engine" icon="cpu" expanded={openSection === "dse"} onToggle={() => toggle("dse")} />
      {openSection === "dse" && (
        <View style={styles.secBody}>
          {[
            { label: "Choices Tracked", value: "Every major decision", icon: "git-branch" },
            { label: "Reputation System", value: "Per-faction standing (–100 to +100)", icon: "star" },
            { label: "World State Flags", value: "340+ tracked variables", icon: "database" },
            { label: "Relationship Graph", value: "NPC memories persist across zones", icon: "link" },
            { label: "Adaptive Dialogue", value: "NPCs reference past player actions", icon: "message-square" },
            { label: "Consequence Delay", value: "Some choices resolve chapters later", icon: "clock" },
          ].map((item) => (
            <View key={item.label} style={[styles.dseRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.dseIcon, { backgroundColor: colors.secondary + "22" }]}>
                <Feather name={item.icon as any} size={14} color={colors.secondary} />
              </View>
              <View style={styles.dseBody}>
                <Text style={[styles.dseLabel, { color: colors.foreground }]}>{item.label}</Text>
                <Text style={[styles.dseValue, { color: colors.mutedForeground }]}>{item.value}</Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Combat Tab ───────────────────────────────────────────────────────────
function CombatTab() {
  const colors = useColors();
  const [openSection, setOpenSection] = useState<string | null>("mechanics");
  const toggle = (s: string) => setOpenSection((p) => (p === s ? null : s));

  const COMBAT_TYPES = ["Action RPG", "Soulslike", "Magic-heavy"];
  const MAGIC_SCHOOLS = [
    { name: "Pyromancy", element: "Fire", color: "#EF4444", spells: ["Ember Strike", "Blazing Trail", "Phoenix Nova"] },
    { name: "Void Arts", element: "Void", color: "#7B2FFF", spells: ["Void Step", "Rift Tear", "Celestial Rift"] },
    { name: "Geomancy", element: "Earth", color: "#78716C", spells: ["Stone Shield", "Tremor Pulse", "Ironwall"] },
    { name: "Necromancy", element: "Death", color: "#374151", spells: ["Soul Siphon", "Raise Dead", "Death Nova"] },
    { name: "Divine Light", element: "Holy", color: "#F59E0B", spells: ["Smite", "Mana Rain", "Celestial Barrier"] },
  ];

  const STATUS_EFFECTS = [
    { name: "Burning", type: "DoT", desc: "8% max HP/s for 5s. Spreads to adjacent enemies.", color: colors.destructive },
    { name: "Frozen", type: "CC", desc: "Enemy immobilized 2.5s. Shatter on hit for 180% bonus.", color: "#60A5FA" },
    { name: "Stunned", type: "CC", desc: "All actions disabled for 1.5s. Cannot be re-applied for 8s.", color: colors.warning },
    { name: "Cursed", type: "Debuff", desc: "–40% healing received. Stacks ×3. Removed at shrine.", color: colors.secondary },
    { name: "Mana Burn", type: "Resource", desc: "Drains 15 mana/s. At 0 mana, deals HP damage instead.", color: colors.primary },
  ];

  return (
    <View style={styles.tabContent}>
      {/* Combat types */}
      <View style={[styles.combatTypeBanner, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.combatTypeLabel, { color: colors.mutedForeground }]}>COMBAT STYLE</Text>
        <View style={styles.combatTypeChips}>
          {COMBAT_TYPES.map((ct) => (
            <View key={ct} style={[styles.combatTypeChip, { backgroundColor: colors.primary + "18", borderColor: colors.primary }]}>
              <Text style={[styles.combatTypeText, { color: colors.primary }]}>{ct}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Core mechanics */}
      <SectionHeader title="Core Mechanics" icon="zap" expanded={openSection === "mechanics"} onToggle={() => toggle("mechanics")} badge={`${COMBAT_MECHANICS.length} mechanics`} />
      {openSection === "mechanics" && (
        <View style={styles.secBody}>
          {COMBAT_MECHANICS.map((m) => {
            const typeColor = m.type === "offensive" ? colors.destructive
              : m.type === "defensive" ? colors.success
              : m.type === "mobility" ? colors.accent
              : colors.warning;
            return (
              <View key={m.name} style={[styles.mechanicCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.mechanicHeader}>
                  <Text style={[styles.mechanicName, { color: colors.foreground }]}>{m.name}</Text>
                  <View style={[styles.mechanicType, { backgroundColor: typeColor + "22" }]}>
                    <Text style={[styles.mechanicTypeText, { color: typeColor }]}>{m.type}</Text>
                  </View>
                </View>
                <Text style={[styles.mechanicDesc, { color: colors.mutedForeground }]}>{m.description}</Text>
                <Text style={[styles.mechanicCd, { color: colors.accent }]}>⟳ {m.cooldown}</Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Status effects */}
      <SectionHeader title="Status Effects" icon="alert-circle" expanded={openSection === "status"} onToggle={() => toggle("status")} badge={`${STATUS_EFFECTS.length} effects`} />
      {openSection === "status" && (
        <View style={styles.secBody}>
          {STATUS_EFFECTS.map((s) => (
            <View key={s.name} style={[styles.statusCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.statusLeft, { backgroundColor: s.color + "22" }]}>
                <Text style={[styles.statusName, { color: s.color }]}>{s.name}</Text>
                <Text style={[styles.statusType, { color: s.color }]}>{s.type}</Text>
              </View>
              <Text style={[styles.statusDesc, { color: colors.mutedForeground }]}>{s.desc}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Magic schools */}
      <SectionHeader title="Schools of Magic" icon="star" expanded={openSection === "magic"} onToggle={() => toggle("magic")} badge={`${MAGIC_SCHOOLS.length} schools`} />
      {openSection === "magic" && (
        <View style={styles.secBody}>
          {MAGIC_SCHOOLS.map((school) => (
            <View key={school.name} style={[styles.magicCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.magicLeft, { backgroundColor: school.color + "30" }]}>
                <Text style={[styles.magicSchoolName, { color: school.color }]}>{school.name}</Text>
                <Text style={[styles.magicElement, { color: school.color + "CC" }]}>{school.element}</Text>
              </View>
              <View style={styles.magicSpells}>
                {school.spells.map((sp) => (
                  <View key={sp} style={[styles.spellChip, { backgroundColor: school.color + "18" }]}>
                    <Text style={[styles.spellChipText, { color: school.color }]}>{sp}</Text>
                  </View>
                ))}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Skill Tree */}
      <SectionHeader title="Skill Tree" icon="git-branch" expanded={openSection === "skills"} onToggle={() => toggle("skills")} badge={`${SKILL_TREE_NODES.length} nodes`} />
      {openSection === "skills" && (
        <View style={styles.secBody}>
          {[1, 2, 3].map((tier) => (
            <View key={tier} style={styles.tierGroup}>
              <Text style={[styles.tierLabel, { color: colors.mutedForeground }]}>TIER {tier}</Text>
              {SKILL_TREE_NODES.filter((n) => n.tier === tier).map((node) => {
                const nodeColor = node.type === "ultimate" ? colors.warning
                  : node.type === "active" ? colors.primary
                  : colors.success;
                return (
                  <View key={node.id} style={[styles.skillNode, { backgroundColor: colors.card, borderColor: nodeColor }]}>
                    <View style={[styles.skillNodeType, { backgroundColor: nodeColor + "22" }]}>
                      <Text style={[styles.skillNodeTypeText, { color: nodeColor }]}>{node.type}</Text>
                    </View>
                    <View style={styles.skillNodeBody}>
                      <Text style={[styles.skillNodeName, { color: colors.foreground }]}>{node.name}</Text>
                      <Text style={[styles.skillNodeDesc, { color: colors.mutedForeground }]}>{node.description}</Text>
                      {node.prerequisite && (
                        <Text style={[styles.skillPrereq, { color: colors.accent }]}>Requires: {node.prerequisite.toUpperCase()}</Text>
                      )}
                    </View>
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Enemies Tab ──────────────────────────────────────────────────────────
function EnemiesTab() {
  const colors = useColors();
  const [openSection, setOpenSection] = useState<string | null>("behaviors");
  const toggle = (s: string) => setOpenSection((p) => (p === s ? null : s));

  const BOSS_PHASES = [
    { phase: 1, threshold: "100–60% HP", behavior: "Standard attack pattern, learning phase", mechanic: "Telegraphed attacks, dodge practice" },
    { phase: 2, threshold: "60–30% HP", behavior: "Speed increases, new ability unlocked, arena hazards begin", mechanic: "Enrage timer starts, add spawns" },
    { phase: 3, threshold: "30–0% HP", behavior: "Full berserk mode, all abilities active, desperation move available", mechanic: "Critical window opens, finisher available" },
  ];

  return (
    <View style={styles.tabContent}>
      {/* Enemy behaviors */}
      <SectionHeader title="Enemy Archetypes" icon="shield" expanded={openSection === "behaviors"} onToggle={() => toggle("behaviors")} badge={`${ENEMY_BEHAVIORS.length} types`} />
      {openSection === "behaviors" && (
        <View style={styles.secBody}>
          {ENEMY_BEHAVIORS.map((e) => {
            const aggColor = e.aggression === "boss" ? colors.destructive
              : e.aggression === "aggressive" ? colors.warning
              : e.aggression === "reactive" ? colors.primary
              : colors.success;
            return (
              <View key={e.archetype} style={[styles.enemyCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.enemyHeader}>
                  <Text style={[styles.enemyName, { color: colors.foreground }]}>{e.archetype}</Text>
                  <View style={[styles.aggressionChip, { backgroundColor: aggColor + "22" }]}>
                    <Text style={[styles.aggressionText, { color: aggColor }]}>{e.aggression}</Text>
                  </View>
                  {e.phases > 1 && (
                    <View style={[styles.phaseChip, { backgroundColor: colors.secondary + "22" }]}>
                      <Text style={[styles.phaseChipText, { color: colors.secondary }]}>{e.phases} phases</Text>
                    </View>
                  )}
                </View>
                <View style={styles.enemyAbilities}>
                  {e.abilities.map((ab) => (
                    <View key={ab} style={[styles.abilityTag, { backgroundColor: colors.muted }]}>
                      <Text style={[styles.abilityTagText, { color: colors.mutedForeground }]}>{ab}</Text>
                    </View>
                  ))}
                </View>
                <View style={styles.enemyDropRow}>
                  <Feather name="package" size={11} color={colors.success} />
                  <Text style={[styles.enemyDrops, { color: colors.mutedForeground }]}>Drops: {e.drops.join(", ")}</Text>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Boss AI phases */}
      <SectionHeader title="Boss AI Phase System" icon="alert-circle" expanded={openSection === "boss"} onToggle={() => toggle("boss")} badge="Adaptive AI" />
      {openSection === "boss" && (
        <View style={styles.secBody}>
          {BOSS_PHASES.map((p) => (
            <View key={p.phase} style={[styles.bossPhaseCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.bossPhaseBadge, {
                backgroundColor: p.phase === 1 ? colors.success + "22"
                  : p.phase === 2 ? colors.warning + "22"
                  : colors.destructive + "22",
              }]}>
                <Text style={[styles.bossPhaseNum, {
                  color: p.phase === 1 ? colors.success
                    : p.phase === 2 ? colors.warning
                    : colors.destructive,
                }]}>Phase {p.phase}</Text>
                <Text style={[styles.bossPhaseThreshold, {
                  color: p.phase === 1 ? colors.success
                    : p.phase === 2 ? colors.warning
                    : colors.destructive,
                }]}>{p.threshold}</Text>
              </View>
              <View style={styles.bossPhaseBody}>
                <Text style={[styles.bossPhaseBehavior, { color: colors.foreground }]}>{p.behavior}</Text>
                <Text style={[styles.bossPhaseMechanic, { color: colors.mutedForeground }]}>{p.mechanic}</Text>
              </View>
            </View>
          ))}

          {/* Adaptive AI features */}
          <View style={[styles.adaptiveAI, { backgroundColor: colors.secondary + "15", borderColor: colors.secondary }]}>
            <Feather name="cpu" size={14} color={colors.secondary} />
            <View style={styles.adaptiveBody}>
              <Text style={[styles.adaptiveLabel, { color: colors.secondary }]}>Adaptive Boss AI</Text>
              {[
                "Learns from player attack patterns after first attempt",
                "Adjusts phase transition timing based on play style",
                "Introduces new moves if same tactic used 3× consecutively",
                "NG+ bosses remember all previous encounter data",
              ].map((f, i) => (
                <Text key={i} style={[styles.adaptiveFeat, { color: colors.mutedForeground }]}>· {f}</Text>
              ))}
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

// ─── Loot Tab ─────────────────────────────────────────────────────────────
function LootTab() {
  const colors = useColors();
  const [openSection, setOpenSection] = useState<string | null>("rarity");
  const toggle = (s: string) => setOpenSection((p) => (p === s ? null : s));

  return (
    <View style={styles.tabContent}>
      {/* Rarity distribution */}
      <SectionHeader title="Rarity Distribution" icon="bar-chart-2" expanded={openSection === "rarity"} onToggle={() => toggle("rarity")} badge="6 tiers" />
      {openSection === "rarity" && (
        <View style={styles.secBody}>
          {LOOT_TABLES.map((l) => (
            <View key={l.tier} style={[styles.rarityCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.rarityLeft, { borderColor: l.color }]}>
                <Text style={[styles.rarityTier, { color: l.color }]}>{l.tier.toUpperCase()}</Text>
                <Text style={[styles.rarityWeight, { color: l.color }]}>{l.weight}%</Text>
              </View>
              <View style={[styles.rarityBar, { backgroundColor: colors.muted }]}>
                <View style={[styles.rarityFill, { backgroundColor: l.color, width: `${l.weight * 1.5}%` as any }]} />
              </View>
              <View style={styles.rarityExamples}>
                {l.examples.slice(0, 2).map((ex) => (
                  <Text key={ex} style={[styles.rarityExample, { color: colors.mutedForeground }]}>{ex}</Text>
                ))}
              </View>
            </View>
          ))}
          {/* Mythic note */}
          <View style={[styles.mythicNote, { backgroundColor: colors.warning + "15", borderColor: colors.warning }]}>
            <Feather name="award" size={13} color={colors.warning} />
            <Text style={[styles.mythicNoteText, { color: colors.warning }]}>
              Mythic tier (0.01%) — Story-locked items only. Cannot drop randomly. Awarded at major milestones.
            </Text>
          </View>
        </View>
      )}

      {/* Crafting system */}
      <SectionHeader title="Crafting System" icon="tool" expanded={openSection === "crafting"} onToggle={() => toggle("crafting")} badge={`${CRAFTING_RECIPES.length} recipes`} />
      {openSection === "crafting" && (
        <View style={styles.secBody}>
          {CRAFTING_RECIPES.map((r) => (
            <View key={r.result} style={[styles.recipeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.recipeHeader}>
                <Feather name="tool" size={13} color={colors.accent} />
                <Text style={[styles.recipeName, { color: colors.foreground }]}>{r.result}</Text>
                <View style={[styles.recipeRarity, { backgroundColor: colors.accent + "22" }]}>
                  <Text style={[styles.recipeRarityText, { color: colors.accent }]}>{r.rarity}</Text>
                </View>
              </View>
              <View style={styles.recipeIngredients}>
                {r.ingredients.map((ing) => (
                  <View key={ing} style={[styles.ingredientChip, { backgroundColor: colors.muted }]}>
                    <Text style={[styles.ingredientText, { color: colors.foreground }]}>{ing}</Text>
                  </View>
                ))}
              </View>
              <View style={styles.recipeStation}>
                <Feather name="map-pin" size={11} color={colors.mutedForeground} />
                <Text style={[styles.recipeStationText, { color: colors.mutedForeground }]}>{r.station}</Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Economy */}
      <SectionHeader title="Economy System" icon="dollar-sign" expanded={openSection === "economy"} onToggle={() => toggle("economy")} badge="Dynamic" />
      {openSection === "economy" && (
        <View style={styles.secBody}>
          {ECONOMY_PARAMS.map((e) => (
            <View key={e.label} style={[styles.econRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.econIcon, { backgroundColor: colors.success + "22" }]}>
                <Feather name={e.icon as any} size={14} color={colors.success} />
              </View>
              <Text style={[styles.econLabel, { color: colors.foreground }]}>{e.label}</Text>
              <Text style={[styles.econValue, { color: colors.success }]}>{e.value}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

// ─── Replayability Tab ────────────────────────────────────────────────────
function ReplayTab() {
  const colors = useColors();

  return (
    <View style={styles.tabContent}>
      {/* Seed system */}
      <View style={[styles.seedCard, { backgroundColor: colors.primary + "12", borderColor: colors.primary }]}>
        <Feather name="hash" size={16} color={colors.primary} />
        <View style={styles.seedBody}>
          <Text style={[styles.seedLabel, { color: colors.primary }]}>PROCEDURAL SEED SYSTEM</Text>
          <Text style={[styles.seedValue, { color: colors.foreground }]}>Seed: 8f4a2c91-bb34</Text>
          <Text style={[styles.seedDesc, { color: colors.mutedForeground }]}>{REPLAYABILITY.seedSystem}</Text>
        </View>
      </View>

      {/* Stats row */}
      <View style={styles.replayStatsRow}>
        {[
          { label: "World Variants", value: REPLAYABILITY.worldVariants.toLocaleString(), icon: "globe" },
          { label: "Story Branches", value: String(REPLAYABILITY.narrativeBranches), icon: "git-branch" },
          { label: "Boss Variants", value: String(REPLAYABILITY.bossVariants), icon: "shield" },
        ].map((s) => (
          <View key={s.label} style={[styles.replayStat, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name={s.icon as any} size={18} color={colors.accent} />
            <Text style={[styles.replayStatValue, { color: colors.foreground }]}>{s.value}</Text>
            <Text style={[styles.replayStatLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
          </View>
        ))}
      </View>

      {/* Run modifiers */}
      <View style={[styles.modifiersCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.modifiersLabel, { color: colors.mutedForeground }]}>CHALLENGE MODIFIERS</Text>
        {REPLAYABILITY.proceduralModifiers.map((mod, i) => {
          const [title, ...rest] = mod.split(" — ");
          return (
            <View key={i} style={[styles.modRow, { borderTopColor: colors.border }]}>
              <View style={[styles.modBadge, { backgroundColor: colors.secondary + "22" }]}>
                <Text style={[styles.modBadgeNum, { color: colors.secondary }]}>{i + 1}</Text>
              </View>
              <View style={styles.modBody}>
                <Text style={[styles.modTitle, { color: colors.foreground }]}>{title}</Text>
                {rest.length > 0 && <Text style={[styles.modDesc, { color: colors.mutedForeground }]}>{rest.join(" — ")}</Text>}
              </View>
            </View>
          );
        })}
      </View>

      {/* NG+ */}
      <View style={[styles.ngPlusCard, { backgroundColor: colors.warning + "15", borderColor: colors.warning }]}>
        <Feather name="refresh-cw" size={16} color={colors.warning} />
        <View style={styles.ngPlusBody}>
          <Text style={[styles.ngPlusLabel, { color: colors.warning }]}>NEW GAME+</Text>
          <Text style={[styles.ngPlusDesc, { color: colors.foreground }]}>{REPLAYABILITY.newGamePlus}</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────
export function ProceduralSystemsPanel() {
  const colors = useColors();
  const [activeTab, setActiveTab] = useState<SystemTab>("world");

  return (
    <View style={styles.root}>
      {/* System tabs */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={[styles.systemTabBar, { backgroundColor: colors.muted }]}
        contentContainerStyle={styles.systemTabContent}
      >
        {SYSTEM_TABS.map((tab) => (
          <Pressable
            key={tab.id}
            onPress={() => setActiveTab(tab.id)}
            style={[
              styles.systemTab,
              activeTab === tab.id && [styles.systemTabActive, { backgroundColor: colors.card, shadowColor: "#000" }],
            ]}
          >
            <Feather
              name={tab.icon as any}
              size={13}
              color={activeTab === tab.id ? colors.primary : colors.mutedForeground}
            />
            <Text style={[styles.systemTabLabel, { color: activeTab === tab.id ? colors.primary : colors.mutedForeground }]}>
              {tab.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Tab content */}
      {activeTab === "world" && <WorldTab />}
      {activeTab === "story" && <StoryTab />}
      {activeTab === "combat" && <CombatTab />}
      {activeTab === "enemies" && <EnemiesTab />}
      {activeTab === "loot" && <LootTab />}
      {activeTab === "replay" && <ReplayTab />}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 12 },
  systemTabBar: { borderRadius: 12, flexGrow: 0 },
  systemTabContent: { padding: 3, gap: 2, flexDirection: "row" },
  systemTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 9,
  },
  systemTabActive: {
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  systemTabLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  tabContent: { gap: 10 },
  secHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 11,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  secTitle: { flex: 1, fontSize: 13, fontFamily: "Inter_600SemiBold" },
  secBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  secBadgeText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  secBody: { gap: 8, paddingLeft: 6 },
  // World
  worldTypeBanner: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, borderWidth: 1, padding: 12 },
  worldTypeInfo: { flex: 1 },
  worldTypeLabel: { fontSize: 9, fontFamily: "Inter_700Bold", letterSpacing: 0.8 },
  worldTypeValue: { fontSize: 13, fontFamily: "Inter_600SemiBold", marginTop: 1 },
  worldSeedChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  worldSeedText: { fontSize: 10, fontFamily: "Inter_400Regular" },
  regionCard: { borderRadius: 10, borderWidth: 1, padding: 12, gap: 5 },
  regionHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  regionLevel: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5 },
  regionLevelText: { fontSize: 10, fontFamily: "Inter_700Bold" },
  regionName: { flex: 1, fontSize: 13, fontFamily: "Inter_600SemiBold" },
  regionBiome: { fontSize: 11, fontFamily: "Inter_400Regular" },
  regionBossRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  regionBoss: { fontSize: 12, fontFamily: "Inter_500Medium" },
  regionUnlock: { fontSize: 11, fontFamily: "Inter_400Regular" },
  biomeCard: { flexDirection: "row", borderRadius: 10, borderWidth: 1, overflow: "hidden" },
  biomeColorBar: { width: 4 },
  biomeBody: { flex: 1, padding: 12, gap: 6 },
  biomeName: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  biomeClimate: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: -4 },
  biomeRows: { gap: 4 },
  biomeRow: { flexDirection: "row", alignItems: "flex-start", gap: 5 },
  biomeRowLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", width: 54 },
  biomeRowValue: { flex: 1, fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 15 },
  densityChip: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5 },
  densityText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  weatherRow: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 10, borderWidth: 1, padding: 10 },
  weatherIcon: { width: 36, height: 36, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  weatherBody: { flex: 1 },
  weatherType: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  weatherEffect: { fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 15 },
  weatherFreq: { fontSize: 10, fontFamily: "Inter_500Medium", textAlign: "right", maxWidth: 90 },
  eventCard: { borderRadius: 10, borderWidth: 1, padding: 12, gap: 6 },
  eventHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  eventName: { flex: 1, fontSize: 13, fontFamily: "Inter_600SemiBold" },
  eventProb: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5 },
  eventProbText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  eventMeta: { fontSize: 11, fontFamily: "Inter_400Regular" },
  effectRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  effectDot: { width: 5, height: 5, borderRadius: 3 },
  effectText: { fontSize: 12, fontFamily: "Inter_400Regular" },
  // Story
  narrativeSummary: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 10 },
  narrativeSummaryLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1 },
  narrativeChips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  narrativeChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 7, borderWidth: 1 },
  narrativeChipText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  narrativeStats: { flexDirection: "row", justifyContent: "space-around" },
  narrativeStat: { alignItems: "center", gap: 2 },
  narrativeStatValue: { fontSize: 20, fontFamily: "Inter_700Bold" },
  narrativeStatLabel: { fontSize: 10, fontFamily: "Inter_400Regular" },
  actCard: { flexDirection: "row", borderRadius: 10, borderWidth: 1.5, overflow: "hidden" },
  actBadge: { width: 52, alignItems: "center", justifyContent: "center", padding: 8 },
  actBadgeText: { fontSize: 10, fontFamily: "Inter_700Bold", color: "#fff", textAlign: "center" },
  actBody: { flex: 1, padding: 12, gap: 3 },
  actTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  actChapters: { fontSize: 11, fontFamily: "Inter_500Medium" },
  actFocus: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 16 },
  beatRow: { flexDirection: "row", gap: 8 },
  beatLeft: { alignItems: "center", width: 12 },
  beatDot: { width: 12, height: 12, borderRadius: 6, marginTop: 10 },
  beatLine: { flex: 1, width: 1, marginTop: 3 },
  beatCard: { flex: 1, borderRadius: 10, borderWidth: 1, padding: 10, gap: 4, marginBottom: 6 },
  beatHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  beatName: { flex: 1, fontSize: 13, fontFamily: "Inter_600SemiBold" },
  beatChapter: { paddingHorizontal: 7, paddingVertical: 3, borderRadius: 5 },
  beatChapterText: { fontSize: 10, fontFamily: "Inter_500Medium" },
  beatDesc: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  factionCard: { borderRadius: 10, borderWidth: 1, padding: 12, gap: 6 },
  factionHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  factionName: { flex: 1, fontSize: 13, fontFamily: "Inter_600SemiBold" },
  factionAlign: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5 },
  factionAlignText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  factionSpec: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  factionMeta: { flexDirection: "row", alignItems: "center", gap: 5 },
  factionTerritory: { fontSize: 11, fontFamily: "Inter_500Medium", flex: 1 },
  factionQG: { fontSize: 11, fontFamily: "Inter_500Medium" },
  dseRow: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 10, borderWidth: 1, padding: 12 },
  dseIcon: { width: 36, height: 36, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  dseBody: { flex: 1 },
  dseLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  dseValue: { fontSize: 11, fontFamily: "Inter_400Regular" },
  // Combat
  combatTypeBanner: { borderRadius: 12, borderWidth: 1, padding: 12, gap: 8 },
  combatTypeLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1 },
  combatTypeChips: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  combatTypeChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 7, borderWidth: 1 },
  combatTypeText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  mechanicCard: { borderRadius: 10, borderWidth: 1, padding: 12, gap: 5 },
  mechanicHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  mechanicName: { flex: 1, fontSize: 13, fontFamily: "Inter_600SemiBold" },
  mechanicType: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5 },
  mechanicTypeText: { fontSize: 10, fontFamily: "Inter_600SemiBold", textTransform: "capitalize" },
  mechanicDesc: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  mechanicCd: { fontSize: 11, fontFamily: "Inter_500Medium" },
  statusCard: { flexDirection: "row", borderRadius: 10, borderWidth: 1, overflow: "hidden" },
  statusLeft: { width: 80, alignItems: "center", justifyContent: "center", padding: 8, gap: 4 },
  statusName: { fontSize: 12, fontFamily: "Inter_700Bold", textAlign: "center" },
  statusType: { fontSize: 10, fontFamily: "Inter_500Medium" },
  statusDesc: { flex: 1, padding: 12, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  magicCard: { flexDirection: "row", borderRadius: 10, borderWidth: 1, overflow: "hidden" },
  magicLeft: { width: 80, alignItems: "center", justifyContent: "center", padding: 8, gap: 3 },
  magicSchoolName: { fontSize: 12, fontFamily: "Inter_700Bold", textAlign: "center" },
  magicElement: { fontSize: 10, fontFamily: "Inter_500Medium" },
  magicSpells: { flex: 1, flexDirection: "row", flexWrap: "wrap", gap: 6, padding: 10, alignContent: "center" },
  spellChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  spellChipText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  tierGroup: { gap: 6 },
  tierLabel: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 0.8 },
  skillNode: { borderRadius: 10, borderWidth: 1.5, padding: 12, gap: 6 },
  skillNodeType: { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5 },
  skillNodeTypeText: { fontSize: 10, fontFamily: "Inter_600SemiBold", textTransform: "capitalize" },
  skillNodeBody: { gap: 3 },
  skillNodeName: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  skillNodeDesc: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  skillPrereq: { fontSize: 10, fontFamily: "Inter_500Medium" },
  // Enemies
  enemyCard: { borderRadius: 10, borderWidth: 1, padding: 12, gap: 8 },
  enemyHeader: { flexDirection: "row", alignItems: "center", gap: 7 },
  enemyName: { flex: 1, fontSize: 14, fontFamily: "Inter_600SemiBold" },
  aggressionChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5 },
  aggressionText: { fontSize: 10, fontFamily: "Inter_600SemiBold", textTransform: "capitalize" },
  phaseChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5 },
  phaseChipText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  enemyAbilities: { flexDirection: "row", flexWrap: "wrap", gap: 5 },
  abilityTag: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5 },
  abilityTagText: { fontSize: 11, fontFamily: "Inter_400Regular" },
  enemyDropRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  enemyDrops: { fontSize: 11, fontFamily: "Inter_400Regular" },
  bossPhaseCard: { borderRadius: 10, borderWidth: 1, overflow: "hidden" },
  bossPhaseBadge: { padding: 10, gap: 2 },
  bossPhaseNum: { fontSize: 13, fontFamily: "Inter_700Bold" },
  bossPhaseThreshold: { fontSize: 11, fontFamily: "Inter_500Medium" },
  bossPhaseBody: { padding: 12, gap: 3 },
  bossPhaseBehavior: { fontSize: 13, fontFamily: "Inter_500Medium" },
  bossPhaseMechanic: { fontSize: 12, fontFamily: "Inter_400Regular" },
  adaptiveAI: { borderRadius: 10, borderWidth: 1, padding: 12, flexDirection: "row", gap: 10 },
  adaptiveBody: { flex: 1, gap: 4 },
  adaptiveLabel: { fontSize: 13, fontFamily: "Inter_700Bold", marginBottom: 2 },
  adaptiveFeat: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  // Loot
  rarityCard: { borderRadius: 10, borderWidth: 1, padding: 12, gap: 8 },
  rarityLeft: { flexDirection: "row", justifyContent: "space-between", borderLeftWidth: 3, paddingLeft: 10 },
  rarityTier: { fontSize: 12, fontFamily: "Inter_700Bold" },
  rarityWeight: { fontSize: 16, fontFamily: "Inter_700Bold" },
  rarityBar: { height: 6, borderRadius: 3, overflow: "hidden" },
  rarityFill: { height: 6, borderRadius: 3 },
  rarityExamples: { flexDirection: "row", gap: 6 },
  rarityExample: { fontSize: 11, fontFamily: "Inter_400Regular" },
  mythicNote: { flexDirection: "row", alignItems: "flex-start", gap: 8, borderRadius: 10, borderWidth: 1, padding: 10 },
  mythicNoteText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  recipeCard: { borderRadius: 10, borderWidth: 1, padding: 12, gap: 8 },
  recipeHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  recipeName: { flex: 1, fontSize: 13, fontFamily: "Inter_600SemiBold" },
  recipeRarity: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5 },
  recipeRarityText: { fontSize: 10, fontFamily: "Inter_600SemiBold", textTransform: "capitalize" },
  recipeIngredients: { flexDirection: "row", flexWrap: "wrap", gap: 5 },
  ingredientChip: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 5 },
  ingredientText: { fontSize: 11, fontFamily: "Inter_400Regular" },
  recipeStation: { flexDirection: "row", alignItems: "center", gap: 5 },
  recipeStationText: { fontSize: 11, fontFamily: "Inter_400Regular" },
  econRow: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 10, borderWidth: 1, padding: 12 },
  econIcon: { width: 34, height: 34, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  econLabel: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular" },
  econValue: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  // Replay
  seedCard: { flexDirection: "row", alignItems: "flex-start", gap: 10, borderRadius: 12, borderWidth: 1, padding: 14 },
  seedBody: { flex: 1, gap: 3 },
  seedLabel: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 0.8 },
  seedValue: { fontSize: 16, fontFamily: "Inter_700Bold" },
  seedDesc: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  replayStatsRow: { flexDirection: "row", gap: 8 },
  replayStat: { flex: 1, alignItems: "center", borderRadius: 12, borderWidth: 1, padding: 12, gap: 4 },
  replayStatValue: { fontSize: 20, fontFamily: "Inter_700Bold" },
  replayStatLabel: { fontSize: 10, fontFamily: "Inter_400Regular", textAlign: "center" },
  modifiersCard: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 0 },
  modifiersLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1, marginBottom: 6 },
  modRow: { flexDirection: "row", alignItems: "flex-start", gap: 10, paddingVertical: 10, borderTopWidth: 1 },
  modBadge: { width: 24, height: 24, borderRadius: 6, alignItems: "center", justifyContent: "center" },
  modBadgeNum: { fontSize: 11, fontFamily: "Inter_700Bold" },
  modBody: { flex: 1, gap: 2 },
  modTitle: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  modDesc: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  ngPlusCard: { flexDirection: "row", alignItems: "flex-start", gap: 10, borderRadius: 12, borderWidth: 1, padding: 14 },
  ngPlusBody: { flex: 1, gap: 4 },
  ngPlusLabel: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 0.8 },
  ngPlusDesc: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
});
