import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useState } from "react";
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

import { AIProgressIndicator } from "@/components/AIProgressIndicator";
import { DEFAULT_STEPS, GameProject, useProjects } from "@/context/ProjectsContext";
import { useColors } from "@/hooks/useColors";

type Genre = GameProject["genre"];
type ArtStyle = GameProject["artStyle"];

const GENRES: Genre[] = ["RPG", "Action", "Platformer", "Strategy", "Puzzle", "Horror", "Adventure", "Simulation", "Fighting", "Shooter"];
const ART_STYLES: ArtStyle[] = ["Pixel Art", "Low Poly", "Realistic", "Cartoon", "Isometric", "Voxel", "Anime"];

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
              backgroundColor: i < step ? colors.primary : i === step - 1 ? colors.primary : colors.border,
              width: i === step - 1 ? 24 : 8,
            },
          ]}
        />
      ))}
    </View>
  );
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
  const [steps, setSteps] = useState(DEFAULT_STEPS.map((s) => ({ ...s })));
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
    const words = prompt.trim().split(" ").slice(0, 4).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
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
      tags: [genre!, artStyle!],
    };
    addProject(newProject);
    setCreatedId(id);

    const localSteps = DEFAULT_STEPS.map((s) => ({ ...s }));
    let currentStep = 0;

    const tick = () => {
      if (currentStep >= localSteps.length) {
        updateProject(id, { status: "in_progress", progress: 100 });
        return;
      }
      localSteps[currentStep].status = "active";
      setSteps([...localSteps]);

      setTimeout(() => {
        localSteps[currentStep].status = "done";
        const progress = Math.round(((currentStep + 1) / localSteps.length) * 100);
        updateProject(id, {
          progress,
          steps: [...localSteps],
          status: currentStep < localSteps.length - 1 ? "generating" : "in_progress",
        });
        currentStep++;
        setSteps([...localSteps]);
        if (currentStep < localSteps.length) {
          setTimeout(tick, 900);
        } else {
          updateProject(id, { status: "in_progress", progress: 100 });
        }
      }, 1400);
    };

    setTimeout(tick, 600);
  };

  if (generating) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <View style={[styles.genHeader, { paddingTop: topPad }]}>
          <View style={[styles.genAvatar, { backgroundColor: colors.primary }]}>
            <Feather name="cpu" size={22} color="#fff" />
          </View>
          <Text style={[styles.genTitle, { color: colors.foreground }]}>Generating Your Game</Text>
          <Text style={[styles.genSub, { color: colors.mutedForeground }]} numberOfLines={2}>
            {prompt}
          </Text>
        </View>

        <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 24, paddingBottom: bottomPad + 80 }}>
          <AIProgressIndicator steps={steps} />
        </ScrollView>

        <View style={[styles.genFooter, { paddingBottom: bottomPad + 8, borderTopColor: colors.border }]}>
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
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>What game do you want to create?</Text>
            <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>
              Describe your idea in one or two sentences. Be creative.
            </Text>
            <TextInput
              style={[styles.promptInput, { backgroundColor: colors.card, borderColor: colors.primary, color: colors.foreground }]}
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
                <Text style={[styles.exampleText, { color: colors.foreground }]} numberOfLines={2}>{ex}</Text>
                <Feather name="arrow-up-right" size={14} color={colors.mutedForeground} />
              </Pressable>
            ))}
          </View>
        )}

        {/* Step 2 — Genre */}
        {step === 2 && (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>Choose a genre</Text>
            <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>The AI will adapt systems, mechanics, and story to this genre.</Text>
            <View style={styles.chipGrid}>
              {GENRES.map((g) => (
                <Pressable
                  key={g}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setGenre(g); }}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: genre === g ? colors.primary : colors.card,
                      borderColor: genre === g ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.chipText, { color: genre === g ? "#fff" : colors.foreground }]}>{g}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Step 3 — Art Style */}
        {step === 3 && (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>Choose an art style</Text>
            <Text style={[styles.stepSub, { color: colors.mutedForeground }]}>AI art agents will generate all assets in this visual style.</Text>
            <View style={styles.chipGrid}>
              {ART_STYLES.map((s) => (
                <Pressable
                  key={s}
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setArtStyle(s); }}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: artStyle === s ? colors.secondary : colors.card,
                      borderColor: artStyle === s ? colors.secondary : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.chipText, { color: artStyle === s ? "#fff" : colors.foreground }]}>{s}</Text>
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
            {step === 3 ? "Generate Game" : "Continue"}
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
  stepRow: {
    flexDirection: "row",
    gap: 5,
    alignItems: "center",
  },
  stepDot: {
    height: 4,
    borderRadius: 2,
  },
  stepLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  stepContent: { gap: 16 },
  stepTitle: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
  },
  stepSub: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },
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
  charCount: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "right",
  },
  exampleTitle: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.8,
    marginTop: 4,
  },
  exampleChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
  },
  exampleText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  chipGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  nextBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 16,
  },
  nextBtnText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  genHeader: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    alignItems: "center",
    gap: 12,
  },
  genAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  genTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  genSub: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  genFooter: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 12,
    borderTopWidth: 1,
    backgroundColor: "transparent",
  },
  viewBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 14,
    paddingVertical: 16,
  },
  viewBtnText: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },
});
