import { Router, type IRouter, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { sessionsTable, feedPostsTable, feedCommentsTable, amplifiesTable } from "@workspace/db";
import { eq, desc, and } from "drizzle-orm";

const router: IRouter = Router();

async function getSession(token: string) {
  const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.token, token));
  return session ?? null;
}

function authFromHeader(req: Request): string | null {
  const h = req.headers.authorization;
  return h?.startsWith("Bearer ") ? h.replace("Bearer ", "").trim() : null;
}

// ── Feed Posts ──────────────────────────────────────────────────────────────

router.get("/feed/posts", async (req: Request, res: Response) => {
  const token = authFromHeader(req);
  if (!token) { res.status(401).json({ error: "unauthorized" }); return; }
  const session = await getSession(token);
  if (!session) { res.status(401).json({ error: "unauthorized" }); return; }

  const category = (req.query.category as string) || undefined;
  const limit = Math.min(parseInt(req.query.limit as string) || 30, 50);

  const query = db.select().from(feedPostsTable).orderBy(desc(feedPostsTable.createdAt)).limit(limit);
  const posts = await query;

  const filtered = category ? posts.filter(p => p.category === category) : posts;

  res.json({ posts: filtered });
});

router.post("/feed/posts", async (req: Request, res: Response) => {
  const token = authFromHeader(req);
  if (!token) { res.status(401).json({ error: "unauthorized" }); return; }
  const session = await getSession(token);
  if (!session) { res.status(401).json({ error: "unauthorized" }); return; }

  const { content, category } = req.body as { content: string; category?: string };
  if (!content?.trim()) { res.status(400).json({ error: "Content required" }); return; }
  if (content.length > 1200) { res.status(400).json({ error: "Too long" }); return; }

  const validCategories = ["general", "insight", "feedback", "bug", "idea"];
  const cat = validCategories.includes(category ?? "") ? category! : "general";

  const [post] = await db.insert(feedPostsTable).values({
    sessionId: session.id,
    authorAlias: session.alias,
    vibrationLevel: session.vibrationLevel,
    content: content.trim(),
    category: cat,
  }).returning();

  res.json({ post });
});

// ── Amplify ─────────────────────────────────────────────────────────────────

router.post("/feed/posts/:id/amplify", async (req: Request, res: Response) => {
  const token = authFromHeader(req);
  if (!token) { res.status(401).json({ error: "unauthorized" }); return; }
  const session = await getSession(token);
  if (!session) { res.status(401).json({ error: "unauthorized" }); return; }

  const postId = parseInt(req.params.id);
  if (isNaN(postId)) { res.status(400).json({ error: "Invalid post id" }); return; }

  const [existing] = await db.select().from(amplifiesTable)
    .where(and(eq(amplifiesTable.postId, postId), eq(amplifiesTable.sessionId, session.id)));

  if (existing) {
    res.json({ amplified: false, message: "Already amplified" });
    return;
  }

  await db.insert(amplifiesTable).values({ postId, sessionId: session.id });

  const [post] = await db.select().from(feedPostsTable).where(eq(feedPostsTable.id, postId));
  if (!post) { res.status(404).json({ error: "Post not found" }); return; }

  const [updated] = await db.update(feedPostsTable)
    .set({ amplifies: post.amplifies + 1 })
    .where(eq(feedPostsTable.id, postId))
    .returning();

  res.json({ amplified: true, amplifies: updated.amplifies });
});

// ── Comments ─────────────────────────────────────────────────────────────────

router.get("/feed/posts/:id/comments", async (req: Request, res: Response) => {
  const token = authFromHeader(req);
  if (!token) { res.status(401).json({ error: "unauthorized" }); return; }
  const session = await getSession(token);
  if (!session) { res.status(401).json({ error: "unauthorized" }); return; }

  const postId = parseInt(req.params.id);
  if (isNaN(postId)) { res.status(400).json({ error: "Invalid post id" }); return; }

  const [post] = await db.select().from(feedPostsTable).where(eq(feedPostsTable.id, postId));
  if (!post) { res.status(404).json({ error: "Post not found" }); return; }

  const comments = await db.select().from(feedCommentsTable)
    .where(eq(feedCommentsTable.postId, postId))
    .orderBy(feedCommentsTable.createdAt);

  res.json({ post, comments });
});

router.post("/feed/posts/:id/comments", async (req: Request, res: Response) => {
  const token = authFromHeader(req);
  if (!token) { res.status(401).json({ error: "unauthorized" }); return; }
  const session = await getSession(token);
  if (!session) { res.status(401).json({ error: "unauthorized" }); return; }

  const postId = parseInt(req.params.id);
  if (isNaN(postId)) { res.status(400).json({ error: "Invalid post id" }); return; }

  const { content } = req.body as { content: string };
  if (!content?.trim()) { res.status(400).json({ error: "Content required" }); return; }

  const [comment] = await db.insert(feedCommentsTable).values({
    postId,
    sessionId: session.id,
    authorAlias: session.alias,
    content: content.trim(),
  }).returning();

  res.json({ comment });
});

export default router;
