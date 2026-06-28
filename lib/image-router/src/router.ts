import type { Buffer } from "node:buffer";
import { geminiProvider } from "./providers/gemini";
import { openaiProvider } from "./providers/openai";
import type { ImageAspect, ImageProvider } from "./providers/types";
import {
  CATEGORY_CONFIG,
  CHAINS,
  type ImageCategory,
  type ImageQuality,
} from "./models";

const PROVIDERS: Record<string, ImageProvider> = {
  openai: openaiProvider,
  gemini: geminiProvider,
};

const DEFAULT_RETRY_DELAY = 800;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function isRetryableError(err: unknown): boolean {
  if (err instanceof Error) {
    const msg = err.message.toLowerCase();
    return (
      msg.includes("rate limit") ||
      msg.includes("overloaded") ||
      msg.includes("timeout") ||
      msg.includes("503") ||
      msg.includes("502") ||
      msg.includes("529") ||
      msg.includes("quota")
    );
  }
  return true;
}

export interface GenerateOptions {
  /** "fast" (default) or "high". "high" tries the pro image model first. */
  quality?: ImageQuality;
  /** Override the category's default aspect ratio. */
  aspect?: ImageAspect;
  /** Override the category's default transparency. */
  transparent?: boolean;
  retryDelayMs?: number;
}

export interface ImageResult {
  buffer: Buffer;
  mimeType: string;
  provider: string;
  model: string;
  attemptCount: number;
}

/**
 * Generate an image for an asset category, automatically falling back across
 * providers/models in the quality chain. Aspect ratio and transparency default
 * from the category but can be overridden per call.
 */
export async function generateImage(
  category: ImageCategory,
  prompt: string,
  options: GenerateOptions = {}
): Promise<ImageResult> {
  const cfg = CATEGORY_CONFIG[category] ?? CATEGORY_CONFIG.custom;
  const quality = options.quality ?? "fast";
  const aspect = options.aspect ?? cfg.aspect;
  const transparent = options.transparent ?? cfg.transparent;
  const retryDelay = options.retryDelayMs ?? DEFAULT_RETRY_DELAY;
  const chain = CHAINS[quality];

  let lastError: unknown;
  let attemptCount = 0;

  for (const { provider, model } of chain) {
    const adapter = PROVIDERS[provider];
    if (!adapter) continue;
    attemptCount++;
    try {
      const res = await adapter.generate({ prompt, aspect, transparent, model });
      return {
        buffer: res.buffer,
        mimeType: res.mimeType,
        provider,
        model: res.model,
        attemptCount,
      };
    } catch (err) {
      lastError = err;
      // Any failure falls through to the next provider in the chain; add a short
      // backoff only for transient/rate-limit style errors.
      if (attemptCount < chain.length) {
        if (isRetryableError(err)) await sleep(retryDelay * attemptCount);
        continue;
      }
    }
  }

  const errMsg =
    lastError instanceof Error ? lastError.message : "All image providers failed";
  throw new Error(
    `[Image Router] "${category}" failed after ${attemptCount} attempts: ${errMsg}`
  );
}
