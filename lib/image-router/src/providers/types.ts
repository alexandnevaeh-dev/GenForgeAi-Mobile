import type { Buffer } from "node:buffer";

/** Abstract aspect ratios mapped to provider-specific sizes by each adapter. */
export type ImageAspect = "square" | "portrait" | "landscape";

export interface ProviderRequest {
  prompt: string;
  aspect: ImageAspect;
  /** Request a transparent background. Honored best-effort per provider. */
  transparent: boolean;
  /** Concrete model id for the provider (e.g. "gpt-image-1", "gemini-2.5-flash-image"). */
  model: string;
}

export interface ProviderResult {
  buffer: Buffer;
  mimeType: string;
  /** Echo back the model that actually produced the image. */
  model: string;
}

export interface ImageProvider {
  name: string;
  /** Whether this provider can produce a true transparent (alpha) background. */
  supportsTransparency: boolean;
  generate(req: ProviderRequest): Promise<ProviderResult>;
}
