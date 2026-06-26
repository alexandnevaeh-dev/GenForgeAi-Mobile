export type TaskType =
  | "foundation"
  | "story"
  | "characters"
  | "assets"
  | "balance"
  | "coding"
  | "chat"
  | "packaging";

export interface ModelChain {
  task: TaskType;
  description: string;
  models: string[];
}

/**
 * Priority chains per task type.
 * Each list is ordered: try index 0 first, fall back in order.
 * All models are free-tier on OpenRouter.
 * "openrouter/free" is the last-resort automatic selector.
 */
export const MODEL_CHAINS: Record<TaskType, ModelChain> = {
  foundation: {
    task: "foundation",
    description: "Game design concepts, core mechanics, unique systems",
    models: [
      "nvidia/nemotron-3-ultra-550b-a55b:free",
      "nvidia/nemotron-3-super-120b-a12b:free",
      "qwen/qwen3-next-80b-a3b-instruct:free",
      "meta-llama/llama-3.3-70b-instruct:free",
      "openrouter/free",
    ],
  },
  story: {
    task: "story",
    description: "World building, lore, narrative arcs, faction design",
    models: [
      "nousresearch/hermes-3-llama-3.1-405b:free",
      "meta-llama/llama-3.3-70b-instruct:free",
      "nvidia/nemotron-3-super-120b-a12b:free",
      "google/gemma-4-31b-it:free",
      "openrouter/free",
    ],
  },
  characters: {
    task: "characters",
    description: "NPCs, dialogue, protagonists, enemies, quests",
    models: [
      "meta-llama/llama-3.3-70b-instruct:free",
      "nousresearch/hermes-3-llama-3.1-405b:free",
      "google/gemma-4-31b-it:free",
      "nvidia/nemotron-3-nano-30b-a3b:free",
      "openrouter/free",
    ],
  },
  assets: {
    task: "assets",
    description: "Asset manifests, sprite lists, audio tracks, VFX descriptors",
    models: [
      "qwen/qwen3-next-80b-a3b-instruct:free",
      "google/gemma-4-31b-it:free",
      "google/gemma-4-26b-a4b-it:free",
      "nvidia/nemotron-3-nano-30b-a3b:free",
      "openrouter/free",
    ],
  },
  balance: {
    task: "balance",
    description: "Game balance, stat systems, difficulty curves, economy",
    models: [
      "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
      "nvidia/nemotron-3-super-120b-a12b:free",
      "qwen/qwen3-next-80b-a3b-instruct:free",
      "meta-llama/llama-3.3-70b-instruct:free",
      "openrouter/free",
    ],
  },
  coding: {
    task: "coding",
    description: "Code generation, scripts, shaders, game logic",
    models: [
      "qwen/qwen3-coder:free",
      "poolside/laguna-m.1:free",
      "cohere/north-mini-code:free",
      "qwen/qwen3-next-80b-a3b-instruct:free",
      "openrouter/free",
    ],
  },
  chat: {
    task: "chat",
    description: "Conversational game design advisor, creative brainstorming",
    models: [
      "meta-llama/llama-3.3-70b-instruct:free",
      "nousresearch/hermes-3-llama-3.1-405b:free",
      "google/gemma-4-31b-it:free",
      "nvidia/nemotron-3-nano-30b-a3b:free",
      "openrouter/free",
    ],
  },
  packaging: {
    task: "packaging",
    description: "Export configs, manifests, simple structured formatting",
    models: [
      "openai/gpt-oss-20b:free",
      "nvidia/nemotron-3-nano-30b-a3b:free",
      "google/gemma-4-26b-a4b-it:free",
      "openrouter/free",
    ],
  },
};
