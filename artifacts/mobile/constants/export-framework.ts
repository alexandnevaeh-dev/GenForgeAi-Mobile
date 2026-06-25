export type ExportPhase = 1 | 2 | 3;
export type TargetStatus = "official" | "supported" | "beta" | "planned";
export type ValidationStatus = "pass" | "warn" | "fail" | "pending";
export type HealthGrade = "A" | "B" | "C" | "D" | "F";

// ─── Export Targets ───────────────────────────────────────────────────────

export interface ExportTarget {
  id: string;
  name: string;
  phase: ExportPhase;
  status: TargetStatus;
  description: string;
  icon: string;
  folderStructure: string[];
  codeGenSystems: string[];
  fileFormats: string[];
  buildTime: string;
}

export const EXPORT_TARGETS: ExportTarget[] = [
  {
    id: "unity",
    name: "Unity",
    phase: 1,
    status: "official",
    description: "Full Unity project with Scenes, Prefabs, ScriptableObjects, Animation Controllers, and SOLID C# systems.",
    icon: "box",
    folderStructure: ["Assets/Art/", "Assets/Audio/", "Assets/Characters/", "Assets/Data/", "Assets/Prefabs/", "Assets/Resources/", "Assets/Scenes/", "Assets/Scripts/", "Assets/UI/", "Assets/VFX/"],
    codeGenSystems: ["Character Controller", "Enemy AI", "Inventory System", "Quest System", "Save System", "Dialogue System", "Combat System", "UI System"],
    fileFormats: [".unity", ".prefab", ".asset", ".cs", ".anim", ".controller"],
    buildTime: "~45s",
  },
  {
    id: "godot",
    name: "Godot 4.x",
    phase: 1,
    status: "official",
    description: "Native Godot 4 project with Scenes, GDScript systems, State Machines, and Resources.",
    icon: "triangle",
    folderStructure: ["assets/", "audio/", "scenes/", "scripts/", "ui/", "data/", "resources/"],
    codeGenSystems: ["GDScript Controllers", "State Machines", "Dialogue System", "Combat System", "Quest System", "Save System"],
    fileFormats: [".tscn", ".gd", ".tres", ".gdshader", ".import"],
    buildTime: "~30s",
  },
  {
    id: "unreal",
    name: "Unreal Engine 5",
    phase: 2,
    status: "supported",
    description: "Unreal project with Blueprints, Data Tables, Behavior Trees, Gameplay Ability System, and Materials.",
    icon: "cpu",
    folderStructure: ["Content/Blueprints/", "Content/DataTables/", "Content/Materials/", "Content/Animations/", "Content/UI/", "Source/"],
    codeGenSystems: ["Player Controller", "Game Mode", "Save Game", "AI Behavior Trees", "Ability System", "Inventory System"],
    fileFormats: [".umap", ".uasset", ".cpp", ".h", ".uplugin"],
    buildTime: "~90s",
  },
  {
    id: "gamemaker",
    name: "GameMaker",
    phase: 2,
    status: "supported",
    description: "GameMaker project with Rooms, Objects, GML Scripts, Sprites, and Data Files.",
    icon: "grid",
    folderStructure: ["rooms/", "objects/", "sprites/", "scripts/", "datafiles/", "sounds/"],
    codeGenSystems: ["Player Object", "Enemy Objects", "Quest Script", "Inventory Script", "Save System", "UI Objects"],
    fileFormats: [".yy", ".yyp", ".gml", ".png"],
    buildTime: "~25s",
  },
  {
    id: "html5",
    name: "HTML5 / Web",
    phase: 3,
    status: "beta",
    description: "Browser-ready build with WebGL renderer, optimized asset bundles, and Progressive Web App support.",
    icon: "globe",
    folderStructure: ["dist/", "assets/", "audio/", "scripts/", "styles/"],
    codeGenSystems: ["WebGL Renderer", "Asset Loader", "Input Handler", "Save to LocalStorage", "PWA Manifest"],
    fileFormats: [".html", ".js", ".wasm", ".json", ".css"],
    buildTime: "~60s",
  },
  {
    id: "android",
    name: "Android",
    phase: 3,
    status: "beta",
    description: "Android APK/AAB with touch controls, adaptive resolution, and Google Play ready packaging.",
    icon: "smartphone",
    folderStructure: ["app/src/main/", "res/", "assets/", "jni/"],
    codeGenSystems: ["Touch Input Layer", "Adaptive Resolution", "Audio Manager", "Save to SharedPreferences"],
    fileFormats: [".apk", ".aab", ".gradle", ".xml"],
    buildTime: "~120s",
  },
  {
    id: "windows",
    name: "Windows",
    phase: 3,
    status: "planned",
    description: "Windows desktop build with installer, Steam SDK integration hooks, and crash reporter.",
    icon: "monitor",
    folderStructure: ["bin/", "assets/", "config/", "logs/"],
    codeGenSystems: ["Windowed/Fullscreen Toggle", "Steam SDK Hooks", "Crash Reporter", "Auto-updater"],
    fileFormats: [".exe", ".dll", ".msi"],
    buildTime: "~75s",
  },
  {
    id: "linux",
    name: "Linux",
    phase: 3,
    status: "planned",
    description: "Linux x86_64 build with AppImage packaging and Proton compatibility layer support.",
    icon: "terminal",
    folderStructure: ["bin/", "lib/", "assets/", "config/"],
    codeGenSystems: ["AppImage Packager", "Proton Compat Layer", "X11/Wayland Support"],
    fileFormats: [".AppImage", ".so", ".desktop"],
    buildTime: "~70s",
  },
  {
    id: "macos",
    name: "macOS",
    phase: 3,
    status: "planned",
    description: "macOS .app bundle with notarization, Mac App Store packaging, and Apple Silicon support.",
    icon: "command",
    folderStructure: ["MyGame.app/Contents/", "MacOS/", "Resources/"],
    codeGenSystems: ["Universal Binary (ARM + x86)", "Notarization Pipeline", "Sandboxing Config"],
    fileFormats: [".app", ".dmg", ".pkg"],
    buildTime: "~80s",
  },
];

