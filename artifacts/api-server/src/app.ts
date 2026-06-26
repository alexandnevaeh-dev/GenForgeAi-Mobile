import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { registerHandler, recoverStalledJobs } from "./lib/jobQueue";
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
    if (event.event === "phase_start") {
      const phase = event.phase as number;
      await updateProgress({ phase, progress: PHASE_PROGRESS[phase - 1] ?? 0, label: PHASE_LABELS[phase] ?? "" });
    }
    if (event.event === "phase_complete") {
      const phase = event.phase as number;
      await updateProgress({ phase, progress: PHASE_PROGRESS[phase] ?? 100, label: PHASE_LABELS[phase] ?? "" });
    }
  });

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
