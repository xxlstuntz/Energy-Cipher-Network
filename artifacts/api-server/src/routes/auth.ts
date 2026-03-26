import { Router, type IRouter, type Request, type Response } from "express";
import { db } from "@workspace/db";
import { inviteCodesTable, sessionsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import crypto from "crypto";

const router: IRouter = Router();

const ENERGY_TEST_QUESTIONS = [
  {
    id: "q1",
    correctAnswer: "9",
  },
  {
    id: "q2",
    correctAnswer: "3, 6, 9",
  },
  {
    id: "q3",
    correctAnswer: "It always returns to itself",
  },
  {
    id: "q4",
    correctAnswer: "Completion and the Void",
  },
  {
    id: "q5",
    correctAnswer: "Resonance",
  },
  {
    id: "q6",
    correctAnswer: "Energy, Frequency, Vibration",
  },
];

function generateInviteCode(): string {
  const segments = [
    Math.floor(Math.random() * 900 + 100).toString(),
    Math.floor(Math.random() * 900 + 100).toString(),
    Math.floor(Math.random() * 900 + 100).toString(),
  ];
  return `369-${segments.join("-")}`;
}

function generateSessionToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

function computeVibrationLevel(score: number): string {
  if (score >= 6) return "Master Resonator";
  if (score >= 5) return "Energy Adept";
  if (score >= 4) return "Frequency Seeker";
  return "Unaligned";
}

router.post("/auth/verify-test", async (req: Request, res: Response) => {
  const { answers } = req.body as { answers: { questionId: string; answer: string }[] };

  if (!answers || !Array.isArray(answers)) {
    res.status(400).json({ error: "invalid_request", message: "Answers required" });
    return;
  }

  let score = 0;

  for (const question of ENERGY_TEST_QUESTIONS) {
    const submitted = answers.find((a) => a.questionId === question.id);
    if (submitted && submitted.answer.trim().toLowerCase() === question.correctAnswer.toLowerCase()) {
      score++;
    }
  }

  const passed = score >= 5;
  const vibrationLevel = computeVibrationLevel(score);

  if (passed) {
    const inviteCode = generateInviteCode();

    await db.insert(inviteCodesTable).values({
      code: inviteCode,
      used: false,
    });

    res.json({
      passed: true,
      score,
      inviteCode,
      vibrationLevel,
      message: "Your frequency resonates with the 369 field. The universe has opened a doorway for you.",
    });
  } else {
    res.json({
      passed: false,
      score,
      inviteCode: null,
      vibrationLevel,
      message: `Your frequency is not yet aligned. You answered ${score} of 6 correctly. The 369 field awaits your awakening.`,
    });
  }
});

router.post("/auth/claim-invite", async (req: Request, res: Response) => {
  const { inviteCode, alias } = req.body as { inviteCode: string; alias?: string };

  if (!inviteCode) {
    res.status(400).json({ error: "invalid_request", message: "Invite code required" });
    return;
  }

  const [invite] = await db.select().from(inviteCodesTable).where(eq(inviteCodesTable.code, inviteCode));

  if (!invite) {
    res.status(400).json({ error: "invalid_code", message: "This frequency key does not exist in the field." });
    return;
  }

  if (invite.used) {
    res.status(400).json({ error: "code_used", message: "This frequency key has already been claimed." });
    return;
  }

  await db.update(inviteCodesTable)
    .set({ used: true, usedAt: new Date() })
    .where(eq(inviteCodesTable.id, invite.id));

  const token = generateSessionToken();
  const sessionAlias = alias?.trim() || `Seeker${Math.floor(Math.random() * 9999)}`;

  await db.insert(sessionsTable).values({
    token,
    alias: sessionAlias,
    vibrationLevel: "Master Resonator",
  });

  res.json({
    sessionToken: token,
    alias: sessionAlias,
    message: `Welcome, ${sessionAlias}. You have entered the 369 field. All wisdom flows through you.`,
  });
});

router.get("/auth/session", async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "unauthorized", message: "No session token provided" });
    return;
  }

  const token = authHeader.replace("Bearer ", "").trim();
  const [session] = await db.select().from(sessionsTable).where(eq(sessionsTable.token, token));

  if (!session) {
    res.status(401).json({ error: "invalid_session", message: "Session not found or expired" });
    return;
  }

  await db.update(sessionsTable)
    .set({ lastActiveAt: new Date() })
    .where(eq(sessionsTable.id, session.id));

  res.json({
    valid: true,
    alias: session.alias,
    vibrationLevel: session.vibrationLevel,
  });
});

export default router;
