export type GenerationMode = "guided" | "assisted" | "autonomous";

export const GENERATION_MODES = [
  {
    id: "guided" as const,
    label: "Guided Mode",
    description: "AI asks questions at each major decision. Best for beginners.",
    icon: "message-circle",
    accent: false,
  },
  {
    id: "assisted" as const,
    label: "Assisted Mode",
    description: "AI recommends while you retain full control. Balanced workflow.",
    icon: "sliders",
    accent: false,
  },
  {
    id: "autonomous" as const,
    label: "Autonomous Mode",
    description: "AI completes the full project and presents results for review.",
    icon: "zap",
    accent: true,
  },
];

export interface GameParams {
  prompt: string;
  genre: string;
  artStyle: string;
  perspective: "2D" | "3D";
  platform: string[];
  difficulty: "easy" | "normal" | "hard" | "brutal";
  gameLength: "short" | "medium" | "long" | "epic";
  worldSize: "tiny" | "small" | "medium" | "large" | "open-world";
  numBosses: number;
  multiplayerMode: "none" | "local-co-op" | "online" | "both";
  narrativeFocus: "low" | "medium" | "high";
  replayability: "low" | "medium" | "high";
  accessibility: boolean;
  exportTarget: string;
  mode: GenerationMode;
}

export const DEFAULT_PARAMS: Omit<GameParams, "prompt" | "genre" | "artStyle"> = {
  perspective: "2D",
  platform: ["PC", "Web"],
  difficulty: "normal",
  gameLength: "medium",
  worldSize: "medium",
  numBosses: 3,
  multiplayerMode: "none",
  narrativeFocus: "medium",
  replayability: "medium",
  accessibility: true,
  exportTarget: "Godot 4.x",
  mode: "autonomous",
};

export type QualityGateId =
  | "narrative"
  | "balance"
  | "assets"
  | "ui"
  | "performance"
  | "accessibility"
  | "export"
  | "validation";

export interface QualityGate {
  id: QualityGateId;
  label: string;
  description: string;
  icon: string;
  checks: string[];
}

export const QUALITY_GATES: QualityGate[] = [
  {
    id: "narrative",
    label: "Narrative Coherence",
    description: "Story arcs, character motivations, and lore are internally consistent.",
    icon: "book-open",
    checks: ["Story arc completeness", "Character relationship map", "World lore consistency", "Dialogue tone alignment"],
  },
  {
    id: "balance",
    label: "Gameplay Balance",
    description: "Combat, progression, economy, and difficulty curve are validated.",
    icon: "activity",
    checks: ["Difficulty curve analysis", "Enemy power scaling", "Reward frequency", "Skill tree balance"],
  },
  {
    id: "assets",
    label: "Asset Completeness",
    description: "All required sprites, audio, UI elements, and animations are present.",
    icon: "image",
    checks: ["Sprite coverage", "Audio bank completeness", "Animation states", "UI element library"],
  },
  {
    id: "ui",
    label: "UI Consistency",
    description: "Visual language, typography, and interaction patterns are cohesive.",
    icon: "layout",
    checks: ["Color palette consistency", "Typography hierarchy", "Icon set consistency", "Interaction feedback"],
  },
  {
    id: "performance",
    label: "Performance Targets",
    description: "Project meets frame-rate and memory targets for selected platforms.",
    icon: "zap",
    checks: ["Draw call budget", "Memory footprint", "Asset compression", "Load time estimate"],
  },
  {
    id: "accessibility",
    label: "Accessibility",
    description: "WCAG-inspired compliance for color, input, and difficulty options.",
    icon: "eye",
    checks: ["Color contrast ratio", "Input remapping", "Text size options", "Colorblind modes"],
  },
  {
    id: "export",
    label: "Export Readiness",
    description: "Project files are structured correctly for the target engine.",
    icon: "upload",
    checks: ["File structure", "Asset naming conventions", "Dependency resolution", "Bundle integrity"],
  },
  {
    id: "validation",
    label: "Error-Free Validation",
    description: "No critical errors, broken references, or missing dependencies.",
    icon: "check-circle",
    checks: ["Reference integrity", "Missing asset scan", "Script syntax", "Config validation"],
  },
];

export interface PromptAnalysis {
  genre: string[];
  themes: string[];
  tone: string;
  setting: string;
  coreLoop: string;
  progression: string;
  artDirection: string;
  audioDirection: string;
  narrativeGoals: string;
  technicalConstraints: string[];
  risks: string[];
  confidence: number;
}

export interface BlueprintPillar {
  label: string;
  description: string;
}

