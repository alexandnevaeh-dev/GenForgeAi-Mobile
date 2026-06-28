import { db } from "@workspace/db";
import { projects } from "@workspace/db/schema";
import { and, eq } from "drizzle-orm";
import { Router } from "express";
import { routeTask } from "@workspace/ai-router";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

type PlayStyle =
  | "beginner"
  | "casual"
  | "explorer"
  | "completionist"
  | "speedrunner"
  | "competitive"
  | "aggressive"
  | "defensive"
  | "accessibility";

type Difficulty = "easy" | "normal" | "hard" | "custom";

interface GateResult {
  id: string;
  label: string;
  score: number;
  result: "pass" | "warning" | "fail";
  notes: string;
}

interface Bug {
  type: string;
  severity: "critical" | "high" | "medium" | "low";
  description: string;
  steps: string[];
  autoFixable: boolean;
}

interface QAReport {
  overallScore: number;
  grade: "A" | "B" | "C" | "D" | "F";
  gates: GateResult[];
  bugs: Bug[];
  performance: {
    profile: string;
    cpuScore: number;
    gpuScore: number;
    memScore: number;
    estimatedFPS: number;
    loadTimeMs: number;
    suggestions: string[];
  };
  accessibility: {
    score: number;
    issues: Array<{ area: string; note: string; severity: string }>;
  };
  buildReady: boolean;
  generatedAt: string;
}

function parseJson<T>(raw: string): T | null {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try { return JSON.parse(raw.slice(start, end + 1)) as T; } catch { return null; }
}

/* ── POST /api/projects/:id/qa/run ─────────────────────────── */
router.post("/projects/:id/qa/run", requireAuth, async (req, res) => {
  const projectId = req.params["id"] as string;
  const ownerId   = req.user!.sub;

  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.ownerId, ownerId)))
    .limit(1);

  if (!project) { res.status(404).json({ error: "Project not found" }); return; }

  const title = project.title;
  const genre = project.genre ?? "Action";
  const story = (project.storyData ?? {}) as Record<string, unknown>;
  const chars  = (project.characterData ?? {}) as Record<string, unknown>;

  const systemPrompt = `You are an expert game QA director. Analyze this game project and return ONLY valid JSON matching exactly the schema below — no markdown, no explanation.

Schema:
{
  "overallScore": number 0-100,
  "grade": "A"|"B"|"C"|"D"|"F",
  "gates": [
    { "id": string, "label": string, "score": number 0-100, "result": "pass"|"warning"|"fail", "notes": string }
  ],
  "bugs": [
    { "type": string, "severity": "critical"|"high"|"medium"|"low", "description": string, "steps": string[], "autoFixable": boolean }
  ],
  "performance": {
    "profile": "mobile"|"desktop"|"web",
    "cpuScore": number 0-100,
    "gpuScore": number 0-100,
    "memScore": number 0-100,
    "estimatedFPS": number,
    "loadTimeMs": number,
    "suggestions": string[]
  },
  "accessibility": {
    "score": number 0-100,
    "issues": [{ "area": string, "note": string, "severity": "critical"|"warning"|"info" }]
  },
  "buildReady": boolean,
  "generatedAt": string
}

Gates to evaluate (use exactly these ids): narrative, balance, assets, ui, performance, accessibility, export, validation`;

  const userPrompt = `Project: "${title}"
Genre: ${genre}
Progress: ${project.progress}%
Tagline: ${String(story.tagline ?? "")}
Core Loop: ${String(story.coreLoop ?? "")}
Protagonist: ${String((chars.protagonist as Record<string,unknown>)?.name ?? "Hero")}

Run a comprehensive QA analysis. Be realistic — find 2-4 bugs, give accessibility/performance feedback.`;

  try {
    const result = await routeTask("balance", [
      { role: "system", content: systemPrompt },
      { role: "user",   content: userPrompt },
    ]);
    const report = parseJson<QAReport>(result.content);
    if (!report) throw new Error("parse failed");
    report.generatedAt = new Date().toISOString();
    res.json(report);
  } catch (err) {
    req.log.error({ err }, "QA run failed");
    res.status(502).json({ error: "QA analysis is temporarily unavailable — the AI service didn't return a valid report. Please try again." });
  }
});

/* ── POST /api/projects/:id/qa/balance ─────────────────────── */
router.post("/projects/:id/qa/balance", requireAuth, async (req, res) => {
  const projectId  = req.params["id"] as string;
  const ownerId    = req.user!.sub;
  const difficulty = (req.body?.difficulty ?? "normal") as Difficulty;

  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.ownerId, ownerId)))
    .limit(1);

  if (!project) { res.status(404).json({ error: "Project not found" }); return; }

  const genre = project.genre ?? "Action";
  const title = project.title;

  const systemPrompt = `You are a game balance designer. Return ONLY valid JSON:
{
  "difficulty": string,
  "enemyDifficulty": number 0-100,
  "rewardPacing": number 0-100,
  "economyBalance": number 0-100,
  "progressionCurve": number 0-100,
  "puzzleDifficulty": number 0-100,
  "itemDropRate": number 0-100,
  "bossEncounterScore": number 0-100,
  "recommendations": string[],
  "tuningChanges": [{ "stat": string, "current": number, "suggested": number, "reason": string }]
}`;

  const userPrompt = `Game: "${title}" (${genre})
Target difficulty: ${difficulty}
Tune balance metrics for ${difficulty} play. Provide 4-6 specific tuning changes with numbers.`;

  try {
    const result = await routeTask("balance", [
      { role: "system", content: systemPrompt },
      { role: "user",   content: userPrompt },
    ]);
    const report = parseJson<object>(result.content);
    if (!report) throw new Error("parse failed");
    res.json(report);
  } catch (err) {
    req.log.error({ err }, "QA balance failed");
    res.status(502).json({ error: "Balance tuning is temporarily unavailable — the AI service didn't return valid data. Please try again." });
  }
});

/* ── POST /api/projects/:id/qa/playtest ────────────────────── */
router.post("/projects/:id/qa/playtest", requireAuth, async (req, res) => {
  const projectId = req.params["id"] as string;
  const ownerId   = req.user!.sub;
  const playStyle = (req.body?.playStyle ?? "casual") as PlayStyle;

  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.ownerId, ownerId)))
    .limit(1);

  if (!project) { res.status(404).json({ error: "Project not found" }); return; }

  const genre = project.genre ?? "Action";
  const title = project.title;

  const systemPrompt = `You are an AI playtester simulating a specific player archetype. Return ONLY valid JSON:
{
  "playStyle": string,
  "sessionLength": string,
  "progressReached": number 0-100,
  "enjoymentScore": number 0-100,
  "issuesFound": [{ "area": string, "severity": "critical"|"warning"|"info", "note": string }],
  "strengths": string[],
  "improvements": string[],
  "summary": string
}`;

  const userPrompt = `Simulate a "${playStyle}" player archetype playtesting:
Game: "${title}" (${genre})
Progress built: ${project.progress}%
Find 2-4 real issues this play style would encounter. Include strengths and actionable improvements.`;

  try {
    const result = await routeTask("chat", [
      { role: "system", content: systemPrompt },
      { role: "user",   content: userPrompt },
    ]);
    const report = parseJson<object>(result.content);
    if (!report) throw new Error("parse failed");
    res.json(report);
  } catch (err) {
    req.log.error({ err }, "QA playtest failed");
    res.status(502).json({ error: "Playtest simulation is temporarily unavailable — the AI service didn't return valid data. Please try again." });
  }
});

export default router;
