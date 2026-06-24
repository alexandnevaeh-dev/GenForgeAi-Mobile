import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
import {
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
import { GenLogicPanel } from "@/components/GenLogicPanel";
import { AGENT_DEFS } from "@/constants/agents";
import {
  DEFAULT_STEPS,
  GameProject,
  makeInitialAgentStates,
  useProjects,
} from "@/context/ProjectsContext";
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

const EXAMPLE_PROMPTS = [
  "A dark fantasy metroidvania with procedurally generated castles and deep lore",
  "A cyberpunk endless runner with bullet-time and neon aesthetics",
  "A cozy pixel farm-sim where crops gain magical powers at night",
  "A survival horror roguelike with psychological tension mechanics",
];

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
              width: i === step - 1 ? 24 : 8,
            },
          ]}
        />
      ))}
    </View>
  );
}

// Builds a parallel-aware generation sequence.
// Phase agents run in overlapping waves; within a phase multiple agents go "active" at once.
function buildGenerationSequence(): Array<{ agentIds: string[]; delay: number }> {
  const phases = [1, 2, 3, 4, 5, 6];
  const sequence: Array<{ agentIds: string[]; delay: number }> = [];
  phases.forEach((phase) => {
    const agents = AGENT_DEFS.filter((a) => a.phase === phase);
    // Activate all agents in this phase simultaneously
    sequence.push({ agentIds: agents.map((a) => a.id), delay: 600 });
    // Mark all done together
    sequence.push({ agentIds: agents.map((a) => a.id), delay: 1600 });
  });
  return sequence;
}