export interface ProjectBlueprint {
  visionStatement: string;
  designPillars: BlueprintPillar[];
  architectureSummary: string;
  worldOutline: string;
  storyOutline: string;
  gameplySystems: string[];
  assetRequirements: { category: string; count: number }[];
  milestones: string[];
  estimatedGenerationSeconds: number;
  taskCount: number;
}

export type TaskStatus = "pending" | "queued" | "running" | "waiting" | "completed" | "failed";

export interface PipelineTask {
  id: string;
  label: string;
  agentName: string;
  phase: number;
  dependsOn: string[];
  priority: number;
  durationMs: number;
  status: TaskStatus;
  progress: number;
  output?: string;
}

export function generateAnalysis(params: GameParams): PromptAnalysis {
  const prompt = params.prompt.toLowerCase();
  const isDark = prompt.includes("dark") || prompt.includes("horror") || prompt.includes("survival");
  const isCombat = prompt.includes("combat") || prompt.includes("battle") || prompt.includes("fight") || params.genre === "Action";
  const isOpenWorld = prompt.includes("open world") || prompt.includes("exploration") || params.worldSize === "open-world";

  // Deterministic confidence derived from how richly the user specified the brief.
  const richness = Math.min(
    1,
    (Math.min(prompt.length, 240) / 240) * 0.5 +
      (params.genre ? 0.15 : 0) +
      (params.artStyle ? 0.1 : 0) +
      (params.platform.length > 0 ? 0.1 : 0) +
      (params.narrativeFocus === "high" ? 0.15 : params.narrativeFocus === "medium" ? 0.08 : 0.03),
  );

  return {
    genre: [params.genre, isCombat ? "Action" : "Exploration"].filter((v, i, a) => a.indexOf(v) === i),
    themes: [
      isDark ? "Dark Fantasy" : "High Fantasy",
      isCombat ? "Heroic Combat" : "Discovery",
      "Progression",
    ],
    tone: isDark ? "Dark, atmospheric, tense" : "Adventurous, vibrant, uplifting",
    setting: isOpenWorld ? "Vast interconnected open world" : `Structured ${params.worldSize} world with distinct zones`,
    coreLoop: `Explore → ${isCombat ? "Combat → " : ""}Collect → Progress → Unlock`,
    progression: params.gameLength === "epic" ? "Deep RPG progression with branching systems" : "Linear progression with optional side content",
    artDirection: `${params.artStyle} with ${isDark ? "dark moody palette" : "vibrant color range"}`,
    audioDirection: isDark ? "Orchestral dark ambience with dynamic combat music" : "Upbeat dynamic score with ambient world layers",
    narrativeGoals: params.narrativeFocus === "high" ? "Rich story-driven experience with branching dialogue" : "Light narrative framing with emergent storytelling",
    technicalConstraints: [`Export to ${params.exportTarget}`, `Target ${params.platform.join(", ")}`, `${params.perspective} perspective`],
    risks: [
      "Scope creep in world-building phase",
      "Asset generation time for complex boss designs",
      isCombat ? "Combat balance requires additional iteration passes" : "Pacing needs tuning for exploration flow",
    ],
    confidence: Math.round((0.6 + richness * 0.35) * 100) / 100,
  };
}

export function generateBlueprint(analysis: PromptAnalysis, params: GameParams): ProjectBlueprint {
  const boss = params.numBosses;
  return {
    visionStatement: `A ${analysis.tone.split(",")[0].toLowerCase()} ${params.genre} experience in ${params.artStyle} style, built for ${params.platform.join(" and ")}, featuring ${analysis.coreLoop.toLowerCase()} as its core loop.`,
    designPillars: [
      { label: "Clarity", description: "Every mechanic is introduced before it is tested." },
      { label: "Depth", description: "Systems reward mastery without punishing newcomers." },
      { label: "Coherence", description: "World, story, mechanics, and audio reinforce each other." },
      { label: "Accessibility", description: "Multiple difficulty and display options for all players." },
    ],
    architectureSummary: `${params.perspective} ${params.genre} with ${params.worldSize} world, ${boss} boss encounters, and ${params.exportTarget} export pipeline.`,
    worldOutline: `${params.worldSize === "open-world" ? "5 major regions" : "3 interconnected zones"} with distinct biomes, environmental storytelling, and hidden secrets.`,
    storyOutline: `${analysis.narrativeGoals}. Estimated ${params.gameLength === "epic" ? "20-40" : params.gameLength === "long" ? "10-20" : "4-10"} hours of content.`,
    gameplySystems: [
      "Core movement & physics",
      "Combat & ability system",
      `Progression & ${params.narrativeFocus === "high" ? "dialogue" : "leveling"} system`,
      "Inventory & item management",
      "Save & checkpoint system",
      params.multiplayerMode !== "none" ? "Multiplayer & networking" : "AI companion system",
    ],
    assetRequirements: [
      { category: "Character sprites", count: 12 + boss * 3 },
      { category: "Enemy sprites", count: 24 + boss * 2 },
      { category: "Environment tiles", count: 180 },
      { category: "UI elements", count: 64 },
      { category: "Audio tracks", count: 18 },
      { category: "Sound effects", count: 120 },
    ],
    milestones: [
      "Phase 1: Core systems & foundation",
      "Phase 2: World generation complete",
      "Phase 3: Full content pass",
      "Phase 4: Balance & QA pass",
      "Phase 5: Asset finalization",
      "Phase 6: Export & delivery",
    ],
    estimatedGenerationSeconds: 12 + boss * 2 + (params.worldSize === "open-world" ? 8 : 0),
    taskCount: 48 + boss * 4 + (params.narrativeFocus === "high" ? 18 : 8),
  };
}

