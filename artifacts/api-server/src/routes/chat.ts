import { streamTask } from "@workspace/ai-router";
import { Router } from "express";
import { z } from "zod";
import { optionalAuth } from "../middleware/requireAuth";

const router = Router();

const SYSTEM_PROMPT = `You are the Master Game Director for GenForgeAI — an AI that acts as an autonomous game development team.

Your role:
- Understand the user's game vision through conversation
- Break their idea into concrete game systems (story, art, combat, levels, audio, etc.)
- Suggest genres, art styles, mechanics, and features
- Guide them toward creating their dream game
- Be encouraging, creative, and specific

When a user describes a game idea, respond with enthusiasm and specific details about:
- The core gameplay loop
- Art style recommendations
- Story/world elements
- Technical approach
- What makes their game unique

Keep responses concise but inspiring. Use short paragraphs. Never use emojis.`;

const chatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(4000),
      })
    )
    .max(50),
});

router.post("/chat", optionalAuth, async (req, res) => {
  const result = chatSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: "Validation failed" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    await streamTask(
      "chat",
      [
        { role: "system", content: SYSTEM_PROMPT },
        ...result.data.messages,
      ],
      (event) => {
        res.write(`data: ${JSON.stringify(event)}\n\n`);
      }
    );
    res.end();
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Generation failed";
    res.write(`data: ${JSON.stringify({ error: msg })}\n\n`);
    res.end();
  }
});

export default router;
