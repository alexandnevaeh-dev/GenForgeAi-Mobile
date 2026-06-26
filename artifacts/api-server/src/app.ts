import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { registerHandler, recoverStalledJobs, appendLog } from "./lib/jobQueue";
import { runGeneration, type GenerateParams } from "./lib/generator";
import { seedTemplates } from "./lib/seedTemplates";

// ── Register job handlers ────────────────────────────────────────────────────
registerHandler("generate", async (jobId, inputData, updateProgress) => {
  const { projectId, ownerId, params } = inputData as {
    projectId: string;
    ownerId: string;
    params: GenerateParams;
  };

  const PHASE_PROGRESS: Record<number, number> = { 1: 16, 2: 33, 3: 50, 4: 66, 5: 83, 6: 100 };
  const PHASE_LABELS: Record<number, string> = {
    1: "Foundation",
    2: "World & Story",
    3: "Characters",
    4: "Image Generation",
    5: "QA & Balance",
    6: "Packaging",
  };

  await runGeneration(projectId, ownerId, params, async (event) => {
    if (event.event === "memory_loaded") {
      const count = event.count as number;
      await appendLog(jobId, count > 0
        ? `📚 Loaded ${count} memory entries from previous run`
        : "🧠 Starting fresh — no prior memories found");
    }
    if (event.event === "phase_start") {
      const phase = event.phase as number;
      const label = PHASE_LABELS[phase] ?? "Processing";
      await updateProgress({ phase, progress: PHASE_PROGRESS[phase - 1] ?? 0, label });
      const PHASE_AGENT_NAMES: Record<number, string> = {
        1: "World Architect · Story Architect · Character Designer",
        2: "Enemy Designer · Boss Designer · Combat Designer · Ability Designer",
        3: "Quest Designer · Environment Designer · Dungeon Designer · Puzzle Designer",
        4: "Progression Designer · Economy Designer · Loot Designer · Crafting Designer",
        5: "Pixel Art Designer · Animation Designer · UI Designer · Audio Composer · Sound Designer",
        6: "QA Agent · Performance Optimizer · Documentation Agent",
      };
      await appendLog(jobId, `▶ Phase ${phase}: ${label}`);
      await appendLog(jobId, `🤖 Agents active: ${PHASE_AGENT_NAMES[phase] ?? "AI Pipeline"}`);
    }
    if (event.event === "phase_model") {
      const model = event.model as string;
      await appendLog(jobId, `🔀 Model Router selected: ${model}`);
    }
    if (event.event === "asset_generating") {
      await appendLog(jobId, `🎨 ${String(event.message ?? "Generating assets…")}`);
    }
    if (event.event === "asset_generated") {
      const name = event.name as string | undefined;
      await appendLog(jobId, `✅ Asset ready: ${name ?? "image"}`);
    }
    if (event.event === "phase_complete") {
      const phase = event.phase as number;
      const label = PHASE_LABELS[phase] ?? "Phase";
      await updateProgress({ phase, progress: PHASE_PROGRESS[phase] ?? 100, label });
      await appendLog(jobId, `✔ Phase ${phase} complete — ${label}`);
    }
  });
  await appendLog(jobId, "🏁 All phases complete. Project packaged and ready.");

  return { projectId, completedAt: new Date().toISOString() };
});

// ── Recover stalled jobs from previous process ───────────────────────────────
void recoverStalledJobs();

// ── Seed reference data ───────────────────────────────────────────────────────
void seedTemplates();

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

export default app;
