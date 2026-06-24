export interface AgentDef {
  id: string;
  name: string;
  domain: string;
  icon: string;
  phase: number;
}

export const AGENT_DEFS: AgentDef[] = [
  // Phase 1 — World & Story Foundation (parallel)
  { id: "world_architect", name: "World Architect", domain: "World Building", icon: "globe", phase: 1 },
  { id: "story_architect", name: "Story Architect", domain: "Narrative", icon: "book-open", phase: 1 },
  { id: "character_designer", name: "Character Designer", domain: "Characters", icon: "users", phase: 1 },

  // Phase 2 — Gameplay Systems (parallel)
  { id: "enemy_designer", name: "Enemy Designer", domain: "Enemies", icon: "zap", phase: 2 },
  { id: "boss_designer", name: "Boss Designer", domain: "Bosses", icon: "shield", phase: 2 },
  { id: "combat_designer", name: "Combat Designer", domain: "Combat", icon: "crosshair", phase: 2 },
  { id: "ability_designer", name: "Ability Designer", domain: "Abilities", icon: "star", phase: 2 },

  // Phase 3 — Content Generation (parallel)
  { id: "quest_designer", name: "Quest Designer", domain: "Quests", icon: "flag", phase: 3 },
  { id: "environment_designer", name: "Environment Designer", domain: "Environments", icon: "map", phase: 3 },
  { id: "dungeon_designer", name: "Dungeon Designer", domain: "Dungeons", icon: "layers", phase: 3 },
  { id: "puzzle_designer", name: "Puzzle Designer", domain: "Puzzles", icon: "grid", phase: 3 },
  { id: "platforming_designer", name: "Platforming Designer", domain: "Platforming", icon: "trending-up", phase: 3 },

  // Phase 4 — Economy & Progression (parallel)
  { id: "progression_designer", name: "Progression Designer", domain: "Progression", icon: "bar-chart-2", phase: 4 },
  { id: "economy_designer", name: "Economy Designer", domain: "Economy", icon: "dollar-sign", phase: 4 },
  { id: "loot_designer", name: "Loot Designer", domain: "Loot", icon: "package", phase: 4 },
  { id: "crafting_designer", name: "Crafting Designer", domain: "Crafting", icon: "tool", phase: 4 },

  // Phase 5 — Assets (parallel)
  { id: "pixel_art_designer", name: "Pixel Art Designer", domain: "Art", icon: "image", phase: 5 },
  { id: "animation_designer", name: "Animation Designer", domain: "Animation", icon: "film", phase: 5 },
  { id: "ui_designer", name: "UI Designer", domain: "UI", icon: "layout", phase: 5 },
  { id: "audio_composer", name: "Audio Composer", domain: "Music", icon: "music", phase: 5 },
  { id: "sound_designer", name: "Sound Designer", domain: "SFX", icon: "volume-2", phase: 5 },

  // Phase 6 — Validation & Export (sequential)
  { id: "qa_agent", name: "QA Agent", domain: "Quality", icon: "check-circle", phase: 6 },
  { id: "performance_optimizer", name: "Performance Optimizer", domain: "Optimization", icon: "cpu", phase: 6 },
  { id: "documentation_agent", name: "Documentation Agent", domain: "Docs", icon: "file-text", phase: 6 },
];

export const PHASE_LABELS: Record<number, string> = {
  1: "Foundation",
  2: "Gameplay Systems",
  3: "Content Generation",
  4: "Economy & Progression",
  5: "Asset Generation",
  6: "QA & Export",
};