// ─── Project Structure ────────────────────────────────────────────────────

export interface FolderNode {
  name: string;
  type: "folder" | "file";
  children?: FolderNode[];
  note?: string;
}

export const PROJECT_STRUCTURE: FolderNode[] = [
  { name: "Project/", type: "folder", children: [
    { name: "Assets/", type: "folder", note: "All visual assets — sprites, tilesets, VFX" },
    { name: "Audio/", type: "folder", note: "Music tracks, SFX banks, ambient loops" },
    { name: "Characters/", type: "folder", note: "Character data, stats, dialogue refs" },
    { name: "Combat/", type: "folder", note: "Weapon configs, ability trees, balancing" },
    { name: "Data/", type: "folder", note: "JSON/CSV data tables — loot, skills, enemies" },
    { name: "Dialogue/", type: "folder", note: "Dialogue trees, localization strings" },
    { name: "Documentation/", type: "folder", note: "GDD, TDD, API docs, export guide" },
    { name: "Effects/", type: "folder", note: "Particle systems, shader configs" },
    { name: "Environments/", type: "folder", note: "Biome configs, tileset maps, lighting" },
    { name: "Levels/", type: "folder", note: "Level layouts, spawn configs, event zones" },
    { name: "Quests/", type: "folder", note: "Quest chains, objective trees, rewards" },
    { name: "Saves/", type: "folder", note: "Save slot configs, backup policies" },
    { name: "Scripts/", type: "folder", note: "Generated source code — engine-specific" },
    { name: "Settings/", type: "folder", note: "Graphics, audio, accessibility, controls" },
    { name: "UI/", type: "folder", note: "HUD, menus, inventory, dialogue UI" },
    { name: "README.md", type: "file", note: "Auto-generated project overview" },
  ]},
];

// ─── Code Generation Systems ──────────────────────────────────────────────

export interface CodeSystem {
  name: string;
  engine: string[];
  language: string;
  description: string;
  features: string[];
  linesEstimate: string;
}

