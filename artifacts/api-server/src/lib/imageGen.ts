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
  const buf = await generateImageBuffer(prompt, "512x512");
  return uploadBuffer(`assets/${projectId}/protagonist-${Date.now()}.png`, buf, "image/png");
}

export async function genBossArt(ctx: GameImageCtx, projectId: string): Promise<string> {
  const name = ctx.bossName ?? "the main antagonist";
  const prompt =
    `${styleHint(ctx.artStyle)} character concept art for ${name}, ` +
    `primary antagonist of "${ctx.title}" (${ctx.genre} game). ` +
    `Menacing pose, dramatic design, white background. No text.`;
  const buf = await generateImageBuffer(prompt, "512x512");
  return uploadBuffer(`assets/${projectId}/boss-${Date.now()}.png`, buf, "image/png");
}

export async function genEnvironmentArt(ctx: GameImageCtx, projectId: string): Promise<string> {
  const world = ctx.worldName ?? "the game world";
  const toneStr = ctx.tone ? `${ctx.tone} atmosphere. ` : "";
  const prompt =
    `${styleHint(ctx.artStyle)} environment concept art for ${world} ` +
    `in "${ctx.title}" (${ctx.genre} game). ` +
    `${toneStr}Detailed landscape, atmospheric lighting, no characters, no text.`;
  const buf = await generateImageBuffer(prompt, "512x512");
  return uploadBuffer(`assets/${projectId}/environment-${Date.now()}.png`, buf, "image/png");
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
