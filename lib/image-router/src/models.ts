import type { ImageAspect } from "./providers/types";

/**
 * Asset categories the router knows how to size and route. Maps the app's asset
 * categories onto an aspect ratio and whether a transparent background is wanted.
 */
export type ImageCategory =
  | "cover"
  | "character"
  | "boss"
  | "environment"
  | "background"
  | "sprite"
  | "spritesheet"
  | "portrait"
  | "icon"
  | "ui"
  | "tileset"
  | "texture"
  | "vfx"
  | "concept"
  | "splash"
  | "item"
  | "custom";

export type ImageQuality = "fast" | "high";

export interface CategoryConfig {
  aspect: ImageAspect;
  transparent: boolean;
}

export const CATEGORY_CONFIG: Record<ImageCategory, CategoryConfig> = {
  cover: { aspect: "square", transparent: false },
  character: { aspect: "portrait", transparent: false },
  boss: { aspect: "portrait", transparent: false },
  environment: { aspect: "landscape", transparent: false },
  background: { aspect: "landscape", transparent: false },
  sprite: { aspect: "square", transparent: true },
  spritesheet: { aspect: "landscape", transparent: true },
  portrait: { aspect: "portrait", transparent: false },
  icon: { aspect: "square", transparent: true },
  ui: { aspect: "square", transparent: true },
  tileset: { aspect: "square", transparent: false },
  texture: { aspect: "square", transparent: false },
  vfx: { aspect: "square", transparent: true },
  concept: { aspect: "landscape", transparent: false },
  splash: { aspect: "landscape", transparent: false },
  item: { aspect: "square", transparent: true },
  custom: { aspect: "square", transparent: false },
};

export interface ProviderModel {
  provider: "openai" | "gemini";
  model: string;
}

/**
 * Ordered provider/model fallback chains by quality tier.
 * `fast` is the default (Gemini flash, cheapest); `high` uses the pro image model
 * first and is only selected when the caller explicitly asks for high quality.
 */
export const CHAINS: Record<ImageQuality, ProviderModel[]> = {
  fast: [
    { provider: "gemini", model: "gemini-2.5-flash-image" },
    { provider: "openai", model: "gpt-image-1" },
  ],
  high: [
    { provider: "gemini", model: "gemini-3-pro-image-preview" },
    { provider: "gemini", model: "gemini-2.5-flash-image" },
    { provider: "openai", model: "gpt-image-1" },
  ],
};
