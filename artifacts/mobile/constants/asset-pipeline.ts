export type AssetType =
  | "sprite" | "tileset" | "environment" | "vfx" | "ui"
  | "portrait" | "music" | "sfx" | "ambient" | "animation";

export type AssetStatus = "queued" | "generating" | "validating" | "optimizing" | "complete" | "failed";

export interface Asset {
  id: string;
  name: string;
  type: AssetType;
  status: AssetStatus;
  creator: string;
  method: "procedural" | "ai-generated" | "template" | "hybrid";
  version: string;
  sizeKb?: number;
  resolution?: string;
  frames?: number;
  durationSec?: number;
  tags: string[];
  dependencies: string[];
  loreConnections?: string[];
  factionOwner?: string;
  questRelationship?: string;
  upgradeState?: number;
  evolutionStates?: number;
  thumbnail?: string;
}

export interface PipelinePhase {
  id: number;
  name: string;
  description: string;
  icon: string;
  tasks: string[];
  status: "pending" | "active" | "complete";
}

export interface PixelArtStyle {
  name: string;
  resolution: string;
  colorDepth: string;
  example: string;
  supported: boolean;
}

export interface AudioTrack {
  id: string;
  name: string;
  category: "theme" | "exploration" | "combat" | "boss" | "ambient" | "menu" | "credits";
  tempo: string;
  duration: string;
  instruments: string[];
  reactsTo: string[];
  status: AssetStatus;
}

export interface SFXEntry {
  id: string;
  name: string;
  category: string;
  variants: number;
  status: AssetStatus;
}

export interface LocaleEntry {
  code: string;
  name: string;
  flag: string;
  status: "complete" | "in_progress" | "queued";
  coverage: number;
}

export interface LivingAsset {
  assetId: string;
  name: string;
  type: AssetType;
  loreConnections: string[];
  factionOwner: string;
  characterOwner?: string;
  questRelationship: string;
  upgradePath: string[];
  evolutionStates: { state: number; label: string; triggerCondition: string }[];
  syncedSystems: string[];
}

// ─── Pipeline Phases ─────────────────────────────────────────────────────

export const PIPELINE_PHASES: PipelinePhase[] = [
  {
    id: 1,
    name: "Asset Requirements Analysis",
    description: "Scan blueprint and determine every asset needed: counts, resolutions, animation sets, audio tracks.",
    icon: "search",
    tasks: ["Parse blueprint asset manifest", "Count sprite requirements", "Determine resolution targets", "List audio requirements", "Map platform constraints"],
    status: "complete",
  },
  {
    id: 2,
    name: "Art Style Definition",
    description: "Generate color palettes, mood boards, style guides, character proportions, and environment standards.",
    icon: "eye",
    tasks: ["Generate master color palette", "Create mood board references", "Define character proportion guide", "Set environment visual standard", "Produce UI design system"],
    status: "complete",
  },
  {
    id: 3,
    name: "Asset Production",
    description: "Produce all sprites, tilesets, environments, VFX, UI elements, portraits, and audio assets.",
    icon: "image",
    tasks: ["Generate character sprites", "Produce enemy sprite sheets", "Create boss sprites & forms", "Generate environment tiles", "Produce VFX particle systems", "Generate UI elements", "Compose music tracks", "Generate SFX library"],
    status: "active",
  },
  {
    id: 4,
    name: "Quality Assurance",
    description: "Validate style consistency, resolution targets, naming conventions, animation integrity, audio quality.",
    icon: "check-circle",
    tasks: ["Style consistency check", "Resolution validation", "Naming convention audit", "Animation frame integrity", "Audio quality gate", "Engine compatibility check"],
    status: "pending",
  },
  {
    id: 5,
    name: "Optimization & Export",
    description: "Compress textures, generate sprite atlases, optimize audio, remove duplicates, bundle for target engine.",
    icon: "upload",
    tasks: ["Texture compression", "Atlas sheet generation", "LOD generation", "Audio optimization", "Duplicate removal", "Engine bundle packaging"],
    status: "pending",
  },
];

// ─── Pixel Art Styles ─────────────────────────────────────────────────────

