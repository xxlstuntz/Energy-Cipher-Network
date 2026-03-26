import { Router, type IRouter, type Request, type Response } from "express";
import multer from "multer";
import { db } from "@workspace/db";
import { sessionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { textToSpeech, speechToText } from "@workspace/integrations-openai-ai-server/audio";

const router: IRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 25 * 1024 * 1024 } });

async function getSession(token: string) {
  const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.token, token));
  return session ?? null;
}

// ── Text-to-Speech ───────────────────────────────────────────────────────────
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

// ── Speech-to-Text ───────────────────────────────────────────────────────────
router.post("/chat/transcribe", upload.single("audio"), async (req: Request, res: Response) => {
  const sessionToken = req.body.sessionToken as string;

  if (!sessionToken) {
    res.status(400).json({ error: "invalid_request", message: "Session token required" });
    return;
  }

  const session = await getSession(sessionToken);
  if (!session) {
    res.status(401).json({ error: "unauthorized", message: "Invalid session" });
    return;
  }

  if (!req.file) {
    res.status(400).json({ error: "invalid_request", message: "Audio file required" });
    return;
  }

  const mimeType = req.file.mimetype;
  let format: "wav" | "mp3" | "webm" = "webm";
  if (mimeType.includes("wav")) format = "wav";
  else if (mimeType.includes("mp3") || mimeType.includes("mpeg")) format = "mp3";

  const transcript = await speechToText(req.file.buffer, format);

  res.json({ transcript });
});

export default router;
