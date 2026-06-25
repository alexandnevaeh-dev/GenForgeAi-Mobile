export interface Biome {
  name: string;
  climate: string;
  hazards: string[];
  resources: string[];
  enemyDensity: "sparse" | "moderate" | "dense";
  color: string;
}

export interface WorldRegion {
  id: string;
  name: string;
  biome: string;
  level: string;
  secrets: number;
  bossName?: string;
  unlockCondition: string;
}

export interface WeatherSystem {
  type: string;
  frequency: string;
  effect: string;
  icon: string;
}

export interface Faction {
  name: string;
  alignment: "friendly" | "neutral" | "hostile" | "variable";
  specialty: string;
  territory: string;
  questGiver: boolean;
}

export interface CombatMechanic {
  name: string;
  type: "offensive" | "defensive" | "mobility" | "resource";
  description: string;
  cooldown: string;
}

export interface EnemyBehavior {
  archetype: string;
  aggression: "passive" | "reactive" | "aggressive" | "boss";
  phases: number;
  abilities: string[];
  drops: string[];
}

export interface SkillNode {
  id: string;
  name: string;
  tier: number;
  type: "passive" | "active" | "ultimate";
  description: string;
  prerequisite?: string;
}

export interface LootTable {
  tier: "common" | "uncommon" | "rare" | "epic" | "legendary";
  weight: number;
  color: string;
  examples: string[];
}

export interface CraftingRecipe {
  result: string;
  ingredients: string[];
  station: string;
  rarity: string;
}

export interface EconomyParam {
  label: string;
  value: string;
  icon: string;
}

export interface GlobalEvent {
  name: string;
  trigger: string;
  duration: string;
  effects: string[];
  probability: string;
}

export const BIOMES: Biome[] = [
  {
    name: "Shadowmere Forest",
    climate: "Temperate / Cursed",
    hazards: ["Poison mist", "Twisted roots", "Corrupted wildlife"],
    resources: ["Darkwood", "Shadow crystals", "Witchbloom"],
    enemyDensity: "dense",
    color: "#2D1B4E",
  },
  {
    name: "Ironspire Mountains",
    climate: "Sub-arctic / Volcanic vents",
    hazards: ["Avalanches", "Lava geysers", "Thin air"],
    resources: ["Ironstone", "Fireglass", "Dwarf ore"],
    enemyDensity: "moderate",
    color: "#4A2C0A",
  },
  {
    name: "Ashen Wastes",
    climate: "Arid / Irradiated",
    hazards: ["Ashstorms", "Mirage pools", "Bone golems"],
    resources: ["Ashen glass", "Soul sand", "Ancient relics"],
    enemyDensity: "sparse",
    color: "#6B5A3E",
  },
  {
    name: "Crystalwake Coast",
    climate: "Maritime / Magical",
    hazards: ["Storm surges", "Crystal shards", "Sea wraiths"],
    resources: ["Sea crystal", "Tidal iron", "Starfish ink"],
    enemyDensity: "moderate",
    color: "#0D4A6B",
  },
  {
    name: "Ember Plains",
    climate: "Temperate / Open",
    hazards: ["Wildfire", "Charging beasts", "Bandit camps"],
    resources: ["Embergrass", "Flint", "Mana herbs"],
    enemyDensity: "moderate",
    color: "#6B3A0A",
  },
  {
    name: "Celestial Spire",
    climate: "Ethereal / Endgame",
    hazards: ["Reality tears", "Anti-gravity zones", "Void entities"],
    resources: ["Stardust", "Void shards", "Celestial ore"],
    enemyDensity: "dense",
    color: "#1A0D4A",
  },
];

export const WORLD_REGIONS: WorldRegion[] = [
  { id: "r1", name: "The Starting Vale", biome: "Ember Plains", level: "1–5", secrets: 4, unlockCondition: "Starting area" },
  { id: "r2", name: "Shadowmere Forest", biome: "Shadowmere Forest", level: "5–12", secrets: 8, bossName: "The Verdant Lich", unlockCondition: "Complete Starting Vale" },
  { id: "r3", name: "Ironspire Peaks", biome: "Ironspire Mountains", level: "10–18", secrets: 6, bossName: "Kolthar the Forge-Bound", unlockCondition: "Reach level 10" },
  { id: "r4", name: "Ashen Wastes", biome: "Ashen Wastes", level: "15–24", secrets: 10, bossName: "The Sandborn Oracle", unlockCondition: "Clear Ironspire Peaks" },
  { id: "r5", name: "Crystalwake Coast", biome: "Crystalwake Coast", level: "20–30", secrets: 7, bossName: "Tide Queen Maerath", unlockCondition: "Obtain the Sea Sigil" },
  { id: "r6", name: "Celestial Spire", biome: "Celestial Spire", level: "28+", secrets: 12, bossName: "The Void Architect (Final)", unlockCondition: "Collect all 5 Astral Keys" },
];