export const PIXEL_ART_STYLES: PixelArtStyle[] = [
  { name: "8-bit Classic", resolution: "16×16 sprites", colorDepth: "16 colors/palette", example: "NES-era aesthetics", supported: true },
  { name: "16-bit SNES", resolution: "32×32 sprites", colorDepth: "256 colors", example: "Chrono Trigger-era", supported: true },
  { name: "GBA-inspired", resolution: "32×32–64×64", colorDepth: "512 colors", example: "Castlevania: AoS style", supported: true },
  { name: "Modern Pixel Art", resolution: "48×48–96×96", colorDepth: "Full color", example: "Shovel Knight / Owlboy", supported: true },
  { name: "HD-2D", resolution: "64×64 sprite + 3D BG", colorDepth: "Full color", example: "Octopath Traveler style", supported: true },
  { name: "Cyberpunk Pixel", resolution: "48×48", colorDepth: "Neon palette", example: "VA-11 Hall-A style", supported: true },
  { name: "Retro Fantasy", resolution: "32×32", colorDepth: "Warm desaturated", example: "Stardew Valley style", supported: true },
  { name: "Anime Pixel", resolution: "64×64–128×128", colorDepth: "Full color", example: "Record of Lodoss War style", supported: false },
];

// ─── Mock Asset Database ──────────────────────────────────────────────────

export const ASSET_DATABASE: Asset[] = [
  {
    id: "a001", name: "Protagonist Idle", type: "sprite", status: "complete",
    creator: "Pixel Art Designer", method: "ai-generated", version: "1.2",
    resolution: "64×64", frames: 6, sizeKb: 18,
    tags: ["protagonist", "animation", "idle"],
    dependencies: ["a010"],
    loreConnections: ["Last Void Architect descendant"],
    factionOwner: "Celestial Order",
    evolutionStates: 3,
  },
  {
    id: "a002", name: "Protagonist Walk Cycle", type: "sprite", status: "complete",
    creator: "Animation Designer", method: "ai-generated", version: "1.0",
    resolution: "64×64", frames: 8, sizeKb: 24,
    tags: ["protagonist", "animation", "movement"],
    dependencies: ["a001"],
    evolutionStates: 1,
  },
  {
    id: "a003", name: "Protagonist Attack", type: "sprite", status: "complete",
    creator: "Animation Designer", method: "ai-generated", version: "1.1",
    resolution: "64×64", frames: 10, sizeKb: 30,
    tags: ["protagonist", "combat", "animation"],
    dependencies: ["a001"],
    evolutionStates: 2,
  },
  {
    id: "a004", name: "Void Architect (Boss — Final)", type: "sprite", status: "generating",
    creator: "Boss Designer", method: "ai-generated", version: "0.8",
    resolution: "256×256", frames: 42, sizeKb: 290,
    tags: ["boss", "final", "multi-phase"],
    dependencies: ["a011", "a012"],
    loreConnections: ["Sealed in Celestial Spire", "Chapter 17 trigger"],
    factionOwner: "The Void",
    questRelationship: "Main story — Chapter 17",
    upgradeState: 0,
    evolutionStates: 3,
  },
  {
    id: "a005", name: "Shadowmere Forest Tileset", type: "tileset", status: "complete",
    creator: "Pixel Art Designer", method: "procedural", version: "2.0",
    resolution: "16×16 tiles", sizeKb: 128,
    tags: ["environment", "forest", "dark"],
    dependencies: [],
    loreConnections: ["Verdant Lich domain"],
    factionOwner: "Wraithmere Cult",
  },
  {
    id: "a006", name: "Ember Strike VFX", type: "vfx", status: "complete",
    creator: "VFX Designer", method: "procedural", version: "1.0",
    resolution: "128×128", frames: 12, sizeKb: 45,
    tags: ["vfx", "fire", "spell"],
    dependencies: ["a001"],
  },
  {
    id: "a007", name: "HUD — Health Bar", type: "ui", status: "complete",
    creator: "UI Designer", method: "template", version: "1.3",
    resolution: "320×24", sizeKb: 8,
    tags: ["ui", "hud", "health"],
    dependencies: [],
  },
  {
    id: "a008", name: "Main Theme — Overture", type: "music", status: "complete",
    creator: "Audio Composer", method: "ai-generated", version: "1.0",
    durationSec: 184, sizeKb: 4200,
    tags: ["music", "theme", "orchestral"],
    dependencies: [],
    loreConnections: ["Void Architect awakening motif"],
  },
  {
    id: "a009", name: "Boss Battle — Phase 1", type: "music", status: "generating",
    creator: "Audio Composer", method: "ai-generated", version: "0.5",
    durationSec: 220, sizeKb: 5100,
    tags: ["music", "boss", "dynamic"],
    dependencies: ["a008"],
  },
  {
    id: "a010", name: "Protagonist Portrait", type: "portrait", status: "complete",
    creator: "Pixel Art Designer", method: "ai-generated", version: "1.0",
    resolution: "96×96", sizeKb: 22,
    tags: ["portrait", "protagonist", "dialogue"],
    dependencies: [],
    loreConnections: ["Chapter 1 introduction"],
    evolutionStates: 3,
  },
  {
    id: "a011", name: "Final Boss Ambient", type: "ambient", status: "queued",
    creator: "Audio Composer", method: "ai-generated", version: "—",
    tags: ["ambient", "boss", "void"],
    dependencies: ["a008"],
  },
  {
    id: "a012", name: "Void Architect Portrait", type: "portrait", status: "queued",
    creator: "Pixel Art Designer", method: "ai-generated", version: "—",
    tags: ["portrait", "boss", "final"],
    dependencies: ["a010"],
    loreConnections: ["Main story — Ch. 17"],
    evolutionStates: 3,
  },
];

