import { db } from "@workspace/db";
import { communityPosts, communityLikes, users } from "@workspace/db/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import { Router } from "express";
import { z } from "zod";
import { requireAuth } from "../middleware/requireAuth";

const router = Router();

const createPostSchema = z.object({
  content: z.string().min(1).max(2000),
  type: z.enum(["prompt", "project", "tip", "achievement"]).default("tip"),
  projectId: z.string().uuid().optional(),
});

/* ── GET /api/community/posts ────────────────────────────────── */
router.get("/api/community/posts", async (req, res) => {
  const { type, limit = "20", offset = "0" } = req.query as Record<string, string>;

  const rows = await db
    .select({
      id:          communityPosts.id,
      content:     communityPosts.content,
      type:        communityPosts.type,
      projectId:   communityPosts.projectId,
      likes:       communityPosts.likes,
      comments:    communityPosts.comments,
      createdAt:   communityPosts.createdAt,
      authorId:    communityPosts.authorId,
      displayName: users.displayName,
      username:    users.username,
      avatar:      users.avatar,
    })
    .from(communityPosts)
    .innerJoin(users, eq(communityPosts.authorId, users.id))
    .where(type ? eq(communityPosts.type, type) : undefined)
    .orderBy(desc(communityPosts.createdAt))
    .limit(Math.min(Number(limit), 50))
    .offset(Number(offset));

  const total = await db
    .select({ count: sql<number>`count(*)` })
    .from(communityPosts)
    .then((r) => Number(r[0]?.count ?? 0));

  res.json({ posts: rows, total });
});

/* ── POST /api/community/posts ───────────────────────────────── */
router.post("/api/community/posts", requireAuth, async (req, res) => {
  const result = createPostSchema.safeParse(req.body);
  if (!result.success) {
    res.status(400).json({ error: "Validation failed", details: result.error.issues });
    return;
  }
  const { content, type, projectId } = result.data;
  const authorId = req.user!.sub;

  const [post] = await db
    .insert(communityPosts)
    .values({ authorId, content, type, projectId: projectId ?? null })
    .returning();

  const [author] = await db
    .select({ displayName: users.displayName, username: users.username, avatar: users.avatar })
    .from(users)
    .where(eq(users.id, authorId))
    .limit(1);

  res.status(201).json({ post: { ...post, ...author } });
});

/* ── POST /api/community/posts/:id/like ─────────────────────── */
router.post("/api/community/posts/:id/like", requireAuth, async (req, res) => {
  const postId = req.params["id"] as string;
  const userId = req.user!.sub;

  const [existing] = await db
    .select()
    .from(communityLikes)
    .where(and(eq(communityLikes.postId, postId), eq(communityLikes.userId, userId)))
    .limit(1);

  if (existing) {
    await db
      .delete(communityLikes)
      .where(and(eq(communityLikes.postId, postId), eq(communityLikes.userId, userId)));
    await db
      .update(communityPosts)
      .set({ likes: sql`${communityPosts.likes} - 1` })
      .where(eq(communityPosts.id, postId));
    res.json({ liked: false });
  } else {
    await db.insert(communityLikes).values({ postId, userId });
    await db
      .update(communityPosts)
      .set({ likes: sql`${communityPosts.likes} + 1` })
      .where(eq(communityPosts.id, postId));
    res.json({ liked: true });
  }
});

/* ── DELETE /api/community/posts/:id ────────────────────────── */
router.delete("/api/community/posts/:id", requireAuth, async (req, res) => {
  const postId  = req.params["id"] as string;
  const ownerId = req.user!.sub;

  const [post] = await db
    .select()
    .from(communityPosts)
    .where(and(eq(communityPosts.id, postId), eq(communityPosts.authorId, ownerId)))
    .limit(1);

  if (!post) { res.status(404).json({ error: "Post not found or not yours" }); return; }

  await db.delete(communityPosts).where(eq(communityPosts.id, postId));
  res.json({ deleted: true });
});

export default router;
