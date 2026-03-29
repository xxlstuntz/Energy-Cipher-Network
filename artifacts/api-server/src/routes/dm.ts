import { Router, type IRouter, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { sessionsTable, directMessagesTable } from "@workspace/db";
import { eq, or, and, desc, sql } from "drizzle-orm";

const router: IRouter = Router();

async function getSession(token: string) {
  const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.token, token));
  return session ?? null;
}

function authFromHeader(req: Request): string | null {
  const h = req.headers.authorization;
  return h?.startsWith("Bearer ") ? h.replace("Bearer ", "").trim() : null;
}

// ── Get all DM conversations (inbox) ─────────────────────────────────────────
router.get("/dm/conversations", async (req: Request, res: Response) => {
  const token = authFromHeader(req);
  if (!token) { res.status(401).json({ error: "unauthorized" }); return; }
  const session = await getSession(token);
  if (!session) { res.status(401).json({ error: "unauthorized" }); return; }

  const myAlias = session.alias;

  const msgs = await db.select().from(directMessagesTable)
    .where(or(eq(directMessagesTable.fromAlias, myAlias), eq(directMessagesTable.toAlias, myAlias)))
    .orderBy(desc(directMessagesTable.createdAt));

  // Group by conversation partner
  const convos: Record<string, {
    partnerAlias: string;
    lastMessage: string;
    lastAt: string;
    unread: number;
    streak: number;
  }> = {};

  for (const msg of msgs) {
    const partner = msg.fromAlias === myAlias ? msg.toAlias : msg.fromAlias;
    if (!convos[partner]) {
      const unread = msg.toAlias === myAlias && !msg.viewed ? 1 : 0;
      convos[partner] = {
        partnerAlias: partner,
        lastMessage: msg.content.slice(0, 60) + (msg.content.length > 60 ? "…" : ""),
        lastAt: msg.createdAt.toISOString(),
        unread,
        streak: msg.streak,
      };
    } else if (msg.toAlias === myAlias && !msg.viewed) {
      convos[partner].unread++;
    }
  }

  res.json({ conversations: Object.values(convos) });
});

// ── Get DMs with a specific alias ─────────────────────────────────────────────
router.get("/dm/:alias", async (req: Request, res: Response) => {
  const token = authFromHeader(req);
  if (!token) { res.status(401).json({ error: "unauthorized" }); return; }
  const session = await getSession(token);
  if (!session) { res.status(401).json({ error: "unauthorized" }); return; }

  const myAlias = session.alias;
  const partnerAlias = req.params.alias;

  const messages = await db.select().from(directMessagesTable)
    .where(
      or(
        and(eq(directMessagesTable.fromAlias, myAlias), eq(directMessagesTable.toAlias, partnerAlias)),
        and(eq(directMessagesTable.fromAlias, partnerAlias), eq(directMessagesTable.toAlias, myAlias))
      )
    )
    .orderBy(directMessagesTable.createdAt);

  // Mark received messages as viewed
  await db.update(directMessagesTable)
    .set({ viewed: true, viewedAt: new Date() })
    .where(
      and(eq(directMessagesTable.toAlias, myAlias), eq(directMessagesTable.fromAlias, partnerAlias), eq(directMessagesTable.viewed, false))
    );

  res.json({
    messages: messages.map(m => ({
      id: m.id,
      fromAlias: m.fromAlias,
      toAlias: m.toAlias,
      content: m.content,
      viewed: m.viewed,
      viewedAt: m.viewedAt?.toISOString() ?? null,
      streak: m.streak,
      mine: m.fromAlias === myAlias,
      createdAt: m.createdAt.toISOString(),
    }))
  });
});

// ── Send a DM ─────────────────────────────────────────────────────────────────
router.post("/dm/:alias", async (req: Request, res: Response) => {
  const token = authFromHeader(req);
  if (!token) { res.status(401).json({ error: "unauthorized" }); return; }
  const session = await getSession(token);
  if (!session) { res.status(401).json({ error: "unauthorized" }); return; }

  const myAlias = session.alias;
  const partnerAlias = req.params.alias;

  if (myAlias === partnerAlias) {
    res.status(400).json({ error: "Cannot DM yourself" });
    return;
  }

  const { content } = req.body as { content: string };
  if (!content?.trim()) { res.status(400).json({ error: "Content required" }); return; }
  if (content.length > 1000) { res.status(400).json({ error: "Too long" }); return; }

  // Compute streak
  const [lastMsg] = await db.select().from(directMessagesTable)
    .where(
      or(
        and(eq(directMessagesTable.fromAlias, myAlias), eq(directMessagesTable.toAlias, partnerAlias)),
        and(eq(directMessagesTable.fromAlias, partnerAlias), eq(directMessagesTable.toAlias, myAlias))
      )
    )
    .orderBy(desc(directMessagesTable.createdAt))
    .limit(1);

  let streak = 1;
  if (lastMsg) {
    const lastDate = new Date(lastMsg.createdAt);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) streak = (lastMsg.streak || 1);
    else if (diffDays === 1) streak = (lastMsg.streak || 0) + 1;
    else streak = 1;
  }

  // Messages expire 24h after being sent (Snapchat-style)
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

  const [message] = await db.insert(directMessagesTable).values({
    fromAlias: myAlias,
    toAlias: partnerAlias,
    content: content.trim(),
    expiresAt,
    streak,
  }).returning();

  res.json({
    message: {
      id: message.id,
      fromAlias: message.fromAlias,
      toAlias: message.toAlias,
      content: message.content,
      viewed: false,
      streak: message.streak,
      mine: true,
      createdAt: message.createdAt.toISOString(),
    }
  });
});

// ── Cleanup expired DMs (can be called periodically) ─────────────────────────
router.delete("/dm/cleanup/expired", async (req: Request, res: Response) => {
  const token = authFromHeader(req);
  if (!token) { res.status(401).json({ error: "unauthorized" }); return; }

  await db.delete(directMessagesTable)
    .where(
      and(
        eq(directMessagesTable.viewed, true),
        sql`${directMessagesTable.viewedAt} < NOW() - INTERVAL '24 hours'`
      )
    );

  res.json({ success: true });
});

export default router;
