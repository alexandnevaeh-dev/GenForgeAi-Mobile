import { Buffer } from "node:buffer";
import type OpenAI from "openai";
import { openai } from "@workspace/integrations-openai-ai-server/image";
import type { ImageAspect, ImageProvider, ProviderRequest, ProviderResult } from "./types";

const SIZE: Record<ImageAspect, "1024x1024" | "1024x1536" | "1536x1024"> = {
  square: "1024x1024",
  portrait: "1024x1536",
  landscape: "1536x1024",
};

/** OpenAI gpt-image-1 adapter. Supports native transparent backgrounds. */
export const openaiProvider: ImageProvider = {
  name: "openai",
  supportsTransparency: true,
  async generate(req: ProviderRequest): Promise<ProviderResult> {
    const model = req.model || "gpt-image-1";
    const params: OpenAI.Images.ImageGenerateParams = {
      model,
      prompt: req.prompt,
      size: SIZE[req.aspect],
    };
    if (req.transparent) {
      params.background = "transparent";
    }
    const response = await openai.images.generate(params);
    const b64 = response.data?.[0]?.b64_json ?? "";
    if (!b64) {
      throw new Error("OpenAI returned no image data");
    }
    return { buffer: Buffer.from(b64, "base64"), mimeType: "image/png", model };
  },
};