// ─── Audio Database ────────────────────────────────────────────────────────

export const AUDIO_TRACKS: AudioTrack[] = [
  {
    id: "m01", name: "Overture — The Broken Seal", category: "theme",
    tempo: "84 BPM", duration: "3:04", status: "complete",
    instruments: ["Full orchestra", "Choir", "Distorted lute"],
    reactsTo: ["Opening cinematic", "Menu screen"],
  },
  {
    id: "m02", name: "Ember Plains — Day", category: "exploration",
    tempo: "72 BPM", duration: "3:30", status: "complete",
    instruments: ["Acoustic guitar", "Light strings", "Flute"],
    reactsTo: ["Daytime outdoor", "No combat"],
  },
  {
    id: "m03", name: "Shadowmere — Dread March", category: "combat",
    tempo: "138 BPM", duration: "2:45", status: "complete",
    instruments: ["Heavy strings", "War drums", "Brass section"],
    reactsTo: ["Enemy aggro in Shadowmere", "Elite encounters"],
  },
  {
    id: "m04", name: "Verdant Lich — Boss Theme", category: "boss",
    tempo: "160 BPM", duration: "4:12", status: "complete",
    instruments: ["Choir", "Pipe organ", "Electric strings", "Percussion"],
    reactsTo: ["Boss Phase 1 trigger", "Phase 2: adds distortion layer", "Phase 3: full chaos mode"],
  },
  {
    id: "m05", name: "Celestial Spire — Ambient", category: "ambient",
    tempo: "—", duration: "looping", status: "generating",
    instruments: ["Synth pads", "Celestial choir", "Reversed piano"],
    reactsTo: ["Celestial Spire zone", "Endgame section"],
  },
  {
    id: "m06", name: "Void Architect — Final Battle", category: "boss",
    tempo: "180 BPM", duration: "6:22", status: "queued",
    instruments: ["Full orchestra", "Electronic", "Choir", "Percussion ensemble"],
    reactsTo: ["Final boss phase 1", "Phase 2: adds electronic layer", "Phase 3: all layers + chaos percussion"],
  },
];

export const SFX_ENTRIES: SFXEntry[] = [
  { id: "s01", name: "Sword — Light Attack", category: "Weapons", variants: 4, status: "complete" },
  { id: "s02", name: "Sword — Heavy Attack", category: "Weapons", variants: 3, status: "complete" },
  { id: "s03", name: "Ember Strike — Impact", category: "Magic", variants: 5, status: "complete" },
  { id: "s04", name: "Void Step — Teleport", category: "Magic", variants: 3, status: "complete" },
  { id: "s05", name: "Footstep — Stone Floor", category: "Footsteps", variants: 8, status: "complete" },
  { id: "s06", name: "Footstep — Forest Ground", category: "Footsteps", variants: 8, status: "complete" },
  { id: "s07", name: "UI — Button Click", category: "Interface", variants: 2, status: "complete" },
  { id: "s08", name: "UI — Level Up", category: "Interface", variants: 1, status: "complete" },
  { id: "s09", name: "Boss Roar — Verdant Lich", category: "Enemies", variants: 3, status: "complete" },
  { id: "s10", name: "Environmental — Thunder", category: "Ambient", variants: 6, status: "generating" },
  { id: "s11", name: "Environmental — Wind", category: "Ambient", variants: 5, status: "generating" },
  { id: "s12", name: "Void Architect — Phase Transform", category: "Boss", variants: 1, status: "queued" },
];

