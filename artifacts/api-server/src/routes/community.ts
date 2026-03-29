import { Router, type IRouter, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { sessionsTable, communityMessagesTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router: IRouter = Router();

async function getSession(token: string) {
  const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.token, token));
  return session ?? null;
}

function authFromHeader(req: Request): string | null {
  const h = req.headers.authorization;
  return h?.startsWith("Bearer ") ? h.replace("Bearer ", "").trim() : null;
}

// ── Get community messages (last 100) ────────────────────────────────────────
router.get("/community/messages", async (req: Request, res: Response) => {
  const token = authFromHeader(req);
  if (!token) { res.status(401).json({ error: "unauthorized" }); return; }
  const session = await getSession(token);
  if (!session) { res.status(401).json({ error: "unauthorized" }); return; }

  const since = req.query.since ? parseInt(req.query.since as string) : undefined;

  const messages = await db.select().from(communityMessagesTable)
    .orderBy(desc(communityMessagesTable.createdAt))
    .limit(100);

  res.json({ messages: messages.reverse() });
});

// ── Post community message ───────────────────────────────────────────────────
router.post("/community/messages", async (req: Request, res: Response) => {
  const token = authFromHeader(req);
  if (!token) { res.status(401).json({ error: "unauthorized" }); return; }
  const session = await getSession(token);
  if (!session) { res.status(401).json({ error: "unauthorized" }); return; }

  const { content } = req.body as { content: string };
  if (!content?.trim()) { res.status(400).json({ error: "Content required" }); return; }
  if (content.length > 500) { res.status(400).json({ error: "Too long" }); return; }

  const [message] = await db.insert(communityMessagesTable).values({
    sessionId: session.id,
    authorAlias: session.alias,
    vibrationLevel: session.vibrationLevel,
    content: content.trim(),
  }).returning();

  res.json({ message });
});

export default router;
