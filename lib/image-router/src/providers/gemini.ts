import { Buffer } from "node:buffer";
import { Modality } from "@google/genai";
import type { ImageAspect, ImageProvider, ProviderRequest, ProviderResult } from "./types";

const ASPECT_RATIO: Record<ImageAspect, string> = {
  square: "1:1",
  portrait: "2:3",
  landscape: "3:2",
};

interface InlineDataPart {
  inlineData?: { data?: string; mimeType?: string };
}

/** Whether the Gemini integration env vars are present. */
function geminiConfigured(): boolean {
  return Boolean(
    process.env["AI_INTEGRATIONS_GEMINI_BASE_URL"] &&
    process.env["AI_INTEGRATIONS_GEMINI_API_KEY"]
  );
}

/** Gemini native image adapter (nano banana / nano banana pro). */
export const geminiProvider: ImageProvider = {
  name: "gemini",
  supportsTransparency: true,
  async generate(req: ProviderRequest): Promise<ProviderResult> {
    // Lazily import the integration client. Its module throws at import time if
    // the Gemini env vars are missing, so we guard first and only import when
    // configured — a missing Gemini config then degrades to provider failover
    // instead of crashing the server at startup.
    if (!geminiConfigured()) {
      throw new Error(
        "Gemini integration not configured (AI_INTEGRATIONS_GEMINI_* env vars missing)"
      );
    }
    const { ai } = await import("@workspace/integrations-gemini-ai");
    const model = req.model || "gemini-2.5-flash-image";
    let prompt = `${req.prompt}\n\nAspect ratio: ${ASPECT_RATIO[req.aspect]}.`;
    if (req.transparent) {
      prompt +=
        " Render on a fully transparent background (PNG with alpha channel), no backdrop, no scenery, subject only.";
    }
    const response = await ai.models.generateContent({
      model,
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: { responseModalities: [Modality.TEXT, Modality.IMAGE] },
    });
    const parts = response.candidates?.[0]?.content?.parts as InlineDataPart[] | undefined;
    const imagePart = parts?.find((part) => part.inlineData?.data);
    const data = imagePart?.inlineData?.data;
    if (!data) {
      throw new Error("Gemini returned no image data");
    }
    return {
      buffer: Buffer.from(data, "base64"),
      mimeType: imagePart?.inlineData?.mimeType ?? "image/png",
      model,
    };
  },
};