export default function NewGameScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addProject, updateProject } = useProjects();

  const [step, setStep] = useState(1);
  const [prompt, setPrompt] = useState("");
  const [genre, setGenre] = useState<Genre | null>(null);
  const [artStyle, setArtStyle] = useState<ArtStyle | null>(null);
  const [generating, setGenerating] = useState(false);
  const [agentStates, setAgentStates] = useState<AgentState[]>(makeInitialAgentStates());
  const [currentPhase, setCurrentPhase] = useState(0);
  const [createdId, setCreatedId] = useState<string | null>(null);

  const topPad = Platform.OS === "web" ? 67 : insets.top + 16;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom + 16;

  const canNext =
    step === 1 ? prompt.trim().length > 0 :
    step === 2 ? genre !== null :
    step === 3 ? artStyle !== null : true;

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step < 3) {
      setStep((s) => s + 1);
    } else {
      startGeneration();
    }
  };

  const startGeneration = () => {
    setGenerating(true);
    setStep(4);

    const id = Date.now().toString() + Math.random().toString(36).slice(2, 6);
    const words = prompt.trim().split(" ").slice(0, 4)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");

    const initialAgents = makeInitialAgentStates();
    const newProject: GameProject = {
      id,
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
      tags: [genre!, artStyle!],
    };
    addProject(newProject);
    setCreatedId(id);

    // Build phase-based parallel generation sequence
    const phases = [1, 2, 3, 4, 5, 6];
    let elapsed = 0;
    const totalAgents = AGENT_DEFS.length;
    let doneCount = 0;

    phases.forEach((phase, phaseIdx) => {
      const phaseAgents = AGENT_DEFS.filter((a) => a.phase === phase);

      // Activate entire phase in parallel
      setTimeout(() => {
        setCurrentPhase(phase);
        setAgentStates((prev) => {
          const next = prev.map((s) =>
            phaseAgents.some((a) => a.id === s.agentId)
              ? { ...s, status: "active" as const }
              : s
          );
          return next;
        });
      }, elapsed + 400);

      elapsed += 1800;

      // Mark phase complete
      setTimeout(() => {
        doneCount += phaseAgents.length;
        const progress = Math.round((doneCount / totalAgents) * 100);
        setAgentStates((prev) => {
          const next = prev.map((s) =>
            phaseAgents.some((a) => a.id === s.agentId)
              ? { ...s, status: "done" as const }
              : s
          );
          updateProject(id, {
            agentStates: next,
            progress,
            status: phaseIdx < phases.length - 1 ? "generating" : "in_progress",
            steps: DEFAULT_STEPS.map((s, i) => ({
              ...s,
              status:
                i < Math.floor((progress / 100) * DEFAULT_STEPS.length)
                  ? "done"
                  : i === Math.floor((progress / 100) * DEFAULT_STEPS.length)
                  ? "active"
                  : "pending",
            })),
          });
          return next;
        });
      }, elapsed);

      elapsed += 400;
    });
  };

  if (generating) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        {/* Generation header */}
        <View style={[styles.genHeader, { paddingTop: topPad }]}>
          <View style={[styles.genAvatar, { backgroundColor: colors.primary }]}>
            <Feather name="cpu" size={22} color="#fff" />
          </View>
          <View style={styles.genTitleBlock}>
            <Text style={[styles.genTitle, { color: colors.foreground }]}>
              Generating Your Game
            </Text>
            <Text style={[styles.genPhase, { color: colors.primary }]}>
              {currentPhase > 0
                ? `Phase ${currentPhase} — ${["", "Foundation", "Gameplay Systems", "Content", "Economy", "Assets", "QA & Export"][currentPhase] ?? ""}`
                : "Initializing..."}
            </Text>
          </View>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 16,
            paddingBottom: bottomPad + 80,
            gap: 16,
          }}
          showsVerticalScrollIndicator={false}
        >
          {/* GenLogic Panel */}
          <GenLogicPanel
            genre={genre!}
            artStyle={artStyle!}
            prompt={prompt}
          />

          {/* Full Agent Network */}
          <AgentNetwork agentStates={agentStates} />
        </ScrollView>

        {/* Footer CTA */}
        <View
          style={[
            styles.genFooter,
            { paddingBottom: bottomPad + 8, borderTopColor: colors.border, backgroundColor: colors.background },
          ]}
        >
          <Pressable
            onPress={() => {
              if (createdId) router.replace(`/project/${createdId}`);
              else router.back();
            }}
            style={[styles.viewBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.viewBtnText}>View Project</Text>
            <Feather name="arrow-right" size={16} color="#fff" />
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad }]}>
        <Pressable onPress={() => (step === 1 ? router.back() : setStep((s) => s - 1))}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <StepIndicator step={step} total={3} />
        <Text style={[styles.stepLabel, { color: colors.mutedForeground }]}>{step} of 3</Text>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Step 1 — Prompt */}
        {step === 1 && (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>
              What game do you want to create?
            </Text>
            <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
              Describe your idea. The Master Game Director coordinates 23 specialized AI agents to build it.
            </Text>
            <TextInput
              style={[
                styles.promptInput,
                { backgroundColor: colors.card, borderColor: colors.primary, color: colors.foreground },
              ]}
              placeholder="A dark fantasy RPG with procedurally generated dungeons..."
              placeholderTextColor={colors.mutedForeground}
              value={prompt}
              onChangeText={setPrompt}
              multiline
              autoFocus
              maxLength={300}
            />
            <Text style={[styles.charCount, { color: colors.mutedForeground }]}>{prompt.length}/300</Text>

            <Text style={[styles.exampleTitle, { color: colors.mutedForeground }]}>Examples</Text>
            {EXAMPLE_PROMPTS.map((ex) => (
              <Pressable
                key={ex}
                onPress={() => setPrompt(ex)}
                style={[styles.exampleChip, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <Text style={[styles.exampleText, { color: colors.foreground }]} numberOfLines={2}>
                  {ex}
                </Text>
                <Feather name="arrow-up-right" size={14} color={colors.mutedForeground} />
              </Pressable>
            ))}
          </View>
        )}

        {/* Step 2 — Genre */}
        {step === 2 && (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>Choose a genre</Text>
            <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
              GenLogic adapts all 23 AI agents to the selected genre.
            </Text>
            <View style={styles.chipGrid}>
              {GENRES.map((g) => (
                <Pressable
                  key={g}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setGenre(g);
                  }}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: genre === g ? colors.primary : colors.card,
                      borderColor: genre === g ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.chipText, { color: genre === g ? "#fff" : colors.foreground }]}>
                    {g}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Step 3 — Art Style */}
        {step === 3 && (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>Choose an art style</Text>
            <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
              The Pixel Art Designer and Animation Designer generate all assets in this style.
            </Text>
            <View style={styles.chipGrid}>
              {ART_STYLES.map((s) => (
                <Pressable
                  key={s}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setArtStyle(s);
                  }}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: artStyle === s ? colors.secondary : colors.card,
                      borderColor: artStyle === s ? colors.secondary : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.chipText, { color: artStyle === s ? "#fff" : colors.foreground }]}>
                    {s}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* CTA */}
      <View style={[styles.footer, { paddingBottom: bottomPad + 8, borderTopColor: colors.border }]}>
        <Pressable
          onPress={handleNext}
          disabled={!canNext}
          style={[styles.nextBtn, { backgroundColor: canNext ? colors.primary : colors.muted }]}
        >
          <Text style={[styles.nextBtnText, { color: canNext ? "#fff" : colors.mutedForeground }]}>
            {step === 3 ? "Launch AI Agents" : "Continue"}
          </Text>
          <Feather name={step === 3 ? "zap" : "arrow-right"} size={18} color={canNext ? "#fff" : colors.mutedForeground} />
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
  },
  stepRow: { flexDirection: "row", gap: 5, alignItems: "center" },
  stepDot: { height: 4, borderRadius: 2 },
  stepLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  stepContent: { gap: 16 },
  stepTitle: { fontSize: 24, fontFamily: "Inter_700Bold", letterSpacing: -0.3 },
  stepSub: { fontSize: 15, fontFamily: "Inter_400Regular", lineHeight: 22 },
  promptInput: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: 16,
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    minHeight: 120,
    textAlignVertical: "top",
    lineHeight: 24,
  },
  charCount: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "right" },
  exampleTitle: { fontSize: 12, fontFamily: "Inter_600SemiBold", letterSpacing: 0.8, marginTop: 4 },
  exampleChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  exampleText: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  chipGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  chipText: { fontSize: 14, fontFamily: "Inter_500Medium" },
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
    paddingBottom: 14,
  },
  genAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  genTitleBlock: { gap: 2 },
  genTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  genPhase: { fontSize: 13, fontFamily: "Inter_500Medium" },
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
