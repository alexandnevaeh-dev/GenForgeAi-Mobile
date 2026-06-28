import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AgentNetwork, AgentState } from "@/components/AgentNetwork";
import { BlueprintPanel } from "@/components/BlueprintPanel";
import { GenLogicPanel } from "@/components/GenLogicPanel";
import { QualityGates } from "@/components/QualityGates";
import { TaskGraph } from "@/components/TaskGraph";
import {
  DEFAULT_PARAMS,
  GENERATION_MODES,
  type GameParams,
  type GenerationMode,
  type PipelineTask,
  type PromptAnalysis,
  type ProjectBlueprint,
  generateAnalysis,
  generateBlueprint,
  generateTaskGraph,
} from "@/constants/generation-pipeline";
import { AGENT_DEFS } from "@/constants/agents";
import {
  DEFAULT_STEPS,
  type GameProject,
  makeInitialAgentStates,
  makeSeededAgentStates,
  useProjects,
} from "@/context/ProjectsContext";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

type Genre = GameProject["genre"];
type ArtStyle = GameProject["artStyle"];

const GENRES: Genre[] = [
  "RPG", "Action", "Platformer", "Strategy", "Puzzle",
  "Horror", "Adventure", "Simulation", "Fighting", "Shooter",
];
const ART_STYLES: ArtStyle[] = [
  "Pixel Art", "Low Poly", "Realistic", "Cartoon",
  "Isometric", "Voxel", "Anime",
];
const PLATFORMS = ["PC", "Web", "Android", "iOS", "Steam", "Console"];
const EXPORT_TARGETS = ["Godot 4.x", "Unity", "HTML5", "Unreal Engine", "GameMaker"];
const EXAMPLE_PROMPTS = [
  "A dark fantasy metroidvania with procedurally generated castles and deep lore",
  "A cyberpunk endless runner with bullet-time and neon aesthetics",
  "A cozy pixel farm-sim where crops gain magical powers at night",
  "A survival horror roguelike with psychological tension mechanics",
];

const TOTAL_STEPS = 6;
const PHASE_LABELS = ["", "Foundation", "World & Story", "Content", "Assets", "QA & Balance", "Export"];

function StepIndicator({ step, total }: { step: number; total: number }) {
  const colors = useColors();
  return (
    <View style={styles.stepRow}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.stepDot,
            {
              backgroundColor: i <= step - 1 ? colors.primary : colors.border,
              width: i === step - 1 ? 28 : 8,
            },
          ]}
        />
      ))}
    </View>
  );
}

