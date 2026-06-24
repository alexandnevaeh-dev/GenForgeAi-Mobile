import { db } from "@workspace/db";
import { users } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(64).optional(),
  username: z.string().min(3).max(32).regex(/^[a-zA-Z0-9_]+$/).optional(),
  bio: z.string().max(280).optional(),
  avatar: z.string().url().optional(),
  preferences: z.record(z.string(), z.unknown()).optional(),
  notificationSettings: z.record(z.string(), z.boolean()).optional(),
  privacySettings: z.record(z.string(), z.boolean()).optional(),
});

router.get("/users/me", requireAuth, async (req, res) => {
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, req.user!.sub))
    .limit(1);

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  const { passwordHash: _, ...safeUser } = user;
  res.json({ user: safeUser });
});

router.patch("/users/me", requireAuth, async (req, res) => {
  const result = updateProfileSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: "Validation failed", details: result.error.issues });
    return;
  }

  const [updated] = await db
    .update(users)
    .set({ ...result.data, updatedAt: new Date() })
    .where(eq(users.id, req.user!.sub))
    .returning();

  const { passwordHash: _, ...safeUser } = updated;
  res.json({ user: safeUser });
});

router.get("/users/me/stats", requireAuth, async (req, res) => {
  const [user] = await db
    .select({
      totalProjects: users.totalProjects,
      totalAssets: users.totalAssets,
      totalGenerations: users.totalGenerations,
      aiCreditsUsed: users.aiCreditsUsed,
      aiCreditsLimit: users.aiCreditsLimit,
      subscriptionTier: users.subscriptionTier,
    })
    .from(users)
    .where(eq(users.id, req.user!.sub))
    .limit(1);

  res.json({ stats: user });
});

export default router;
