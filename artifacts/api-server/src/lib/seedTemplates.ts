import { db } from "@workspace/db";
import { templates } from "@workspace/db/schema";
import { count } from "drizzle-orm";

const SEED_TEMPLATES = [
  {
    title: "Dark Fantasy Starter",
    author: "ForgeStudio",
    description:
      "A complete dark fantasy RPG template with a rich overworld, gothic story arc, 200+ AI-generated assets, multi-phase boss fights, and a full combat system. Perfect for beginners who want a professional head-start.",
    genre: "RPG",
    artStyle: "Pixel Art",
    difficulty: "Beginner",
    category: "templates",
    tags: ["RPG", "Dark Fantasy", "Pixel Art", "Story-Rich"],
    rating: 49,
    reviewCount: 2341,
    usageCount: 8742,
    isPremium: false,
    priceCents: 0,
    badge: "HOT",
    promptHint:
      "Create a dark fantasy RPG set in a crumbling gothic kingdom. Pixel art style, grim atmosphere, heroic protagonist fighting against a dark sorcerer.",
  },
  {
    title: "Cyberpunk Runner",
    author: "NeonForge",
    description:
      "A fast-paced cyberpunk side-scroller with neon-lit cities, hacking mechanics, and an AI-driven narrative. Includes procedural level generation and a synthwave soundtrack.",
    genre: "Action",
    artStyle: "Pixel Art",
    difficulty: "Intermediate",
    category: "templates",
    tags: ["Cyberpunk", "Action", "Runner", "Procedural"],
    rating: 47,
    reviewCount: 891,
    usageCount: 3210,
    isPremium: true,
    priceCents: 299,
    badge: "NEW",
    promptHint:
      "Create a cyberpunk action runner. Neon city environments, hacker protagonist, synthwave music, pixel art style, procedurally generated levels.",
  },
  {
    title: "Cozy Farm Sim",
    author: "CozyDev",
    description:
      "A relaxing farming simulation with day/night cycles, four seasons, crop cultivation, animal care, and a charming village community. Inspired by Stardew Valley.",
    genre: "Simulation",
    artStyle: "Pixel Art",
    difficulty: "Beginner",
    category: "templates",
    tags: ["Simulation", "Cozy", "Farming", "Relaxing"],
    rating: 45,
    reviewCount: 672,
    usageCount: 4120,
    isPremium: false,
    priceCents: 0,
    badge: null,
    promptHint:
      "Create a cozy farming simulation game. Four seasons, crop growing, animal care, friendly village NPCs, soft pixel art, relaxing music.",
  },
  {
    title: "Space Roguelite",
    author: "GalacticForge",
    description:
      "A deep-space roguelite with procedurally generated star systems, ship upgrades, alien factions, and permadeath. Each run tells a unique story.",
    genre: "Strategy",
    artStyle: "Pixel Art",
    difficulty: "Advanced",
    category: "templates",
    tags: ["Space", "Roguelite", "Procedural", "Strategy"],
    rating: 48,
    reviewCount: 1102,
    usageCount: 2890,
    isPremium: true,
    priceCents: 299,
    badge: null,
    promptHint:
      "Create a space roguelite. Procedural star systems, ship upgrades, alien factions, permadeath runs, pixel art style.",
  },
  {
    title: "Metroidvania Starter",
    author: "ForgeStudio",
    description:
      "A fully-featured Metroidvania template with interconnected maps, ability gating, secret areas, and a mysterious sci-fi narrative. Includes the complete exploration framework.",
    genre: "Platformer",
    artStyle: "Pixel Art",
    difficulty: "Intermediate",
    category: "templates",
    tags: ["Metroidvania", "Exploration", "Sci-Fi", "Pixel Art"],
    rating: 49,
    reviewCount: 1567,
    usageCount: 5340,
    isPremium: false,
    priceCents: 0,
    badge: "OFFICIAL",
    promptHint:
      "Create a sci-fi Metroidvania. Interconnected underground facility, ability unlocks that open new areas, mysterious alien narrative, pixel art.",
  },
  {
    title: "Tower Defense Pro",
    author: "DefenderLabs",
    description:
      "A polished tower defense with 15 unique tower types, wave-based enemy escalation, map editor, and strategic placement mechanics. Fantasy medieval theme.",
    genre: "Strategy",
    artStyle: "Isometric",
    difficulty: "Intermediate",
    category: "templates",
    tags: ["Tower Defense", "Strategy", "Fantasy", "Isometric"],
    rating: 46,
    reviewCount: 834,
    usageCount: 2100,
    isPremium: true,
    priceCents: 399,
    badge: null,
    promptHint:
      "Create a fantasy tower defense game. 15 tower types, escalating waves, strategic placement, isometric art style, medieval setting.",
  },
  {
    title: "Horror Survival",
    author: "DreadForge",
    description:
      "A psychological horror survival game with resource management, dynamic fear mechanics, and a haunted mansion setting. Designed to keep players on edge from the first second.",
    genre: "Horror",
    artStyle: "Pixel Art",
    difficulty: "Advanced",
    category: "templates",
    tags: ["Horror", "Survival", "Atmospheric", "Pixel Art"],
    rating: 48,
    reviewCount: 445,
    usageCount: 1560,
    isPremium: true,
    priceCents: 499,
    badge: "HOT",
    promptHint:
      "Create a psychological horror survival game. Haunted mansion, resource scarcity, fear mechanic, pixel art with dark palette, tense atmosphere.",
  },
  {
    title: "Arena Fighter",
    author: "CombatLabs",
    description:
      "A 2D arena fighting game with a 12-character roster, combo systems, special moves, online-ready netcode architecture, and tournament bracket support.",
    genre: "Fighting",
    artStyle: "Anime",
    difficulty: "Advanced",
    category: "templates",
    tags: ["Fighting", "Anime", "PvP", "Combos"],
    rating: 47,
    reviewCount: 389,
    usageCount: 1890,
    isPremium: true,
    priceCents: 599,
    badge: "PRO",
    promptHint:
      "Create a 2D anime fighting game. 12 unique fighters, combo systems, special moves, anime art style, dramatic tournament setting.",
  },
  {
    title: "Match-3 Puzzle",
    author: "PuzzleForge",
    description:
      "A polished match-3 puzzle game with 200 levels, power-ups, special gem types, and a wholesome story campaign. Monetization-ready with IAP hooks.",
    genre: "Puzzle",
    artStyle: "Cartoon",
    difficulty: "Beginner",
    category: "templates",
    tags: ["Puzzle", "Match-3", "Casual", "Cartoon"],
    rating: 44,
    reviewCount: 2109,
    usageCount: 9200,
    isPremium: false,
    priceCents: 0,
    badge: null,
    promptHint:
      "Create a match-3 puzzle game. 200 hand-crafted levels, power-ups, gem types, cartoon art style, cheerful music, casual gameplay.",
  },
  {
    title: "Open World Adventure",
    author: "WorldForge",
    description:
      "A sweeping open-world adventure with dynamic weather, faction-based diplomacy, procedurally generated side quests, and a hand-crafted main narrative spanning 40+ hours.",
    genre: "Adventure",
    artStyle: "Low Poly",
    difficulty: "Advanced",
    category: "templates",
    tags: ["Open World", "Adventure", "Exploration", "Low Poly"],
    rating: 49,
    reviewCount: 3210,
    usageCount: 6100,
    isPremium: true,
    priceCents: 799,
    badge: "OFFICIAL",
    promptHint:
      "Create an open-world adventure game. Dynamic weather, faction diplomacy, procedural side quests, low poly art, 40+ hour main story.",
  },
];

let seeded = false;

export async function seedTemplates() {
  if (seeded) return;
  seeded = true;

  const [{ value: existing }] = await db.select({ value: count() }).from(templates);
  if (Number(existing) > 0) return;

  await db.insert(templates).values(SEED_TEMPLATES);
}