export function generateTaskGraph(blueprint: ProjectBlueprint, params: GameParams): PipelineTask[] {
  const tasks: PipelineTask[] = [
    // Phase 1 — Foundation
    { id: "t01", label: "Parse prompt & extract parameters", agentName: "Master Game Director", phase: 1, dependsOn: [], priority: 10, durationMs: 800, status: "pending", progress: 0 },
    { id: "t02", label: "Generate vision statement", agentName: "Master Game Director", phase: 1, dependsOn: ["t01"], priority: 9, durationMs: 600, status: "pending", progress: 0 },
    { id: "t03", label: "Define design pillars", agentName: "Master Game Director", phase: 1, dependsOn: ["t02"], priority: 9, durationMs: 500, status: "pending", progress: 0 },
    { id: "t04", label: "Create world outline", agentName: "World Architect", phase: 1, dependsOn: ["t03"], priority: 8, durationMs: 1200, status: "pending", progress: 0 },
    { id: "t05", label: "Define core gameplay loop", agentName: "Gameplay Engineer", phase: 1, dependsOn: ["t03"], priority: 8, durationMs: 900, status: "pending", progress: 0 },
    // Phase 2 — World & Story
    { id: "t06", label: "Generate world map layout", agentName: "World Architect", phase: 2, dependsOn: ["t04"], priority: 8, durationMs: 1400, status: "pending", progress: 0 },
    { id: "t07", label: "Define biomes & regions", agentName: "World Architect", phase: 2, dependsOn: ["t06"], priority: 7, durationMs: 1000, status: "pending", progress: 0 },
    { id: "t08", label: "Write story outline", agentName: "Story Architect", phase: 2, dependsOn: ["t04"], priority: 8, durationMs: 1100, status: "pending", progress: 0 },
    { id: "t09", label: "Create protagonist backstory", agentName: "Character Designer", phase: 2, dependsOn: ["t08"], priority: 7, durationMs: 800, status: "pending", progress: 0 },
    { id: "t10", label: "Write world lore & history", agentName: "Lore Builder", phase: 2, dependsOn: ["t08"], priority: 6, durationMs: 1200, status: "pending", progress: 0 },
    { id: "t11", label: "Design magic / ability system", agentName: "Gameplay Engineer", phase: 2, dependsOn: ["t05"], priority: 8, durationMs: 1000, status: "pending", progress: 0 },
    { id: "t12", label: "Outline progression & leveling", agentName: "Balance Agent", phase: 2, dependsOn: ["t05"], priority: 7, durationMs: 900, status: "pending", progress: 0 },
    // Phase 3 — Content
    { id: "t13", label: "Generate enemy families", agentName: "Enemy Designer", phase: 3, dependsOn: ["t07", "t11"], priority: 7, durationMs: 1300, status: "pending", progress: 0 },
    { id: "t14", label: "Design boss encounters", agentName: "Boss Designer", phase: 3, dependsOn: ["t13"], priority: 9, durationMs: 1600, status: "pending", progress: 0 },
    { id: "t15", label: "Write NPC dialogue trees", agentName: "Dialogue Writer", phase: 3, dependsOn: ["t09", "t10"], priority: 6, durationMs: 1500, status: "pending", progress: 0 },
    { id: "t16", label: "Design level layouts", agentName: "Level Designer", phase: 3, dependsOn: ["t07"], priority: 7, durationMs: 1400, status: "pending", progress: 0 },
    { id: "t17", label: "Generate quest structure", agentName: "Quest Designer", phase: 3, dependsOn: ["t08", "t12"], priority: 6, durationMs: 1100, status: "pending", progress: 0 },
    { id: "t18", label: "Balance combat parameters", agentName: "Balance Agent", phase: 3, dependsOn: ["t13", "t14"], priority: 8, durationMs: 1000, status: "pending", progress: 0 },
    { id: "t19", label: "Design item & loot tables", agentName: "Item Designer", phase: 3, dependsOn: ["t12"], priority: 6, durationMs: 900, status: "pending", progress: 0 },
    { id: "t20", label: "Create skill tree layout", agentName: "Gameplay Engineer", phase: 3, dependsOn: ["t11", "t12"], priority: 7, durationMs: 800, status: "pending", progress: 0 },
    // Phase 4 — Assets
    { id: "t21", label: "Generate protagonist sprites", agentName: "Pixel Art Designer", phase: 4, dependsOn: ["t09"], priority: 8, durationMs: 1800, status: "pending", progress: 0 },
    { id: "t22", label: "Generate enemy sprite sheets", agentName: "Pixel Art Designer", phase: 4, dependsOn: ["t13"], priority: 7, durationMs: 2000, status: "pending", progress: 0 },
    { id: "t23", label: "Generate boss sprites & animations", agentName: "Animation Designer", phase: 4, dependsOn: ["t14"], priority: 9, durationMs: 2400, status: "pending", progress: 0 },
    { id: "t24", label: "Design environment tile sets", agentName: "Pixel Art Designer", phase: 4, dependsOn: ["t07"], priority: 7, durationMs: 1900, status: "pending", progress: 0 },
    { id: "t25", label: "Compose main theme & OST", agentName: "Audio Composer", phase: 4, dependsOn: ["t08"], priority: 7, durationMs: 2200, status: "pending", progress: 0 },
    { id: "t26", label: "Generate sound effects library", agentName: "SFX Designer", phase: 4, dependsOn: ["t11"], priority: 6, durationMs: 1600, status: "pending", progress: 0 },
    { id: "t27", label: "Design HUD & UI elements", agentName: "UI Designer", phase: 4, dependsOn: ["t12"], priority: 7, durationMs: 1400, status: "pending", progress: 0 },
    { id: "t28", label: "Create cutscene storyboards", agentName: "Narrative Director", phase: 4, dependsOn: ["t15"], priority: 5, durationMs: 1200, status: "pending", progress: 0 },
    // Phase 5 — QA & Balance
    { id: "t29", label: "Validate narrative coherence", agentName: "QA Validator", phase: 5, dependsOn: ["t15", "t17"], priority: 8, durationMs: 900, status: "pending", progress: 0 },
    { id: "t30", label: "Run gameplay balance simulation", agentName: "Balance Agent", phase: 5, dependsOn: ["t18", "t19", "t20"], priority: 9, durationMs: 1200, status: "pending", progress: 0 },
    { id: "t31", label: "Verify asset completeness", agentName: "QA Validator", phase: 5, dependsOn: ["t21", "t22", "t23", "t24"], priority: 8, durationMs: 800, status: "pending", progress: 0 },
    { id: "t32", label: "Audit UI consistency", agentName: "UI Designer", phase: 5, dependsOn: ["t27"], priority: 7, durationMs: 700, status: "pending", progress: 0 },
    { id: "t33", label: "Check accessibility compliance", agentName: "QA Validator", phase: 5, dependsOn: ["t27"], priority: 7, durationMs: 600, status: "pending", progress: 0 },
    { id: "t34", label: "Performance profiling pass", agentName: "Performance Optimizer", phase: 5, dependsOn: ["t31"], priority: 8, durationMs: 1000, status: "pending", progress: 0 },
    { id: "t35", label: "Final holistic review", agentName: "Master Game Director", phase: 5, dependsOn: ["t29", "t30", "t31", "t32", "t33", "t34"], priority: 10, durationMs: 1100, status: "pending", progress: 0 },
    // Phase 6 — Export
    { id: "t36", label: "Generate project documentation", agentName: "Export Engineer", phase: 6, dependsOn: ["t35"], priority: 7, durationMs: 700, status: "pending", progress: 0 },
    { id: "t37", label: "Resolve asset dependencies", agentName: "Export Engineer", phase: 6, dependsOn: ["t35"], priority: 8, durationMs: 800, status: "pending", progress: 0 },
    { id: "t38", label: "Package export bundle", agentName: "Export Engineer", phase: 6, dependsOn: ["t36", "t37"], priority: 9, durationMs: 1200, status: "pending", progress: 0 },
    { id: "t39", label: "Run final integrity check", agentName: "QA Validator", phase: 6, dependsOn: ["t38"], priority: 9, durationMs: 600, status: "pending", progress: 0 },
    { id: "t40", label: "Create export-ready bundle", agentName: "Export Engineer", phase: 6, dependsOn: ["t39"], priority: 10, durationMs: 900, status: "pending", progress: 0 },
  ];
  return tasks;
}
