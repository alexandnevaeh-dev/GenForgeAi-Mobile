import { generateImageBuffer } from "@workspace/integrations-openai-ai-server";
import { uploadBuffer } from "./objectStorage";

export interface GameImageCtx {
  title: string;
  genre: string;
  artStyle: string;
  prompt: string;
  protagonistName?: string;
  bossName?: string;
  worldName?: string;
  tone?: string;
}

function styleHint(artStyle: string): string {
  switch (artStyle) {
    case "Pixel Art":   return "pixel art, 16-bit style, clean crisp pixels, vibrant palette";
    case "Low Poly":    return "low poly 3D render, flat shaded, geometric aesthetic";
    case "Cartoon":     return "cartoon illustration, bold outlines, bright flat colors";
    case "Isometric":   return "isometric pixel art, detailed tilework, clean grid";
    case "Voxel":       return "voxel art, Minecraft-inspired, cubic detail";
    case "Anime":       return "anime illustration, cel shaded, detailed linework";
    case "Realistic":   return "realistic digital painting, detailed textures, cinematic lighting";
    default:            return "digital game art, stylized";
  }
}

export async function genCoverArt(ctx: GameImageCtx, projectId: string): Promise<string> {
  const prompt =
    `Game cover art for "${ctx.title}", a ${ctx.genre} game. ` +
    `${ctx.prompt.slice(0, 180)}. ` +
    `Style: ${styleHint(ctx.artStyle)}. ` +
    `Cinematic composition, dramatic lighting, hero and world visible. No text or logos.`;
  const buf = await generateImageBuffer(prompt, "1024x1024");
  return uploadBuffer(`assets/${projectId}/cover-${Date.now()}.png`, buf, "image/png");
}

export async function genProtagonistArt(ctx: GameImageCtx, projectId: string): Promise<string> {
  const name = ctx.protagonistName ?? "the protagonist";
  const prompt =
    `${styleHint(ctx.artStyle)} character concept art for ${name}, ` +
    `hero of "${ctx.title}" (${ctx.genre} game). ` +
    `Full body, facing forward, clear white background, detailed equipment and costume. No text.`;
  const buf = await generateImageBuffer(prompt, "1024x1536");
  return uploadBuffer(`assets/${projectId}/protagonist-${Date.now()}.png`, buf, "image/png");
}

export async function genBossArt(ctx: GameImageCtx, projectId: string): Promise<string> {
  const name = ctx.bossName ?? "the main antagonist";
  const prompt =
    `${styleHint(ctx.artStyle)} character concept art for ${name}, ` +
    `primary antagonist of "${ctx.title}" (${ctx.genre} game). ` +
    `Menacing pose, dramatic design, white background. No text.`;
  const buf = await generateImageBuffer(prompt, "1024x1536");
  return uploadBuffer(`assets/${projectId}/boss-${Date.now()}.png`, buf, "image/png");
}

export async function genEnvironmentArt(ctx: GameImageCtx, projectId: string): Promise<string> {
  const world = ctx.worldName ?? "the game world";
  const toneStr = ctx.tone ? `${ctx.tone} atmosphere. ` : "";
  const prompt =
    `${styleHint(ctx.artStyle)} environment concept art for ${world} ` +
    `in "${ctx.title}" (${ctx.genre} game). ` +
    `${toneStr}Detailed landscape, atmospheric lighting, no characters, no text.`;
  const buf = await generateImageBuffer(prompt, "1536x1024");
  return uploadBuffer(`assets/${projectId}/environment-${Date.now()}.png`, buf, "image/png");
}

const STYLE_PROMPTS: Record<string, string> = {
  "Pixel Art":    "16-bit pixel art, crisp clean pixels, vibrant colors, Shovel Knight / Owlboy style",
  "Hand-painted": "hand-painted watercolor illustration, soft expressive brush strokes, painterly texture",
  "Anime":        "anime art style, clean linework, vibrant colors, Japanese animation aesthetic",
  "Realistic":    "photorealistic digital painting, cinematic lighting, highly detailed",
  "Cartoon":      "cartoon illustration, bold outlines, bright flat colors, fun stylized look",
  "Low Poly":     "low poly 3D art, geometric shapes, flat shading, minimal detail, clean",
  "Stylized 3D":  "stylized 3D render, Pixar-inspired, soft lighting, expressive characters",
  "Fantasy":      "epic fantasy concept art, dramatic lighting, intricate detail, oil-painting finish",
  "Sci-Fi":       "science fiction concept art, futuristic design, glowing elements, digital painting",
  "Horror":       "dark horror art, gothic atmosphere, ominous shadows, unsettling, eerie",
  "Retro":        "retro 8-bit NES style, limited color palette, chunky pixels, nostalgic",
  "Cyberpunk":    "cyberpunk neon art, dark city backdrop, neon lights, digital glitch aesthetic",
  "Steampunk":    "steampunk illustration, brass gears and cogs, Victorian industrial aesthetic",
  "Voxel":        "voxel art, blocky 3D cubes, bright colors, isometric view, Minecraft-inspired",
  "Chibi":        "chibi kawaii art, super-deformed proportions, big expressive eyes, adorable style",
  "Isometric":    "isometric pixel art, 45-degree axonometric view, detailed environment, clean",
};

/**
 * Generate a custom asset from a user prompt, style, and category.
 * Returns the persistent GCS URL.
 */
export async function genCustomAsset(opts: {
  prompt: string;
  style: string;
  category: string;
  projectId?: string;
}): Promise<string> {
  const styleHint = STYLE_PROMPTS[opts.style] ?? `${opts.style} art style`;
  const catHint =
    opts.category === "sprite"      ? "game character sprite, transparent background, game-ready" :
    opts.category === "portrait"    ? "character portrait, face and shoulders, expressive, detailed" :
    opts.category === "background"  ? "wide landscape scene, game background art, horizontal composition" :
    opts.category === "icon"        ? "game UI icon, small and readable, clear silhouette, square format" :
    opts.category === "tileset"     ? "game tileset preview, seamlessly tiling texture pattern, top-down view" :
    opts.category === "vfx"        ? "VFX sprite, particle effect, magic or impact effect, transparent background" :
    opts.category === "environment" ? "environment art, detailed scene, game concept art, wide shot" :
    opts.category === "cover"       ? "game cover art, dramatic composition, title-ready artwork, cinematic" :
    "game art asset";
  const fullPrompt = `${styleHint}. ${catHint}. ${opts.prompt}. High quality, game-ready, professional.`;
  const size = "1024x1024" as const;
  const buf = await generateImageBuffer(fullPrompt, size);
  const slug = opts.projectId ?? "standalone";
  const url = await uploadBuffer(`assets/${slug}/custom-${opts.category}-${Date.now()}.png`, buf, "image/png");
  return url;
}

/**
 * Regenerate a single asset image by category.
 * Returns the new persistent GCS URL.
 */
export async function regenAsset(
  category: "cover" | "character" | "boss" | "environment",
  ctx: GameImageCtx,
  projectId: string
): Promise<string> {
  switch (category) {
    case "cover":       return genCoverArt(ctx, projectId);
    case "character":   return genProtagonistArt(ctx, projectId);
    case "boss":        return genBossArt(ctx, projectId);
    case "environment": return genEnvironmentArt(ctx, projectId);
  }
}
