/**
 * POST /api/projects/:id/chat
 *
 * Project-aware AI chat. Injects the project's blueprint, agent memories,
 * and asset summary into the system prompt so the AI knows the game.
 * Streams SSE deltas back to the client.
 */

import { streamTask } from "@workspace/ai-router";
import { db } from "@workspace/db";
import { assets, projects } from "@workspace/db/schema";
import { and, count, eq } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/requireAuth";
import { buildMemoryContext, getProjectMemory } from "../lib/agentMemory";

const router = Router();

const chatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().max(4000),
      })
    )
    .min(1)
    .max(50),
});

function buildSystemPrompt(
  project: {
    title: string;
    genre: string;
    artStyle: string;
    description: string | null;
    storyData: Record<string, unknown> | null;
    worldData: Record<string, unknown> | null;
    characterData: Record<string, unknown> | null;
    combatData: Record<string, unknown> | null;
    progress: number | null;
    status: string;
  },
  memoryContext: string,
  assetCount: number
): string {
  const dataBlocks: string[] = [];

  if (project.storyData && Object.keys(project.storyData).length > 0) {
    const entries = Object.entries(project.storyData)
      .filter(([, v]) => v && typeof v === "string" && v.length < 300)
      .map(([k, v]) => `  ${k}: ${v}`)
      .slice(0, 12);
    if (entries.length > 0) dataBlocks.push(`Story/Foundation:\n${entries.join("\n")}`);
  }

  if (project.worldData && Object.keys(project.worldData).length > 0) {
    const entries = Object.entries(project.worldData)
      .filter(([, v]) => v && typeof v === "string" && v.length < 300)
      .map(([k, v]) => `  ${k}: ${v}`)
      .slice(0, 10);
    if (entries.length > 0) dataBlocks.push(`World:\n${entries.join("\n")}`);
  }

  if (project.characterData && Object.keys(project.characterData).length > 0) {
    const entries = Object.entries(project.characterData)
      .filter(([, v]) => v && typeof v === "string" && v.length < 300)
      .map(([k, v]) => `  ${k}: ${v}`)
      .slice(0, 10);
    if (entries.length > 0) dataBlocks.push(`Characters:\n${entries.join("\n")}`);
  }

  if (project.combatData && Object.keys(project.combatData).length > 0) {
    const entries = Object.entries(project.combatData)
      .filter(([, v]) => v && typeof v === "string" && v.length < 300)
      .map(([k, v]) => `  ${k}: ${v}`)
      .slice(0, 10);
    if (entries.length > 0) dataBlocks.push(`Combat/Balance:\n${entries.join("\n")}`);
  }

  const projectSummary = [
    `Title: ${project.title}`,
    `Genre: ${project.genre}`,
    `Art Style: ${project.artStyle}`,
    project.description ? `Description: ${project.description}` : null,
    `Status: ${project.status} (${project.progress ?? 0}% complete)`,
    assetCount > 0 ? `Generated assets: ${assetCount}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const projectContext = [projectSummary, ...dataBlocks].join("\n\n");

  return `You are the dedicated Game Director AI for this specific game project. You know every detail about this game and help the developer refine, expand, and improve it.

YOUR PROJECT:
${projectContext}
${memoryContext}

YOUR ROLE:
- Answer questions about THIS specific game — its story, world, characters, mechanics, balance
- Suggest improvements, expansions, or fixes grounded in what the AI agents already built
- Help the developer iterate on specific aspects (e.g. "make the combat harder", "add a new area")
- Reference the established lore, characters, and systems when answering
- If asked about something not yet generated, suggest how it would fit with what exists

RULES:
- Always ground your answers in the actual project data above
- Be specific and concrete — name actual characters, locations, mechanics from the project
- Keep responses focused and actionable, using short paragraphs
- Never use emojis
- If the project has no generated data yet, encourage the user to run a generation first`;
}

router.post("/projects/:id/chat", requireAuth, async (req, res) => {
  const projectId = req.params["id"] as string;
  const userId = req.user!.sub;

  const result = chatSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: "Validation failed" });
    return;
  }

  // Load project (must belong to caller)
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.ownerId, userId)))
    .limit(1);

  if (!project) {
    res.status(404).json({ error: "Project not found" });
    return;
  }

  // Load memories and asset count in parallel
  const [memories, [assetRow]] = await Promise.all([
    getProjectMemory(projectId),
    db
      .select({ total: count() })
      .from(assets)
      .where(eq(assets.projectId, projectId)),
  ]);

  const memoryContext = buildMemoryContext(memories);
  const assetCount = assetRow?.total ?? 0;
  const systemPrompt = buildSystemPrompt(project, memoryContext, assetCount);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    await streamTask(
      "chat",
      [
        { role: "system", content: systemPrompt },
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