function ChipGroup<T extends string>({
  options,
  selected,
  onSelect,
  multi,
  accent,
}: {
  options: T[];
  selected: T | T[] | null;
  onSelect: (v: T) => void;
  multi?: boolean;
  accent?: string;
}) {
  const colors = useColors();
  const isSelected = (v: T) =>
    multi
      ? Array.isArray(selected) && selected.includes(v)
      : selected === v;

  return (
    <View style={styles.chipGrid}>
      {options.map((opt) => (
        <Pressable
          key={opt}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            onSelect(opt);
          }}
          style={[
            styles.chip,
            {
              backgroundColor: isSelected(opt) ? (accent ?? colors.primary) : colors.card,
              borderColor: isSelected(opt) ? (accent ?? colors.primary) : colors.border,
            },
          ]}
        >
          <Text style={[styles.chipText, { color: isSelected(opt) ? "#fff" : colors.foreground }]}>
            {opt}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export default function NewGameScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addProject, updateProject } = useProjects();
  const { accessToken, user } = useAuth();
  const isGuest = !accessToken || user?.id === "guest";

  // Wizard state — seeded from user's saved generation preferences
  const [step, setStep] = useState(1);
  const [mode, setMode] = useState<GenerationMode>("autonomous");
  const [prompt, setPrompt] = useState("");
  const [genre, setGenre] = useState<Genre | null>(
    (GENRES.includes(user?.preferences?.defaultGenre as Genre) ? user?.preferences?.defaultGenre as Genre : null)
  );
  const [artStyle, setArtStyle] = useState<ArtStyle | null>(
    (ART_STYLES.includes(user?.preferences?.defaultArtStyle as ArtStyle) ? user?.preferences?.defaultArtStyle as ArtStyle : null)
  );

  // Advanced params
  const [platforms, setPlatforms] = useState<string[]>(["PC", "Web"]);
  const [difficulty, setDifficulty] = useState<GameParams["difficulty"]>("normal");
  const [gameLength, setGameLength] = useState<GameParams["gameLength"]>("medium");
  const [worldSize, setWorldSize] = useState<GameParams["worldSize"]>("medium");
  const [exportTarget, setExportTarget] = useState("Godot 4.x");
  const [numBosses, setNumBosses] = useState(3);
  const [narrativeFocus, setNarrativeFocus] = useState<GameParams["narrativeFocus"]>("medium");
  const [replayability, setReplayability] = useState<GameParams["replayability"]>("medium");

  // Pipeline state
  const [analysisResult, setAnalysisResult] = useState<PromptAnalysis | null>(null);
  const [blueprint, setBlueprint] = useState<ProjectBlueprint | null>(null);
  const [tasks, setTasks] = useState<PipelineTask[]>([]);
  const [agentStates, setAgentStates] = useState<AgentState[]>(makeInitialAgentStates());
  const [currentPhase, setCurrentPhase] = useState(0);
  const currentPhaseRef = useRef(0);
  const [generating, setGenerating] = useState(false);
  const [generationComplete, setGenerationComplete] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [genError, setGenError] = useState<{ phase: number; message: string } | null>(null);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const analysisIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const genViewTab = useRef<"agents" | "tasks" | "gates">("agents");
  const [genTab, setGenTab] = useState<"agents" | "tasks" | "gates">("agents");

  const topPad = Platform.OS === "web" ? 67 : insets.top + 16;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 16;

  const buildParams = (): GameParams => ({
    prompt,
    genre: genre ?? "RPG",
    artStyle: artStyle ?? "Pixel Art",
    platform: platforms,
    difficulty,
    gameLength,
    worldSize,
    exportTarget,
    numBosses,
    narrativeFocus,
    replayability,
    mode,
    perspective: "2D",
    multiplayerMode: "none",
    accessibility: true,
  });

  const canNext =
    step === 1 ? true :
    step === 2 ? prompt.trim().length > 0 :
    step === 3 ? genre !== null :
    step === 4 ? artStyle !== null :
    step === 5 ? !!analysisResult :
    step === 6 ? !!blueprint : true;

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step === 5) {
      // Auto-generate blueprint on transition
      const params = buildParams();
      const bp = generateBlueprint(analysisResult!, params);
      setBlueprint(bp);
      const tg = generateTaskGraph(bp, params);
      setTasks(tg);
    }
    if (step < TOTAL_STEPS) {
      setStep((s) => s + 1);
    } else {
      startGeneration();
    }
  };

  const handleBack = () => {
    if (step === 1) router.back();
    else setStep((s) => s - 1);
  };

  // Step 5: run prompt analysis animation
  useEffect(() => {
    if (step === 5 && !analysisResult) {
      setAnalysisProgress(0);
      const params = buildParams();
      let progress = 0;
      analysisIntervalRef.current = setInterval(() => {
        progress += 6 + Math.random() * 8;
        if (progress >= 100) {
          progress = 100;
          clearInterval(analysisIntervalRef.current!);
          setAnalysisResult(generateAnalysis(params));
        }
        setAnalysisProgress(Math.min(100, progress));
      }, 120);
    }
    return () => { if (analysisIntervalRef.current) clearInterval(analysisIntervalRef.current); };
  }, [step]);

  const runGuestSimulation = (id: string, allTasks: PipelineTask[], params: GameParams) => {
    const phases = [1, 2, 3, 4, 5, 6];
    let elapsed = 0;
    const totalAgents = AGENT_DEFS.length;
    let doneCount = 0;

    phases.forEach((phase, phaseIdx) => {
      const phaseAgents = AGENT_DEFS.filter((a) => a.phase === phase);

      setTimeout(() => {
        setCurrentPhase(phase);
        setAgentStates((prev) =>
          prev.map((s) => phaseAgents.some((a) => a.id === s.agentId) ? { ...s, status: "active" } : s)
        );
        setTasks((prev) =>
          prev.map((t) => t.phase === phase ? { ...t, status: "running", progress: 0 } : t)
        );
      }, elapsed + 400);

      setTimeout(() => {
        setTasks((prev) =>
          prev.map((t) => t.phase === phase ? { ...t, progress: 60 } : t)
        );
      }, elapsed + 1000);

      elapsed += 1800;

      setTimeout(() => {
        doneCount += phaseAgents.length;
        const progress = Math.round((doneCount / totalAgents) * 100);
        setAgentStates((prev) =>
          prev.map((s) => phaseAgents.some((a) => a.id === s.agentId) ? { ...s, status: "done" } : s)
        );
        setTasks((prev) =>
          prev.map((t) => t.phase === phase ? { ...t, status: "completed", progress: 100, output: "✓ Complete" } : t)
        );
        updateProject(id, {
          progress,
          status: phaseIdx < phases.length - 1 ? "generating" : "in_progress",
          steps: DEFAULT_STEPS.map((s, i) => ({
            ...s,
            status:
              i < Math.floor((progress / 100) * DEFAULT_STEPS.length) ? "done"
              : i === Math.floor((progress / 100) * DEFAULT_STEPS.length) ? "active"
              : "pending",
          })),
        });
        if (phaseIdx === phases.length - 1) setGenerationComplete(true);
      }, elapsed);

      elapsed += 400;
    });
  };

  const startGeneration = async () => {
    setGenerating(true);
    const params = buildParams();
    const words = prompt.trim().split(" ").slice(0, 4)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

    const initialAgents = makeInitialAgentStates();
    const newProject: GameProject = {
      id: `local-${Date.now()}`,
      title: words || "Untitled Game",
      description: prompt,
      genre: genre!,
      artStyle: artStyle!,
      prompt,
      status: "generating",
      progress: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      steps: DEFAULT_STEPS.map((s) => ({ ...s })),
      agentStates: initialAgents,
      tags: [genre!, artStyle!, ...platforms.slice(0, 2)],
    };

    let created: GameProject;
    if (createdId) {
      // Retry of an already-created project — don't create a duplicate.
      created = { ...newProject, id: createdId };
    } else {
      try {
        created = await addProject(newProject);
      } catch {
        setGenerating(false);
        return;
      }
      setCreatedId(created.id);
    }

    setGenError(null);
    setGenerationComplete(false);
    setCurrentPhase(0);
    currentPhaseRef.current = 0;
    setAgentStates(initialAgents);

    const allTasks = tasks.length > 0 ? [...tasks] : generateTaskGraph(blueprint!, params);

    // Guest users: use local simulation
    if (isGuest) {
      runGuestSimulation(created.id, allTasks, params);
      return;
    }

    // Authenticated users: real AI generation via SSE
    try {
      const response = await fetch(`/api/projects/${created.id}/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          prompt,
          genre: genre ?? "RPG",
          artStyle: artStyle ?? "Pixel Art",
          difficulty,
          gameLength,
          worldSize,
          numBosses,
          mode,
        }),
      });

      if (!response.ok || !response.body) {
        const detail = !response.ok ? `the server responded ${response.status}` : "no response stream was returned";
        setGenError({ phase: currentPhaseRef.current, message: `Generation could not start — ${detail}.` });
        return;
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      const totalAgents = AGENT_DEFS.length;
      let doneCount = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((l) => l.startsWith("data:"));

        for (const line of lines) {
          try {
            const data = JSON.parse(line.slice(5).trim()) as {
              event?: string;
              phase?: number;
              label?: string;
              progress?: number;
              message?: string;
            };

            if (data.event === "phase_start" && data.phase !== undefined) {
              const phase = data.phase;
              const phaseAgents = AGENT_DEFS.filter((a) => a.phase === phase);
              currentPhaseRef.current = phase;
              setCurrentPhase(phase);
              setAgentStates((prev) =>
                prev.map((s) =>
                  phaseAgents.some((a) => a.id === s.agentId)
                    ? { ...s, status: "active" }
                    : s
                )
              );
              setTasks((prev) =>
                prev.map((t) =>
                  t.phase === phase ? { ...t, status: "running", progress: 0 } : t
                )
              );
            }

            if (data.event === "phase_complete" && data.phase !== undefined) {
              const phase = data.phase;
              const phaseAgents = AGENT_DEFS.filter((a) => a.phase === phase);
              const progress = data.progress ?? Math.round((phase / 6) * 100);
              doneCount += phaseAgents.length;

              setAgentStates((prev) =>
                prev.map((s) =>
                  phaseAgents.some((a) => a.id === s.agentId)
                    ? { ...s, status: "done" }
                    : s
                )
              );
              setTasks((prev) =>
                prev.map((t) =>
                  t.phase === phase
                    ? { ...t, status: "completed", progress: 100, output: "✓ Complete" }
                    : t
                )
              );

              // Mid-phase task progress animation
              setTimeout(() => {
                setTasks((prev) =>
                  prev.map((t) =>
                    t.phase === phase && t.status === "running"
                      ? { ...t, progress: 60 }
                      : t
                  )
                );
              }, 300);

              updateProject(created.id, {
                progress,
                status: phase < 6 ? "generating" : "in_progress",
                agentStates: makeSeededAgentStates(progress),
                steps: DEFAULT_STEPS.map((s, i) => ({
                  ...s,
                  status:
                    i < Math.floor((progress / 100) * DEFAULT_STEPS.length) ? "done"
                    : i === Math.floor((progress / 100) * DEFAULT_STEPS.length) ? "active"
                    : "pending",
                })),
              });
            }

            if (data.event === "done") {
              setGenerationComplete(true);
              updateProject(created.id, { status: "in_progress", progress: 100 });
            }

            if (data.event === "error") {
              setGenError({
                phase: data.phase ?? currentPhaseRef.current,
                message: data.message ?? "The AI generation pipeline reported an error.",
              });
              break;
            }
          } catch {
            // skip malformed SSE lines
          }
        }
      }
    } catch (err) {
      setGenError({
        phase: currentPhaseRef.current,
        message: err instanceof Error ? err.message : "A network error interrupted generation.",
      });
    }
  };

  // ─── Generation View ──────────────────────────────────────────────────
  if (generating) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.genHeader, { paddingTop: topPad, borderBottomColor: colors.border }]}>
          <View style={[styles.genAvatar, { backgroundColor: generationComplete ? colors.success : colors.primary }]}>
            <Feather name={generationComplete ? "check" : "cpu"} size={20} color="#fff" />
          </View>
          <View style={styles.genTitleBlock}>
            <Text style={[styles.genTitle, { color: colors.foreground }]}>
              {generationComplete ? "Game Ready!" : "Generating Your Game"}
            </Text>
            <Text style={[styles.genPhase, { color: generationComplete ? colors.success : colors.primary }]}>
              {generationComplete
                ? "All 40 tasks complete · Ready to export"
                : currentPhase > 0
                  ? `Phase ${currentPhase} — ${PHASE_LABELS[currentPhase] ?? ""}`
                  : "Initializing pipeline..."}
            </Text>
          </View>
        </View>

        {genError && (
          <View style={{ marginHorizontal: 20, marginTop: 12, padding: 14, borderRadius: 12, borderWidth: 1, gap: 10, backgroundColor: colors.destructive + "18", borderColor: colors.destructive }}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Feather name="alert-triangle" size={16} color={colors.destructive} />
              <Text style={{ flex: 1, fontSize: 14, fontFamily: "Inter_700Bold", color: colors.destructive }}>
                Generation failed{genError.phase > 0 ? ` at phase ${genError.phase}` : ""}
              </Text>
            </View>
            <Text style={{ fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18, color: colors.foreground }}>
              {genError.message}
            </Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <Pressable
                onPress={() => startGeneration()}
                style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 11, borderRadius: 10, backgroundColor: colors.primary }}
              >
                <Feather name="refresh-cw" size={14} color="#fff" />
                <Text style={{ fontSize: 13, fontFamily: "Inter_600SemiBold", color: "#fff" }}>Retry</Text>
              </Pressable>
              <Pressable
                onPress={() => { if (createdId) router.replace(`/project/${createdId}`); else router.back(); }}
                style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 11, borderRadius: 10, borderWidth: 1, borderColor: colors.border }}
              >
                <Feather name="file-text" size={14} color={colors.foreground} />
                <Text style={{ fontSize: 13, fontFamily: "Inter_600SemiBold", color: colors.foreground }}>Continue as draft</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Generation sub-tabs */}
        <View style={[styles.genTabBar, { backgroundColor: colors.muted }]}>
          {([
            { id: "agents", label: "Agents", icon: "cpu" },
            { id: "tasks", label: "Tasks", icon: "list" },
            { id: "gates", label: "Quality", icon: "shield" },
          ] as const).map((tab) => (
            <Pressable
              key={tab.id}
              onPress={() => setGenTab(tab.id)}
              style={[styles.genTab, genTab === tab.id && [styles.genTabActive, { backgroundColor: colors.card }]]}
            >
              <Feather name={tab.icon} size={13} color={genTab === tab.id ? colors.primary : colors.mutedForeground} />
              <Text style={[styles.genTabLabel, { color: genTab === tab.id ? colors.primary : colors.mutedForeground }]}>
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 16, paddingBottom: bottomPad + 80, gap: 16 }}
          showsVerticalScrollIndicator={false}
        >
          {genTab === "agents" && (
            <>
              <GenLogicPanel genre={genre!} artStyle={artStyle!} prompt={prompt} />
              <AgentNetwork agentStates={agentStates} />
            </>
          )}
          {genTab === "tasks" && <TaskGraph tasks={tasks} currentPhase={currentPhase} />}
          {genTab === "gates" && <QualityGates projectId={createdId ?? undefined} />}
        </ScrollView>

        {/* Footer */}
        <View style={[styles.genFooter, { paddingBottom: bottomPad + 8, borderTopColor: colors.border, backgroundColor: colors.background }]}>
          <Pressable
            onPress={() => { if (createdId) router.replace(`/project/${createdId}`); else router.back(); }}
            style={[styles.viewBtn, { backgroundColor: generationComplete ? colors.success : colors.primary }]}
          >
            <Text style={styles.viewBtnText}>
              {generationComplete ? "Open Finished Project" : "View Project in Progress"}
            </Text>
            <Feather name="arrow-right" size={16} color="#fff" />
          </Pressable>
        </View>
      </View>
    );
  }

  // ─── Wizard View ──────────────────────────────────────────────────────
  const STEP_LABELS = ["", "Mode", "Prompt", "Genre", "Style", "Analysis", "Blueprint"];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad, borderBottomColor: colors.border }]}>
        <Pressable onPress={handleBack}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <View style={styles.headerCenter}>
          <StepIndicator step={step} total={TOTAL_STEPS} />
          <Text style={[styles.stepLabel, { color: colors.mutedForeground }]}>
            {STEP_LABELS[step]} · {step}/{TOTAL_STEPS}
          </Text>
        </View>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 24, gap: 20 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Step 1: Mode Selection ── */}
        {step === 1 && (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>Choose your mode</Text>
            <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
              This controls how much the AI involves you during game creation.
            </Text>
            {GENERATION_MODES.map((m) => (
              <Pressable
                key={m.id}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setMode(m.id); }}
                style={[
                  styles.modeCard,
                  {
                    backgroundColor: colors.card,
                    borderColor: mode === m.id ? colors.primary : colors.border,
                    borderWidth: mode === m.id ? 2 : 1,
                  },
                ]}
              >
                <View style={[styles.modeIcon, { backgroundColor: mode === m.id ? colors.primary : colors.muted }]}>
                  <Feather name={m.icon as any} size={20} color={mode === m.id ? "#fff" : colors.mutedForeground} />
                </View>
                <View style={styles.modeInfo}>
                  <Text style={[styles.modeLabel, { color: colors.foreground }]}>{m.label}</Text>
                  <Text style={[styles.modeDesc, { color: colors.mutedForeground }]}>{m.description}</Text>
                </View>
                {mode === m.id && (
                  <View style={[styles.modeCheck, { backgroundColor: colors.primary }]}>
                    <Feather name="check" size={12} color="#fff" />
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        )}

        {/* ── Step 2: Prompt ── */}
        {step === 2 && (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>
              What game do you want to create?
            </Text>
            <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
              Describe your idea in natural language. The Master Game Director analyzes it and coordinates 23 AI agents.
            </Text>
            <TextInput
              style={[styles.promptInput, { backgroundColor: colors.card, borderColor: colors.primary, color: colors.foreground }]}
              placeholder="A dark fantasy RPG with procedurally generated dungeons..."
              placeholderTextColor={colors.mutedForeground}
              value={prompt}
              onChangeText={setPrompt}
              multiline
              autoFocus
              maxLength={500}
            />
            <Text style={[styles.charCount, { color: colors.mutedForeground }]}>{prompt.length}/500</Text>
            <Text style={[styles.exampleTitle, { color: colors.mutedForeground }]}>EXAMPLE PROMPTS</Text>
            {EXAMPLE_PROMPTS.map((ex) => (
              <Pressable
                key={ex}
                onPress={() => setPrompt(ex)}
                style={[styles.exampleChip, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <Text style={[styles.exampleText, { color: colors.foreground }]} numberOfLines={2}>{ex}</Text>
                <Feather name="arrow-up-right" size={14} color={colors.mutedForeground} />
              </Pressable>
            ))}
          </View>
        )}

        {/* ── Step 3: Genre ── */}
        {step === 3 && (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>Choose a genre</Text>
            <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
              GenLogic adapts all AI agents, combat systems, world generation, and asset styles to this genre.
            </Text>
            <ChipGroup options={GENRES} selected={genre} onSelect={(g) => setGenre(g as Genre)} />
          </View>
        )}

        {/* ── Step 4: Style + Advanced Params ── */}
        {step === 4 && (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>Art style & parameters</Text>
            <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
              These parameters guide every AI agent throughout generation.
            </Text>

            <Text style={[styles.paramLabel, { color: colors.mutedForeground }]}>ART STYLE</Text>
            <ChipGroup options={ART_STYLES} selected={artStyle} onSelect={(s) => setArtStyle(s as ArtStyle)} accent={colors.secondary} />

            <Text style={[styles.paramLabel, { color: colors.mutedForeground }]}>TARGET PLATFORMS</Text>
            <ChipGroup
              options={PLATFORMS}
              selected={platforms}
              onSelect={(p) => setPlatforms((prev) => prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p])}
              multi
            />

            <Text style={[styles.paramLabel, { color: colors.mutedForeground }]}>EXPORT TARGET</Text>
            <ChipGroup options={EXPORT_TARGETS} selected={exportTarget} onSelect={setExportTarget} />

            <Text style={[styles.paramLabel, { color: colors.mutedForeground }]}>DIFFICULTY</Text>
            <ChipGroup options={["easy", "normal", "hard", "brutal"]} selected={difficulty} onSelect={(d) => setDifficulty(d as any)} />

            <Text style={[styles.paramLabel, { color: colors.mutedForeground }]}>GAME LENGTH</Text>
            <ChipGroup options={["short", "medium", "long", "epic"]} selected={gameLength} onSelect={(l) => setGameLength(l as any)} />

            <Text style={[styles.paramLabel, { color: colors.mutedForeground }]}>WORLD SIZE</Text>
            <ChipGroup options={["tiny", "small", "medium", "large", "open-world"]} selected={worldSize} onSelect={(w) => setWorldSize(w as any)} />

            <Text style={[styles.paramLabel, { color: colors.mutedForeground }]}>NARRATIVE FOCUS</Text>
            <ChipGroup options={["low", "medium", "high"]} selected={narrativeFocus} onSelect={(n) => setNarrativeFocus(n as any)} />

            {/* Boss slider */}
            <View style={styles.bossRow}>
              <Text style={[styles.paramLabel, { color: colors.mutedForeground }]}>BOSS COUNT</Text>
              <View style={styles.bossCounter}>
                <Pressable onPress={() => setNumBosses((v) => Math.max(1, v - 1))} style={[styles.bossBtn, { backgroundColor: colors.muted }]}>
                  <Feather name="minus" size={14} color={colors.foreground} />
                </Pressable>
                <Text style={[styles.bossValue, { color: colors.foreground }]}>{numBosses}</Text>
                <Pressable onPress={() => setNumBosses((v) => Math.min(10, v + 1))} style={[styles.bossBtn, { backgroundColor: colors.muted }]}>
                  <Feather name="plus" size={14} color={colors.foreground} />
                </Pressable>
              </View>
            </View>
          </View>
        )}

        {/* ── Step 5: Prompt Analysis ── */}
        {step === 5 && (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>Prompt Analysis</Text>
            <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
              The GenLogic Engine extracts and classifies your game concept before planning begins.
            </Text>

            {/* Analysis progress */}
            {!analysisResult ? (
              <View style={[styles.analysisLoading, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.analysisBg, { backgroundColor: colors.muted }]}>
                  <Animated.View style={[styles.analysisFill, { backgroundColor: colors.primary, width: `${analysisProgress}%` as any }]} />
                </View>
                <Text style={[styles.analysisLoadingText, { color: colors.primary }]}>
                  Analyzing… {Math.round(analysisProgress)}%
                </Text>
                {[
                  "Extracting genre signals...",
                  "Identifying tone and theme...",
                  "Mapping gameplay mechanics...",
                  "Detecting technical constraints...",
                  "Risk assessment in progress...",
                ].map((item, i) => (
                  <View key={i} style={styles.analysisStep}>
                    <Feather name={analysisProgress > (i + 1) * 18 ? "check" : "loader"} size={12}
                      color={analysisProgress > (i + 1) * 18 ? colors.success : colors.mutedForeground} />
                    <Text style={[styles.analysisStepText, { color: analysisProgress > (i + 1) * 18 ? colors.foreground : colors.mutedForeground }]}>
                      {item}
                    </Text>
                  </View>
                ))}
              </View>
            ) : (
              <View style={styles.analysisResult}>
                {/* Confidence */}
                <View style={[styles.confidenceRow, { backgroundColor: colors.success + "18", borderColor: colors.success }]}>
                  <Feather name="check-circle" size={14} color={colors.success} />
                  <Text style={[styles.confidenceText, { color: colors.success }]}>
                    Analysis complete · {Math.round(analysisResult.confidence * 100)}% confidence
                  </Text>
                </View>

                {[
                  { label: "Genre", value: analysisResult.genre.join(", "), icon: "layers" },
                  { label: "Themes", value: analysisResult.themes.join(", "), icon: "tag" },
                  { label: "Tone", value: analysisResult.tone, icon: "sun" },
                  { label: "Setting", value: analysisResult.setting, icon: "map" },
                  { label: "Core Loop", value: analysisResult.coreLoop, icon: "repeat" },
                  { label: "Art Direction", value: analysisResult.artDirection, icon: "image" },
                  { label: "Audio Direction", value: analysisResult.audioDirection, icon: "music" },
                  { label: "Narrative", value: analysisResult.narrativeGoals, icon: "book-open" },
                ].map((row) => (
                  <View key={row.label} style={[styles.analysisRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                    <Feather name={row.icon as any} size={13} color={colors.accent} />
                    <Text style={[styles.analysisRowLabel, { color: colors.mutedForeground }]}>{row.label}</Text>
                    <Text style={[styles.analysisRowValue, { color: colors.foreground }]}>{row.value}</Text>
                  </View>
                ))}

                <Text style={[styles.paramLabel, { color: colors.mutedForeground }]}>IDENTIFIED RISKS</Text>
                {analysisResult.risks.map((r, i) => (
                  <View key={i} style={[styles.riskRow, { backgroundColor: colors.warning + "15", borderColor: colors.warning }]}>
                    <Feather name="alert-triangle" size={12} color={colors.warning} />
                    <Text style={[styles.riskText, { color: colors.foreground }]}>{r}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* ── Step 6: Blueprint Review ── */}
        {step === 6 && blueprint && (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>Project Blueprint</Text>
            <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
              The Master Game Director created this blueprint as the source of truth for all AI agents.
            </Text>
            <BlueprintPanel blueprint={blueprint} />
          </View>
        )}
      </ScrollView>

      {/* CTA footer */}
      <View style={[styles.footer, { paddingBottom: bottomPad + 8, borderTopColor: colors.border, backgroundColor: colors.background }]}>
        <Pressable
          onPress={handleNext}
          disabled={!canNext || (step === 5 && !analysisResult)}
          style={[
            styles.nextBtn,
            { backgroundColor: canNext && !(step === 5 && !analysisResult) ? colors.primary : colors.muted },
          ]}
        >
          <Text style={[styles.nextBtnText, { color: canNext && !(step === 5 && !analysisResult) ? "#fff" : colors.mutedForeground }]}>
            {step === 6 ? "Launch AI Agents" :
             step === 5 && !analysisResult ? "Analyzing…" :
             step === 5 ? "View Blueprint" :
             "Continue"}
          </Text>
          <Feather
            name={step === 6 ? "zap" : "arrow-right"}
            size={18}
            color={canNext && !(step === 5 && !analysisResult) ? "#fff" : colors.mutedForeground}
          />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerCenter: { alignItems: "center", gap: 4 },
  stepRow: { flexDirection: "row", gap: 4, alignItems: "center" },
  stepDot: { height: 4, borderRadius: 2 },
  stepLabel: { fontSize: 11, fontFamily: "Inter_500Medium" },
  stepContent: { gap: 14 },
  stepTitle: { fontSize: 24, fontFamily: "Inter_700Bold", letterSpacing: -0.3 },
  stepSub: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 21 },
  promptInput: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 16,
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    minHeight: 120,
    textAlignVertical: "top",
    lineHeight: 22,
  },
  charCount: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "right", marginTop: -8 },
  exampleTitle: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1 },
  exampleChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
  },
  exampleText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 10, borderWidth: 1 },
  chipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  modeCard: { flexDirection: "row", alignItems: "center", gap: 12, borderRadius: 14, padding: 14 },
  modeIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  modeInfo: { flex: 1 },
  modeLabel: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  modeDesc: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17, marginTop: 2 },
  modeCheck: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  paramLabel: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1, marginTop: 4 },
  bossRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  bossCounter: { flexDirection: "row", alignItems: "center", gap: 12 },
  bossBtn: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  bossValue: { fontSize: 18, fontFamily: "Inter_700Bold", width: 28, textAlign: "center" },
  analysisLoading: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 12 },
  analysisBg: { height: 6, borderRadius: 3, overflow: "hidden" },
  analysisFill: { height: 6, borderRadius: 3 },
  analysisLoadingText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  analysisStep: { flexDirection: "row", alignItems: "center", gap: 8 },
  analysisStepText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  analysisResult: { gap: 10 },
  confidenceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
  },
  confidenceText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  analysisRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
  },
  analysisRowLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", width: 82 },
  analysisRowValue: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  riskRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    padding: 10,
  },
  riskText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  footer: { paddingHorizontal: 24, paddingTop: 12, borderTopWidth: 1 },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 16,
  },
  nextBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  genHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  genAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  genTitleBlock: { flex: 1, gap: 2 },
  genTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  genPhase: { fontSize: 12, fontFamily: "Inter_500Medium" },
  genTabBar: { flexDirection: "row", marginHorizontal: 16, marginTop: 10, borderRadius: 12, padding: 3, gap: 2 },
  genTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 8,
    borderRadius: 10,
  },
  genTabActive: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  genTabLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  genFooter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  viewBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 16,
  },
  viewBtnText: { fontSize: 16, fontFamily: "Inter_600SemiBold", color: "#fff" },
});