export const LOCALES: LocaleEntry[] = [
  { code: "en", name: "English", flag: "🇬🇧", status: "complete", coverage: 100 },
  { code: "es", name: "Spanish", flag: "🇪🇸", status: "complete", coverage: 98 },
  { code: "fr", name: "French", flag: "🇫🇷", status: "in_progress", coverage: 76 },
  { code: "de", name: "German", flag: "🇩🇪", status: "in_progress", coverage: 71 },
  { code: "it", name: "Italian", flag: "🇮🇹", status: "queued", coverage: 12 },
  { code: "ja", name: "Japanese", flag: "🇯🇵", status: "queued", coverage: 8 },
  { code: "ko", name: "Korean", flag: "🇰🇷", status: "queued", coverage: 0 },
  { code: "zh", name: "Chinese", flag: "🇨🇳", status: "queued", coverage: 0 },
];

// ─── Living Asset System ──────────────────────────────────────────────────

export const LIVING_ASSETS: LivingAsset[] = [
  {
    assetId: "a004",
    name: "Void Architect",
    type: "sprite",
    loreConnections: ["Built the Celestial Spire", "Sealed by Protagonist's ancestor", "Seeks to unmake the world"],
    factionOwner: "The Void",
    questRelationship: "Main story climax — Chapter 17",
    upgradePath: ["Dormant Form", "Awakened Form", "Unbound Form"],
    evolutionStates: [
      { state: 1, label: "Dormant", triggerCondition: "Before player enters Celestial Spire" },
      { state: 2, label: "Awakened", triggerCondition: "Player collects 3 Astral Keys" },
      { state: 3, label: "Unbound", triggerCondition: "Final boss battle — Phase 3 transition" },
    ],
    syncedSystems: ["Boss sprite variants", "Boss music layers", "Loot table", "Encyclopedia entry", "Dialogue portrait", "Phase AI behavior"],
  },
  {
    assetId: "a001",
    name: "Protagonist",
    type: "sprite",
    loreConnections: ["Last descendant of Void Architects", "Chosen by Celestial Order"],
    factionOwner: "Celestial Order",
    characterOwner: "Protagonist",
    questRelationship: "Protagonist of all story arcs",
    upgradePath: ["Apprentice", "Knight", "Void Champion"],
    evolutionStates: [
      { state: 1, label: "Apprentice", triggerCondition: "Game start" },
      { state: 2, label: "Knight", triggerCondition: "Complete Act I — The Awakening" },
      { state: 3, label: "Void Champion", triggerCondition: "Accept the Void Merge ending" },
    ],
    syncedSystems: ["All sprite animations", "HUD display", "Dialogue portraits", "Skill tree unlocks", "Armor overlays"],
  },
  {
    assetId: "a005",
    name: "Shadowmere Forest Tileset",
    type: "tileset",
    loreConnections: ["Domain of the Verdant Lich", "Corrupted by Wraithmere Cult centuries ago"],
    factionOwner: "Wraithmere Cult",
    questRelationship: "Chapter 4 dungeon, Chapter 10 revisit",
    upgradePath: ["Corrupted", "Cleansed", "Burned"],
    evolutionStates: [
      { state: 1, label: "Corrupted", triggerCondition: "Default — before player intervention" },
      { state: 2, label: "Cleansed", triggerCondition: "Player defeats Verdant Lich AND chooses to purify" },
      { state: 3, label: "Burned", triggerCondition: "Player chooses to burn the forest (faction consequence)" },
    ],
    syncedSystems: ["Environment palette", "Enemy spawn tables", "Ambient audio", "Music layer", "Weather events", "NPC dialogue"],
  },
];
