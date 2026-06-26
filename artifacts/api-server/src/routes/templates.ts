import { db } from "@workspace/db";
import { projects, templates } from "@workspace/db/schema";
import { and, asc, eq, ilike, or, sql } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import { enqueueJob } from "../lib/jobQueue";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

// ── GET /templates — browse templates (public) ────────────────────────────
router.get("/templates", async (req, res) => {
  const { category, genre, search, premium } = req.query as Record<string, string>;

  const rows = await db
    .select()
    .from(templates)
    .where(
      and(
        eq(templates.isActive, true),
        category && category !== "all" ? eq(templates.category, category) : undefined,
        genre ? eq(templates.genre, genre) : undefined,
        premium === "true" ? eq(templates.isPremium, true) : undefined,
        premium === "false" ? eq(templates.isPremium, false) : undefined,
        search
          ? or(
              ilike(templates.title, `%${search}%`),
              ilike(templates.description, `%${search}%`),
              sql`${templates.tags}::text ilike ${"%" + search + "%"}`
            )
          : undefined
      )
    )
    .orderBy(asc(templates.isPremium), asc(templates.createdAt))
    .limit(50);

  res.json({ templates: rows });
});

// ── GET /templates/:id — get a single template ───────────────────────────
router.get("/templates/:id", async (req, res) => {
  const id = req.params["id"] as string;
  const [tpl] = await db.select().from(templates).where(eq(templates.id, id)).limit(1);
  if (!tpl) {
    res.status(404).json({ error: "Template not found" });
    return;
  }
  res.json({ template: tpl });
});

// ── POST /templates/:id/use — create a project from a template ───────────
router.post("/templates/:id/use", requireAuth, async (req, res) => {
  const templateId = req.params["id"] as string;
  const userId = req.user!.sub;

  const [tpl] = await db
    .select()
    .from(templates)
    .where(and(eq(templates.id, templateId), eq(templates.isActive, true)))
    .limit(1);

  if (!tpl) {
    res.status(404).json({ error: "Template not found" });
    return;
  }

  const bodySchema = z.object({ customPrompt: z.string().optional() });
  const body = bodySchema.safeParse(req.body);
  const customPrompt = body.success ? body.data.customPrompt : undefined;

  const prompt = customPrompt ?? tpl.promptHint;

  const [project] = await db
    .insert(projects)
    .values({
      ownerId: userId,
      title: tpl.title,
      description: prompt,
      genre: tpl.genre,
      artStyle: tpl.artStyle,
      status: "planning",
      progress: 0,
      tags: tpl.tags,
    })
    .returning();

  const jobId = await enqueueJob({
    ownerId: userId,
    projectId: project.id,
    type: "generate",
    label: `Generate: ${tpl.title}`,
    inputData: {
      projectId: project.id,
      ownerId: userId,
      params: { prompt, genre: tpl.genre, artStyle: tpl.artStyle },
    },
  });

  await db
    .update(templates)
    .set({ usageCount: sql`${templates.usageCount} + 1` })
    .where(eq(templates.id, templateId));

  res.status(201).json({ project, jobId });
});

export default router;
