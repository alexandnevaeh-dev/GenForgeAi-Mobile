import { db } from "@workspace/db";
import { refreshTokens, users } from "@workspace/db/schema";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../lib/jwt";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().min(3).max(32).regex(/^[a-zA-Z0-9_]+$/),
  displayName: z.string().min(1).max(64),
  password: z.string().min(8).max(128),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

router.post("/auth/register", async (req, res) => {
  const result = registerSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: "Validation failed", details: result.error.issues });
    return;
  }
  const { email, username, displayName, password } = result.data;

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (existing) {
    res.status(409).json({ error: "Email already in use" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const [user] = await db
    .insert(users)
    .values({ email, username, displayName, passwordHash })
    .returning();

  const accessToken = signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
    tier: user.subscriptionTier,
  });
  const refreshToken = signRefreshToken({ sub: user.id });

  await db.insert(refreshTokens).values({
    userId: user.id,
    token: refreshToken,
    deviceInfo: req.headers["user-agent"] ?? null,
    ipAddress: req.ip ?? null,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  res.status(201).json({
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      role: user.role,
      subscriptionTier: user.subscriptionTier,
    },
  });
});

router.post("/auth/login", async (req, res) => {
  const result = loginSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: "Validation failed" });
    return;
  }
  const { email, password } = result.data;

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user || !user.passwordHash) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid email or password" });
    return;
  }

  await db
    .update(users)
    .set({ lastLoginAt: new Date() })
    .where(eq(users.id, user.id));

  const accessToken = signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
    tier: user.subscriptionTier,
  });
  const refreshToken = signRefreshToken({ sub: user.id });

  await db.insert(refreshTokens).values({
    userId: user.id,
    token: refreshToken,
    deviceInfo: req.headers["user-agent"] ?? null,
    ipAddress: req.ip ?? null,
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  });

  res.json({
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      displayName: user.displayName,
      avatar: user.avatar,
      role: user.role,
      subscriptionTier: user.subscriptionTier,
      aiCreditsUsed: user.aiCreditsUsed,
      aiCreditsLimit: user.aiCreditsLimit,
      totalProjects: user.totalProjects,
      totalGenerations: user.totalGenerations,
    },
  });
});

router.post("/auth/refresh", async (req, res) => {
  const { refreshToken: token } = req.body as { refreshToken?: string };
  if (!token) {
    res.status(400).json({ error: "refreshToken required" });
    return;
  }

  let payload: { sub: string };
  try {
    payload = verifyRefreshToken(token);
  } catch {
    res.status(401).json({ error: "Invalid or expired refresh token" });
    return;
  }

  const [stored] = await db
    .select()
    .from(refreshTokens)
    .where(eq(refreshTokens.token, token))
    .limit(1);

  if (!stored || stored.revokedAt) {
    res.status(401).json({ error: "Refresh token revoked or not found" });
    return;
  }

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, payload.sub))
    .limit(1);

  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  const newAccessToken = signAccessToken({
    sub: user.id,
    email: user.email,
    role: user.role,
    tier: user.subscriptionTier,
  });

  res.json({ accessToken: newAccessToken });
});

router.post("/auth/logout", requireAuth, async (req, res) => {
  const { refreshToken: token } = req.body as { refreshToken?: string };
  if (token) {
    await db
      .update(refreshTokens)
      .set({ revokedAt: new Date() })
      .where(eq(refreshTokens.token, token));
  }
  res.json({ ok: true });
});

router.get("/auth/me", requireAuth, async (req, res) => {
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

export default router;