export const WEATHER_SYSTEMS: WeatherSystem[] = [
  { type: "Ashstorm", frequency: "Rare · ~15%", effect: "Reduced visibility, +20% fire resistance", icon: "wind" },
  { type: "Blood Moon", frequency: "Very rare · ~5%", effect: "Enemy HP +40%, double XP gain", icon: "moon" },
  { type: "Mana Rain", frequency: "Common · ~30%", effect: "Spell cost –25%, mana regen +50%", icon: "droplet" },
  { type: "Fog of War", frequency: "Moderate · ~20%", effect: "Mini-map disabled, ambush frequency +2×", icon: "cloud" },
  { type: "Solar Flare", frequency: "Uncommon · ~12%", effect: "Undead weakness +60%, light-based skills activated", icon: "sun" },
];

export const FACTIONS: Faction[] = [
  { name: "The Iron Covenant", alignment: "friendly", specialty: "Smithing, siege warfare, trade routes", territory: "Ironspire Peaks", questGiver: true },
  { name: "Wraithmere Cult", alignment: "hostile", specialty: "Necromancy, shadow magic, infiltration", territory: "Shadowmere Forest", questGiver: false },
  { name: "Driftborn Corsairs", alignment: "variable", specialty: "Naval combat, smuggling, mercenary work", territory: "Crystalwake Coast", questGiver: true },
  { name: "The Ashwalkers", alignment: "neutral", specialty: "Survival, ancient knowledge, relic hunting", territory: "Ashen Wastes", questGiver: true },
  { name: "Celestial Order", alignment: "friendly", specialty: "Divination, healing, dimensional sealing", territory: "Celestial Spire", questGiver: true },
];

export const GLOBAL_EVENTS: GlobalEvent[] = [
  { name: "The Great Hunt", trigger: "Player reaches level 20", duration: "72 in-game hours", effects: ["Legendary beast spawns everywhere", "+50% rare drops", "Hunters NPC faction appears"], probability: "Scripted" },
  { name: "Void Incursion", trigger: "Random after 60% story", duration: "48 in-game hours", effects: ["Void portals spawn in all regions", "Enemy power +30%", "Special currency drops"], probability: "40% chance" },
  { name: "Festival of Embers", trigger: "Every 7 in-game days", duration: "24 in-game hours", effects: ["Merchants sell rare items at discount", "Crafting yield +2×", "Firework events in towns"], probability: "Scripted" },
  { name: "Faction War", trigger: "Player ignores one faction long enough", duration: "Until resolved", effects: ["Two factions battle, player can join either side", "Territory control changes", "Unique rewards"], probability: "60% chance" },
];

export const COMBAT_MECHANICS: CombatMechanic[] = [
  { name: "Parry Counter", type: "offensive", description: "Perfectly timed block triggers a devastating counter for 2.5× damage.", cooldown: "Reaction-based" },
  { name: "Spellweave", type: "offensive", description: "Chain up to 3 spells together for combo multipliers (+15% per chain link).", cooldown: "No cooldown" },
  { name: "Void Step", type: "mobility", description: "Short-range teleport passing through enemies. Deals collision damage.", cooldown: "4 seconds" },
  { name: "Mana Shield", type: "defensive", description: "Convert mana pool to temporary HP. Over-shielded mana explodes on break.", cooldown: "12 seconds" },
  { name: "Runic Overload", type: "resource", description: "Sacrifice 40% current HP to quadruple mana regeneration for 8 seconds.", cooldown: "90 seconds" },
  { name: "Soul Siphon", type: "resource", description: "On kill, restore 8% max HP and 12% max mana. Scales with enemy tier.", cooldown: "Passive" },
];

export const ENEMY_BEHAVIORS: EnemyBehavior[] = [
  { archetype: "Skirmisher", aggression: "aggressive", phases: 1, abilities: ["Flanking dash", "Throw projectile", "Retreat and regroup"], drops: ["Common items", "Coins"] },
  { archetype: "Tank Guardian", aggression: "reactive", phases: 2, abilities: ["Shield bash", "Ground slam", "Berserk mode (Phase 2)"], drops: ["Armor fragments", "Shield core"] },
  { archetype: "Spellcaster", aggression: "passive", phases: 1, abilities: ["Ranged spell burst", "Summon minions", "Teleport when threatened"], drops: ["Spell tomes", "Mana crystals"] },
  { archetype: "Apex Boss", aggression: "boss", phases: 3, abilities: ["Phase transition cutscene", "Area wipe ability", "Environmental hazards", "Enrage timer"], drops: ["Legendary loot", "Story item", "Blueprint"] },
];

