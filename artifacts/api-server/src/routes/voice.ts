import { Router, type IRouter, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { sessionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { textToSpeech } from "@workspace/integrations-openai-ai-server/audio";

const router: IRouter = Router();

async function getSession(token: string) {
  const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.token, token));
  return session ?? null;
}

router.post("/chat/speak", async (req: Request, res: Response) => {
  const { text, sessionToken } = req.body as { text: string; sessionToken: string };

  if (!text || !sessionToken) {
    res.status(400).json({ error: "invalid_request", message: "Text and session token required" });
    return;
  }

  const session = await getSession(sessionToken);
  if (!session) {
    res.status(401).json({ error: "unauthorized", message: "Invalid session" });
    return;
  }

  if (text.length > 4000) {
    res.status(400).json({ error: "too_long", message: "Text too long to speak" });
    return;
  }

  const audioBuffer = await textToSpeech(text, "nova", "mp3");
  const base64 = audioBuffer.toString("base64");

  res.json({ audio: base64, format: "mp3" });
});

export default router;