export const CODE_SYSTEMS: CodeSystem[] = [
  {
    name: "Character Controller",
    engine: ["Unity", "Godot"],
    language: "C# / GDScript",
    description: "Full movement system: walk, run, jump, dodge, wall-slide, ledge-grab.",
    features: ["8-directional movement", "Coyote time", "Jump buffering", "Dodge with invincibility frames", "Animation state machine"],
    linesEstimate: "~400 lines",
  },
  {
    name: "Enemy AI",
    engine: ["Unity", "Godot", "Unreal"],
    language: "C# / GDScript / Blueprint",
    description: "Behaviour tree AI with patrol, chase, attack, retreat, and phase transitions.",
    features: ["Patrol waypoints", "Vision cone detection", "Attack pattern cycling", "Phase transitions", "Group coordination"],
    linesEstimate: "~600 lines",
  },
  {
    name: "Combat System",
    engine: ["Unity", "Godot", "Unreal"],
    language: "C# / GDScript / Blueprint",
    description: "Modular combat: hit detection, damage pipeline, status effects, combos.",
    features: ["Hitbox/hurtbox system", "Damage types & resistances", "Status effect stack", "Combo chain detection", "Parry window"],
    linesEstimate: "~800 lines",
  },
  {
    name: "Quest System",
    engine: ["Unity", "Godot"],
    language: "C# / GDScript",
    description: "Data-driven quest engine with objectives, branching outcomes, and faction tracking.",
    features: ["Objective tree", "Dynamic triggers", "Faction reputation updates", "Journal UI hook", "Quest chain dependencies"],
    linesEstimate: "~500 lines",
  },
  {
    name: "Inventory System",
    engine: ["Unity", "Godot", "Unreal"],
    language: "C# / GDScript / Blueprint",
    description: "Grid-based inventory with item stacking, equipment slots, and tooltips.",
    features: ["Grid layout (configurable)", "Equipment slot binding", "Item stacking & splitting", "Loot bag generation", "Save/load integration"],
    linesEstimate: "~650 lines",
  },
  {
    name: "Dialogue System",
    engine: ["Unity", "Godot"],
    language: "C# / GDScript",
    description: "Node-based branching dialogue with reputation conditions and voice hooks.",
    features: ["Branching dialogue trees", "Reputation-gated options", "Localization hook", "Portrait display", "Voice line trigger"],
    linesEstimate: "~450 lines",
  },
  {
    name: "Save System",
    engine: ["Unity", "Godot", "Unreal"],
    language: "C# / GDScript / Blueprint",
    description: "Multi-slot save with auto-save, manual save, cloud backup, and rollback.",
    features: ["3 save slots", "Auto-save on zone transition", "Delta compression", "Cloud sync hook", "Rollback to checkpoint"],
    linesEstimate: "~350 lines",
  },
  {
    name: "UI System",
    engine: ["Unity", "Godot"],
    language: "C# / GDScript",
    description: "Full HUD + menus: health bars, minimap, dialogue box, pause menu, settings.",
    features: ["Animated health/mana bars", "Minimap renderer", "Pause & settings menus", "Inventory screen", "Accessibility options"],
    linesEstimate: "~700 lines",
  },
];

// ─── Build Validation ─────────────────────────────────────────────────────

export interface ValidationCheck {
  name: string;
  category: string;
  status: ValidationStatus;
  detail: string;
}

