import { generateImage, type ImageCategory } from "@workspace/image-router";
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

/** Result of an image generation: the served URL plus provider/model provenance. */
export interface GenImage {
  url: string;
  model: string;
  provider: string;
  mimeType: string;
}

/**
 * Asset categories exposed to clients for custom/single asset generation.
 * Source of truth for the request Zod enum (assets route) and the custom-image
 * category allowlist (images route), so the two never drift.
 */
export const ASSET_CATEGORIES = [
  "sprite", "spritesheet", "portrait", "background", "environment",
  "cover", "splash", "tileset", "texture", "icon", "ui", "item", "vfx", "concept",
] as const;
export type AssetCategory = (typeof ASSET_CATEGORIES)[number];

/** Map an image mime type to a file extension allowed by the /api/files serving route. */
function extFor(mimeType: string): "png" | "jpg" | "webp" {
  if (mimeType === "image/jpeg" || mimeType === "image/jpg") return "jpg";
  if (mimeType === "image/webp") return "webp";
  return "png";
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

export async function genCoverArt(ctx: GameImageCtx, projectId: string): Promise<GenImage> {
  const prompt =
    `Game cover art for "${ctx.title}", a ${ctx.genre} game. ` +
    `${ctx.prompt.slice(0, 180)}. ` +
    `Style: ${styleHint(ctx.artStyle)}. ` +
    `Cinematic composition, dramatic lighting, hero and world visible. No text or logos.`;
  const img = await generateImage("cover", prompt);
  const url = await uploadBuffer(`assets/${projectId}/cover-${Date.now()}.${extFor(img.mimeType)}`, img.buffer, img.mimeType);
  return { url, model: img.model, provider: img.provider, mimeType: img.mimeType };
}

export async function genProtagonistArt(ctx: GameImageCtx, projectId: string): Promise<GenImage> {
  const name = ctx.protagonistName ?? "the protagonist";
  const prompt =
    `${styleHint(ctx.artStyle)} character concept art for ${name}, ` +
    `hero of "${ctx.title}" (${ctx.genre} game). ` +
    `Full body, facing forward, clear white background, detailed equipment and costume. No text.`;
  const img = await generateImage("character", prompt);
  const url = await uploadBuffer(`assets/${projectId}/protagonist-${Date.now()}.${extFor(img.mimeType)}`, img.buffer, img.mimeType);
  return { url, model: img.model, provider: img.provider, mimeType: img.mimeType };
}

export async function genBossArt(ctx: GameImageCtx, projectId: string): Promise<GenImage> {
  const name = ctx.bossName ?? "the main antagonist";
  const prompt =
    `${styleHint(ctx.artStyle)} character concept art for ${name}, ` +
    `primary antagonist of "${ctx.title}" (${ctx.genre} game). ` +
    `Menacing pose, dramatic design, white background. No text.`;
  const img = await generateImage("boss", prompt);
  const url = await uploadBuffer(`assets/${projectId}/boss-${Date.now()}.${extFor(img.mimeType)}`, img.buffer, img.mimeType);
  return { url, model: img.model, provider: img.provider, mimeType: img.mimeType };
}

export async function genEnvironmentArt(ctx: GameImageCtx, projectId: string): Promise<GenImage> {
  const world = ctx.worldName ?? "the game world";
  const toneStr = ctx.tone ? `${ctx.tone} atmosphere. ` : "";
  const prompt =
    `${styleHint(ctx.artStyle)} environment concept art for ${world} ` +
    `in "${ctx.title}" (${ctx.genre} game). ` +
    `${toneStr}Detailed landscape, atmospheric lighting, no characters, no text.`;
  const img = await generateImage("environment", prompt);
  const url = await uploadBuffer(`assets/${projectId}/environment-${Date.now()}.${extFor(img.mimeType)}`, img.buffer, img.mimeType);
  return { url, model: img.model, provider: img.provider, mimeType: img.mimeType };
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

const CAT_HINTS: Record<string, string> = {
  sprite:      "single game character sprite, full body, centered, transparent background, game-ready",
  spritesheet: "sprite sheet: an evenly-spaced grid of animation frames of the SAME character at a consistent size and camera angle (e.g. idle, walk, attack cycle), uniform cell spacing, transparent background, game-ready",
  portrait:    "character portrait, face and shoulders, expressive, detailed",
  background:  "wide landscape scene, game background art, horizontal composition",
  icon:        "game UI icon, small and readable, clear silhouette, square format",
  ui:          "game UI element, clean readable interface art, crisp edges",
  tileset:     "game tileset, seamlessly tiling texture pattern, top-down view",
  texture:     "seamless tileable game texture, even lighting, no seams",
  vfx:         "VFX sprite, particle effect, magic or impact effect, transparent background",
  environment: "environment art, detailed scene, game concept art, wide shot",
  cover:       "game cover art, dramatic composition, title-ready artwork, cinematic",
  concept:     "game concept art, exploratory illustration, mood and lighting",
  splash:      "splash / loading screen art, title-ready, cinematic composition",
  item:        "game item art, single object, clear silhouette, transparent background",
};

/** Map an app asset category string onto a router image category. */
function toImageCategory(category: string): ImageCategory {
  const known: ImageCategory[] = [
    "cover", "character", "boss", "environment", "background", "sprite",
    "spritesheet", "portrait", "icon", "ui", "tileset", "texture", "vfx",
    "concept", "splash", "item",
  ];
  return (known as string[]).includes(category) ? (category as ImageCategory) : "custom";
}

/**
 * Generate a custom asset from a user prompt, style, and category.
 * Routes through the image-router (provider failover) and returns the served URL.
 */
export async function genCustomAsset(opts: {
  prompt: string;
  style: string;
  category: string;
  projectId?: string;
  quality?: "fast" | "high";
}): Promise<GenImage> {
  const styleText = STYLE_PROMPTS[opts.style] ?? `${opts.style} art style`;
  const catHint = CAT_HINTS[opts.category] ?? "game art asset";
  const fullPrompt = `${styleText}. ${catHint}. ${opts.prompt}. High quality, game-ready, professional.`;
  const img = await generateImage(toImageCategory(opts.category), fullPrompt, {
    quality: opts.quality ?? "fast",
  });
  const slug = opts.projectId ?? "standalone";
  const catSlug = opts.category.replace(/[^a-z0-9-]/gi, "").toLowerCase() || "asset";
  const url = await uploadBuffer(
    `assets/${slug}/custom-${catSlug}-${Date.now()}.${extFor(img.mimeType)}`,
    img.buffer,
    img.mimeType
  );
  return { url, model: img.model, provider: img.provider, mimeType: img.mimeType };
}

/**
 * Regenerate a single asset image by category.
 * Returns the new served URL plus provider/model provenance.
 */
export async function regenAsset(
  category: "cover" | "character" | "boss" | "environment",
  ctx: GameImageCtx,
  projectId: string
): Promise<GenImage> {
  switch (category) {
    case "cover":       return genCoverArt(ctx, projectId);
    case "character":   return genProtagonistArt(ctx, projectId);
    case "boss":        return genBossArt(ctx, projectId);
    case "environment": return genEnvironmentArt(ctx, projectId);
  }
}