export const SKILL_TREE_NODES: SkillNode[] = [
  { id: "s1", name: "Ember Strike", tier: 1, type: "active", description: "Basic fire melee attack. 120% weapon damage + burn." },
  { id: "s2", name: "Iron Skin", tier: 1, type: "passive", description: "Permanently increase armor by 8%." },
  { id: "s3", name: "Mana Flow", tier: 1, type: "passive", description: "+20 max mana, +5% mana regen per second." },
  { id: "s4", name: "Blazing Trail", tier: 2, type: "active", description: "Leave fire on the ground for 5 seconds after dashing.", prerequisite: "s1" },
  { id: "s5", name: "Void Mastery", tier: 2, type: "active", description: "Void Step damage +40%, second teleport charge unlocked.", prerequisite: "s3" },
  { id: "s6", name: "Rune Armor", tier: 2, type: "passive", description: "Shield absorbs spell damage. Reflect 15% back to attacker.", prerequisite: "s2" },
  { id: "s7", name: "Phoenix Rebirth", tier: 3, type: "ultimate", description: "On death: explode dealing 300% AoE fire damage, revive with 30% HP. Once per fight.", prerequisite: "s4" },
  { id: "s8", name: "Celestial Rift", tier: 3, type: "ultimate", description: "Open a dimensional rift for 10s: enemies inside take 400% spell damage.", prerequisite: "s5" },
];

export const LOOT_TABLES: LootTable[] = [
  { tier: "common", weight: 55, color: "#9CA3AF", examples: ["Iron Sword", "Leather Tunic", "Health Potion", "Mana Herb"] },
  { tier: "uncommon", weight: 25, color: "#22C55E", examples: ["Enchanted Blade", "Shadow Cloak", "Rune Scroll", "Mana Crystal"] },
  { tier: "rare", weight: 13, color: "#2B7FFF", examples: ["Void Gauntlet", "Storm Bow", "Soul Ring", "Dragon Scale"] },
  { tier: "epic", weight: 6, color: "#7B2FFF", examples: ["Hellfire Codex", "Celestial Plate", "Temporal Blade", "Archon's Staff"] },
  { tier: "legendary", weight: 1, color: "#F59E0B", examples: ["The Worldbreaker", "Crown of the Void Architect", "Eternity Loop", "Phoenix Mantle"] },
];

export const CRAFTING_RECIPES: CraftingRecipe[] = [
  { result: "Void Gauntlet", ingredients: ["Shadow Crystal ×3", "Darkwood ×2", "Iron Core ×1"], station: "Forge of Shadows", rarity: "rare" },
  { result: "Elixir of Eternity", ingredients: ["Mana Herb ×5", "Witchbloom ×2", "Stardust ×1"], station: "Alchemist's Cauldron", rarity: "epic" },
  { result: "Runic Shield", ingredients: ["Ironstone ×4", "Rune Fragment ×3", "Celestial Ore ×1"], station: "Master Anvil", rarity: "rare" },
  { result: "Celestial Plate Armor", ingredients: ["Celestial Ore ×6", "Void Shard ×4", "Dragon Scale ×2"], station: "Divine Forge (Endgame)", rarity: "epic" },
];

export const ECONOMY_PARAMS: EconomyParam[] = [
  { label: "Starting Gold", value: "150 coins", icon: "dollar-sign" },
  { label: "Shop Restock", value: "Every 3 in-game days", icon: "refresh-cw" },
  { label: "Sell Multiplier", value: "35% of base value", icon: "trending-down" },
  { label: "Auction House", value: "Unlocks at Chapter 3", icon: "package" },
  { label: "Inflation Rate", value: "Dynamic +2–8% per act", icon: "activity" },
  { label: "Black Market", value: "Faction reputation gated", icon: "shield-off" },
];

export const REPLAYABILITY = {
  seedSystem: "64-bit procedural seed — every generation is reproducible",
  worldVariants: 1024,
  narrativeBranches: 3,
  bossVariants: 2,
  proceduralModifiers: [
    "Cursed run — enemies have +40% HP, drops improved",
    "Pacifist run — combat rewards replaced by dialogue puzzles",
    "Speed run — world compressed, all gates time-gated",
    "Ironborn — permadeath, one save slot, hardcore loot",
    "Chaos seed — random faction alignments and weather locked",
  ],
  newGamePlus: "NG+ scales enemy power, adds hidden lore, unlocks alternate endings",
};