export const BUILD_VALIDATION: ValidationCheck[] = [
  { name: "Missing asset scan", category: "Static", status: "pass", detail: "All 12 assets resolved — 0 missing references" },
  { name: "Broken reference check", category: "Static", status: "pass", detail: "Sprite atlas, audio bank, and tileset cross-references verified" },
  { name: "Invalid data detection", category: "Static", status: "pass", detail: "All JSON data tables pass schema validation" },
  { name: "Duplicate ID scan", category: "Static", status: "warn", detail: "2 quest IDs share prefix — recommend unique namespace" },
  { name: "Naming convention audit", category: "Static", status: "pass", detail: "All assets follow snake_case convention" },
  { name: "Logic flow validation", category: "Logic", status: "pass", detail: "Quest dependency graph — no circular dependencies" },
  { name: "Combat balance simulation", category: "Logic", status: "pass", detail: "DPS curves within ±12% of target across all enemies" },
  { name: "Save compatibility check", category: "Logic", status: "pass", detail: "Save schema v1.2 — backward compatible with v1.0" },
  { name: "Frame rate profiling", category: "Performance", status: "pass", detail: "Projected 60fps at target resolution — draw calls: 184/budget 256" },
  { name: "Memory footprint", category: "Performance", status: "warn", detail: "Audio bank at 87% of 256MB budget — consider streaming" },
  { name: "Texture compression", category: "Performance", status: "pass", detail: "All textures compressed — atlas generation complete" },
  { name: "Dependency resolution", category: "Dependencies", status: "pass", detail: "Engine packages resolved — no version conflicts" },
  { name: "Build manifest integrity", category: "Build", status: "pass", detail: "Manifest checksum verified — all included files accounted for" },
  { name: "Export target compatibility", category: "Build", status: "pass", detail: "Unity 2022 LTS + Godot 4.2 — compatible" },
];

// ─── Test Automation ──────────────────────────────────────────────────────

export interface TestSuite {
  system: string;
  icon: string;
  tests: string[];
  coverage: number;
  status: ValidationStatus;
}

export const TEST_SUITES: TestSuite[] = [
  {
    system: "Combat", icon: "zap",
    tests: ["Hit detection accuracy", "Damage pipeline integrity", "Status effect stacking", "Parry window timing", "Boss phase transitions"],
    coverage: 94, status: "pass",
  },
  {
    system: "Quest System", icon: "map",
    tests: ["Objective trigger fires", "Branch condition evaluation", "Faction rep updates", "Quest chain dependencies", "Completion rewards"],
    coverage: 88, status: "pass",
  },
  {
    system: "Save System", icon: "save",
    tests: ["Auto-save on zone exit", "Manual save slot isolation", "Load state correctness", "Rollback integrity", "Cloud sync handshake"],
    coverage: 97, status: "pass",
  },
  {
    system: "Inventory", icon: "package",
    tests: ["Item stack/split logic", "Equipment slot binding", "Loot generation distribution", "Sell/buy transactions", "Weight limit enforcement"],
    coverage: 91, status: "pass",
  },
  {
    system: "Progression", icon: "trending-up",
    tests: ["XP curve correctness", "Skill unlock gating", "Prestige reset integrity", "Stat scaling per level", "Achievement triggers"],
    coverage: 85, status: "warn",
  },
  {
    system: "UI Navigation", icon: "layout",
    tests: ["Menu state machine", "Pause/resume cycles", "Controller navigation", "Accessibility contrast", "Localization string bounds"],
    coverage: 79, status: "warn",
  },
];

// ─── QA Pipeline Stages ───────────────────────────────────────────────────

export interface QAStage {
  order: number;
  name: string;
  icon: string;
  description: string;
  status: ValidationStatus;
  duration: string;
}

export const QA_STAGES: QAStage[] = [
  { order: 1, name: "Static Validation", icon: "file-text", description: "Schema, naming, and reference integrity checks on all data files.", status: "pass", duration: "3.2s" },
  { order: 2, name: "Logic Validation", icon: "git-branch", description: "Quest graphs, combat balance, dialogue trees, and event triggers.", status: "pass", duration: "8.7s" },
  { order: 3, name: "Performance Checks", icon: "activity", description: "Draw call budget, memory footprint, audio streaming, and frame projections.", status: "warn", duration: "12.1s" },
  { order: 4, name: "Dependency Checks", icon: "link", description: "Engine package versions, asset cross-references, and plugin compatibility.", status: "pass", duration: "4.4s" },
  { order: 5, name: "Build Verification", icon: "check-circle", description: "Final manifest integrity, export target compatibility, and checksum validation.", status: "pass", duration: "6.8s" },
];

// ─── Save Systems ─────────────────────────────────────────────────────────

export interface SaveSystem {
  type: "auto" | "manual" | "cloud" | "backup";
  label: string;
  icon: string;
  description: string;
  tracks: string[];
}

export const SAVE_SYSTEMS: SaveSystem[] = [
  {
    type: "auto", label: "Auto Save", icon: "refresh-cw",
    description: "Triggered on zone transitions, chapter events, and every 5 minutes during gameplay.",
    tracks: ["Player position", "Active quests", "World state flags", "Inventory snapshot", "Faction standings"],
  },
  {
    type: "manual", label: "Manual Save", icon: "save",
    description: "3 named save slots with timestamp, screenshot thumbnail, and playtime.",
    tracks: ["Full game state", "Character data", "Skill tree", "Collected loot", "Story flags"],
  },
  {
    type: "cloud", label: "Cloud Save", icon: "cloud",
    description: "Optional sync to cloud — conflict resolution via timestamp + player choice prompt.",
    tracks: ["All manual save data", "Settings profile", "Achievement progress", "Completion percentage"],
  },
  {
    type: "backup", label: "Backup Saves", icon: "archive",
    description: "Rolling 5-backup history per slot. One-click rollback to any checkpoint.",
    tracks: ["Pre-boss snapshots", "Pre-major-choice snapshots", "Hourly rolling saves"],
  },
];

// ─── Settings Manifest ────────────────────────────────────────────────────

export interface SettingsCategory {
  name: string;
  icon: string;
  options: string[];
}

export const SETTINGS_MANIFEST: SettingsCategory[] = [
  { name: "Graphics", icon: "monitor", options: ["Resolution", "Fullscreen/Windowed", "Frame rate cap", "VSync", "Shadow quality", "Particle density", "Render scale"] },
  { name: "Audio", icon: "volume-2", options: ["Master volume", "Music volume", "SFX volume", "Dialogue volume", "Ambience volume", "Audio backend selection"] },
  { name: "Accessibility", icon: "eye", options: ["Color blind mode (3 types)", "High-contrast UI", "Screen shake intensity", "Text size", "Subtitle size & color", "Dyslexia-friendly font toggle"] },
  { name: "Controls", icon: "gamepad-2", options: ["Full key rebinding", "Controller layout", "Deadzone adjustment", "Vibration intensity", "Accessibility button hold toggle"] },
  { name: "Gameplay", icon: "sliders", options: ["Difficulty override", "Auto-aim toggle", "Hint frequency", "HUD visibility", "Minimap zoom", "Tutorial replay"] },
];

// ─── Documentation ────────────────────────────────────────────────────────

export interface DocSection {
  title: string;
  type: "gdd" | "tdd" | "export";
  icon: string;
  pages: number;
  sections: string[];
}

export const DOCUMENTATION: DocSection[] = [
  {
    title: "Game Design Document",
    type: "gdd",
    icon: "book-open",
    pages: 48,
    sections: ["Executive Summary", "Game Overview", "Core Pillars", "Story & Narrative", "World Design", "Gameplay Mechanics", "Combat Design", "Progression System", "Enemy & Boss Design", "Loot & Economy", "UI/UX Design", "Audio Direction", "Accessibility Guidelines"],
  },
  {
    title: "Technical Design Document",
    type: "tdd",
    icon: "code",
    pages: 72,
    sections: ["Architecture Overview", "Engine Configuration", "System Modules", "Data Structures", "API Reference", "Asset Pipeline Specs", "Save System Schema", "Network Architecture", "Performance Targets", "Build & Release Pipeline", "Testing Strategy", "Security Considerations"],
  },
  {
    title: "Export & Setup Guide",
    type: "export",
    icon: "upload",
    pages: 24,
    sections: ["Prerequisites", "Project Import Guide", "Engine Setup (Unity)", "Engine Setup (Godot)", "Asset Configuration", "Build Instructions", "Customization Guide", "Known Issues & Workarounds", "FAQ"],
  },
];

// ─── Project Health Score ──────────────────────────────────────────────────

export interface HealthCategory {
  name: string;
  icon: string;
  score: number;
  grade: HealthGrade;
  details: string[];
}

export const HEALTH_CATEGORIES: HealthCategory[] = [
  {
    name: "Stability", icon: "shield", score: 94, grade: "A",
    details: ["0 critical errors", "2 warnings (duplicate quest ID prefix, audio memory)", "All save systems verified", "No broken asset references"],
  },
  {
    name: "Balance", icon: "sliders", score: 88, grade: "B",
    details: ["DPS curves within ±12% of target", "Loot rarity distribution verified", "Boss difficulty scaling validated", "Economy inflation rate in safe range"],
  },
  {
    name: "Completeness", icon: "check-square", score: 91, grade: "A",
    details: ["12/12 assets complete or in generation", "8/8 quality gates passed or warn", "3-act story structure complete", "All 6 world regions defined"],
  },
  {
    name: "Performance", icon: "activity", score: 79, grade: "C",
    details: ["Draw calls: 184 / 256 budget (72%)", "Audio bank at 87% of 256MB", "Frame rate target: 60fps (projected)", "Recommend audio streaming for large zones"],
  },
  {
    name: "Scalability", icon: "trending-up", score: 86, grade: "B",
    details: ["Modular system architecture", "Data-driven config (no hardcoded values)", "Engine export to 2 targets", "DLC expansion hooks built in"],
  },
  {
    name: "Accessibility", icon: "eye", score: 82, grade: "B",
    details: ["Color blind mode: 3 types supported", "All text meets WCAG AA contrast", "Full control rebinding", "Subtitle system with size/color config"],
  },
];

// ─── Reverse Forge ────────────────────────────────────────────────────────

export interface RevergeForgeCapability {
  capability: string;
  description: string;
  icon: string;
  supported: string[];
}

export const REVERSE_FORGE_CAPABILITIES: RevergeForgeCapability[] = [
  {
    capability: "Read Project Structure",
    description: "Scan and map all folders, scenes, scripts, and data files into a normalized format.",
    icon: "folder",
    supported: ["Unity", "Godot", "Unreal", "GameMaker"],
  },
  {
    capability: "Identify Systems",
    description: "Detect implemented systems: combat, inventory, quest, save, dialogue, and more.",
    icon: "cpu",
    supported: ["Unity", "Godot", "Unreal"],
  },
  {
    capability: "Build Documentation",
    description: "Auto-generate GDD and TDD from existing code, comments, and data tables.",
    icon: "book-open",
    supported: ["Unity", "Godot"],
  },
  {
    capability: "Suggest Improvements",
    description: "AI analysis of architecture, identifying performance issues, missing systems, and technical debt.",
    icon: "zap",
    supported: ["Unity", "Godot", "Unreal", "GameMaker"],
  },
  {
    capability: "Generate Missing Content",
    description: "Fill gaps — missing enemy types, UI screens, quest chains — using existing project DNA.",
    icon: "plus-circle",
    supported: ["Unity", "Godot"],
  },
  {
    capability: "Modernize Architecture",
    description: "Refactor legacy code patterns to modern equivalents (e.g., UnityEvents → new Input System).",
    icon: "refresh-cw",
    supported: ["Unity", "Godot"],
  },
];

// ─── Continuous Build ─────────────────────────────────────────────────────

export interface BuildHistoryEntry {
  version: string;
  target: string;
  status: "success" | "warning" | "failed";
  timestamp: string;
  sizeMb: number;
  duration: string;
  changes: string[];
}

export const BUILD_HISTORY: BuildHistoryEntry[] = [
  {
    version: "v0.8.2", target: "Godot 4.x", status: "success",
    timestamp: "Today, 09:14", sizeMb: 184, duration: "31s",
    changes: ["Added 3 new enemy sprites", "Fixed boss phase 2 transition", "Updated world region configs"],
  },
  {
    version: "v0.8.1", target: "Unity", status: "warning",
    timestamp: "Today, 06:30", sizeMb: 312, duration: "47s",
    changes: ["Audio bank memory near limit", "Merged combat system refactor"],
  },
  {
    version: "v0.8.0", target: "Godot 4.x", status: "success",
    timestamp: "Yesterday, 22:00", sizeMb: 179, duration: "29s",
    changes: ["Initial v0.8 baseline", "Living Asset System integrated"],
  },
  {
    version: "v0.7.9", target: "Unity", status: "failed",
    timestamp: "Yesterday, 18:45", sizeMb: 0, duration: "12s",
    changes: ["Missing tileset reference — build aborted"],
  },
];
