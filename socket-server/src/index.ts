import { PrismaPg } from "@prisma/adapter-pg";
import { Answer, Participant, PrismaClient, QuestionOption, QuizSession } from "@sundman/prisma";
import { createServer } from "http";
import express from "express";
import cors from "cors";
import { Server, type Socket } from "socket.io";
import { z } from "zod";

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});
const prisma = new PrismaClient({ adapter });
const PORT = Number(process.env.PORT ?? 3001);
const CLIENT_URL = process.env.CLIENT_URL ?? "http://localhost:3000";
const SOCKET_SECRET = process.env.SOCKET_SERVER_SECRET ?? "dev-secret";

const app = express();
app.use(cors({ origin: CLIENT_URL }));
app.get("/health", (_req, res) => res.json({ ok: true }));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: CLIENT_URL, methods: ["GET", "POST"] },
});

type RoomState = {
  sessionId: string;
  correctOptionId: string | null;
  revealTimer: NodeJS.Timeout | null;
};

const roomStates = new Map<string, RoomState>();

function calculatePoints(responseTimeMs: number, timeLimitMs: number): number {
  const remaining = Math.max(0, timeLimitMs - responseTimeMs);
  return Math.floor(1000 * (remaining / timeLimitMs));
}

async function buildLeaderboard(sessionId: string) {
  const participants: Participant[] = await prisma.participant.findMany({
    where: { sessionId },
    include: { company: true },
    orderBy: { totalScore: "desc" },
    take: 5,
  });

  return participants.map((p, i) => ({
    rank: i + 1,
    id: p.id,
    name: p.playerName,
    company: p.company.name,
    points: p.totalScore,
    initials: p.playerName
      .split(" ")
      .map((n: string) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2),
  }));
}

async function buildSessionState(sessionId: string, forAdmin = false) {
  const session: QuizSession | null = await prisma.quizSession.findUnique({
    where: { id: sessionId },
    include: {
      quiz: {
        include: {
          questions: {
            include: {
              question: {
                include: { options: { orderBy: { order: "asc" } } },
              },
            },
            orderBy: { order: "asc" },
          },
        },
      },
      participants: {
        include: { company: true },
        orderBy: { joinedAt: "asc" },
      },
    },
  });

  if (!session) return null;

  const room = roomStates.get(sessionId);
  const currentQQ =
    session.currentQuestionIndex >= 0
      ? session.quiz.questions[session.currentQuestionIndex]
      : null;

  const currentQuestion = currentQQ
    ? {
        id: currentQQ.question.id,
        quizQuestionId: currentQQ.id,
        order: currentQQ.order,
        textSv: currentQQ.question.textSv,
        textEn: currentQQ.question.textEn,
        type: currentQQ.question.type as "MULTIPLE_CHOICE" | "FREE_TEXT",
        timeLimitSec: currentQQ.timeLimitSec,
        options: currentQQ.question.options.map((o: QuestionOption) => ({
          id: o.id,
          letter: o.letter,
          labelSv: o.labelSv,
          labelEn: o.labelEn,
        })),
      }
    : null;

  // Players only learn the correct option after reveal. Admins see it live.
  let correctOptionId: string | null = room?.correctOptionId ?? null;
  if (
    currentQQ?.question.type === "MULTIPLE_CHOICE" &&
    (forAdmin || session.status === "QUESTION_REVEAL")
  ) {
    correctOptionId =
      currentQQ.question.options.find((o: QuestionOption) => o.isCorrect)?.id ??
      null;
  }

  return {
    sessionId: session.id,
    status: session.status,
    currentQuestionIndex: session.currentQuestionIndex,
    totalQuestions: session.quiz.questions.length,
    participantCount: session.participants.length,
    questionStartedAt: session.questionStartedAt?.toISOString() ?? null,
    questionEndsAt: session.questionEndsAt?.toISOString() ?? null,
    currentQuestion,
    correctOptionId,
    leaderboard: await buildLeaderboard(sessionId),
    participants: session.participants.map((p: Participant & { company: { name: string } }) => ({
      id: p.id,
      name: p.playerName,
      company: p.company.name,
      initials: p.playerName
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2),
    })),
    matchTitle: session.quiz.matchTitle,
    matchNumber: session.quiz.matchNumber,
    quizTitleSv: session.quiz.titleSv,
    quizTitleEn: session.quiz.titleEn,
  };
}

async function emitSessionState(sessionId: string) {
  const [playerState, adminState] = await Promise.all([
    buildSessionState(sessionId, false),
    buildSessionState(sessionId, true),
  ]);
  if (playerState) {
    io.to(`session:${sessionId}`).emit("session_state", playerState);
  }
  if (adminState) {
    io.to(`admin:${sessionId}`).emit("session_state", adminState);
  }
}

// Per question, only the best-scoring player per company earns company points.
// Individual player scores always accumulate fully.
async function updateLeaderboardScores(
  companyId: string,
  playerName: string,
  playerPoints: number,
  quizQuestionId: string,
) {
  const periods = await prisma.leaderboardPeriod.findMany({
    where: { isActive: true },
  });

  // Best score from this company on this question (including the new answer)
  const bestForCompany = await prisma.answer.aggregate({
    where: { quizQuestionId, participant: { companyId } },
    _max: { points: true },
  });
  const companyPoints = bestForCompany._max.points ?? 0;

  for (const period of periods) {
    // For company: we store a running total by recalculating from scratch
    // is expensive at scale but fine for ≤130 users. Simpler: just track the
    // per-question best and accumulate only the delta if needed.
    // Here we do a full upsert with the company's best score for this question.
    // To avoid double-counting we use a separate CompanyQuestionScore table
    // approach via raw upsert delta logic: see comment below.

    // Individual player score: always increment
    await prisma.playerScore.upsert({
      where: {
        playerName_companyId_periodId: {
          playerName,
          companyId,
          periodId: period.id,
        },
      },
      create: {
        playerName,
        companyId,
        periodId: period.id,
        points: playerPoints,
      },
      update: { points: { increment: playerPoints } },
    });

    // Company score: only the winner from each company contributes.
    // We track per-company-per-question best score and increment the company
    // total by the delta (newBest - prevBest) so re-scoring is idempotent.
    const key = `${companyId}:${quizQuestionId}:${period.id}`;
    const prev = companyQuestionBest.get(key) ?? 0;
    const delta = companyPoints - prev;
    if (delta > 0) {
      companyQuestionBest.set(key, companyPoints);
      await prisma.companyScore.upsert({
        where: { companyId_periodId: { companyId, periodId: period.id } },
        create: { companyId, periodId: period.id, points: delta },
        update: { points: { increment: delta } },
      });
    }
  }
}

// In-memory cache of best company score per question per period.
// Resets if socket server restarts (acceptable: sessions are ephemeral).
const companyQuestionBest = new Map<string, number>();

async function revealQuestion(sessionId: string) {
  const session = await prisma.quizSession.findUnique({
    where: { id: sessionId },
    include: {
      quiz: {
        include: {
          questions: {
            include: {
              question: { include: { options: true } },
            },
            orderBy: { order: "asc" },
          },
        },
      },
    },
  });
  if (!session || session.status !== "QUESTION_ACTIVE") return;

  const qq = session.quiz.questions[session.currentQuestionIndex];
  if (!qq) return;

  if (qq.question.type === "MULTIPLE_CHOICE") {
    const correctOption = qq.question.options.find((o: QuestionOption) => o.isCorrect);
    const room = roomStates.get(sessionId) ?? {
      sessionId,
      correctOptionId: null,
      revealTimer: null,
    };
    room.correctOptionId = correctOption?.id ?? null;
    roomStates.set(sessionId, room);

    const answers = await prisma.answer.findMany({
      where: { quizQuestionId: qq.id, sessionId },
      include: { participant: true },
    });

    const timeLimitMs = qq.timeLimitSec * 1000;

    for (const answer of answers) {
      const isCorrect = answer.optionId === correctOption?.id;
      const points = isCorrect
        ? calculatePoints(answer.responseTimeMs ?? timeLimitMs, timeLimitMs)
        : 0;

      await prisma.answer.update({
        where: { id: answer.id },
        data: { isCorrect, points },
      });

      if (points > 0) {
        await prisma.participant.update({
          where: { id: answer.participantId },
          data: { totalScore: { increment: points } },
        });
      }
    }

    // Update leaderboard scores after all answers are graded so we have the
    // full picture of who the best per-company player is for this question.
    const gradedAnswers = await prisma.answer.findMany({
      where: { quizQuestionId: qq.id, sessionId, points: { gt: 0 } },
      include: { participant: true },
    });
    for (const answer of gradedAnswers) {
      await updateLeaderboardScores(
        answer.participant.companyId,
        answer.participant.playerName,
        answer.points,
        qq.id,
      );
    }

    await prisma.quizSession.update({
      where: { id: sessionId },
      data: { status: "QUESTION_REVEAL" },
    });
  } else {
    await prisma.quizSession.update({
      where: { id: sessionId },
      data: { status: "FREE_TEXT_REVIEW" },
    });

    const submissions: Answer[] = await prisma.answer.findMany({
      where: { quizQuestionId: qq.id, sessionId },
      include: { participant: { include: { company: true } } },
    });

    io.to(`admin:${sessionId}`).emit(
      "free_text_submissions",
      submissions.map((s: Answer) => ({
        answerId: s.id,
        participantId: s.participantId,
        playerName: s.participant.playerName,
        companyName: s.participant.company.name,
        textAnswer: s.textAnswer ?? "",
      })),
    );
  }

  await emitSessionState(sessionId);
}

function scheduleReveal(sessionId: string, endsAt: Date) {
  const room = roomStates.get(sessionId) ?? {
    sessionId,
    correctOptionId: null,
    revealTimer: null,
  };
  if (room.revealTimer) clearTimeout(room.revealTimer);

  const delay = Math.max(0, endsAt.getTime() - Date.now());
  room.revealTimer = setTimeout(() => {
    void revealQuestion(sessionId);
  }, delay);
  roomStates.set(sessionId, room);
}

io.on("connection", (socket: Socket) => {
  socket.on("join_session", async (payload: unknown) => {
    const parsed = z
      .object({ sessionId: z.string(), sessionToken: z.string() })
      .safeParse(payload);
    if (!parsed.success) return;

    const participant = await prisma.participant.findUnique({
      where: { sessionToken: parsed.data.sessionToken },
    });
    if (!participant || participant.sessionId !== parsed.data.sessionId) {
      socket.emit("error", { message: "Invalid session token" });
      return;
    }

    socket.join(`session:${parsed.data.sessionId}`);
    socket.data.participantId = participant.id;
    socket.data.sessionId = parsed.data.sessionId;

    // Broadcast (not just emit to this socket) so the admin's lobby view
    // picks up the new participant live instead of only on their next action.
    await emitSessionState(parsed.data.sessionId);
  });

  socket.on("join_admin", async (payload: unknown) => {
    const parsed = z
      .object({
        sessionId: z.string(),
        secret: z.string(),
      })
      .safeParse(payload);
    if (!parsed.success || parsed.data.secret !== SOCKET_SECRET) {
      socket.emit("error", { message: "Unauthorized" });
      return;
    }

    socket.join(`admin:${parsed.data.sessionId}`);
    socket.data.sessionId = parsed.data.sessionId;
    socket.data.isAdmin = true;

    const state = await buildSessionState(parsed.data.sessionId, true);
    socket.emit("session_state", state);
  });

  socket.on("submit_answer", async (payload: unknown) => {
    const parsed = z
      .object({
        quizQuestionId: z.string(),
        optionId: z.string().optional(),
        textAnswer: z.string().optional(),
      })
      .safeParse(payload);
    if (!parsed.success) return;

    const participantId = socket.data.participantId as string | undefined;
    const sessionId = socket.data.sessionId as string | undefined;
    if (!participantId || !sessionId) return;

    const session = await prisma.quizSession.findUnique({
      where: { id: sessionId },
    });
    if (!session || session.status !== "QUESTION_ACTIVE") return;
    if (!session.questionStartedAt) return;

    const responseTimeMs = Date.now() - session.questionStartedAt.getTime();
    if (session.questionEndsAt && Date.now() > session.questionEndsAt.getTime()) {
      return;
    }

    try {
      await prisma.answer.upsert({
        where: {
          participantId_quizQuestionId: {
            participantId,
            quizQuestionId: parsed.data.quizQuestionId,
          },
        },
        create: {
          participantId,
          sessionId,
          quizQuestionId: parsed.data.quizQuestionId,
          optionId: parsed.data.optionId,
          textAnswer: parsed.data.textAnswer,
          responseTimeMs,
        },
        update: {
          optionId: parsed.data.optionId,
          textAnswer: parsed.data.textAnswer,
          responseTimeMs,
          answeredAt: new Date(),
        },
      });
      socket.emit("answer_received", { ok: true });
    } catch {
      socket.emit("error", { message: "Failed to submit answer" });
    }
  });

  socket.on("start_quiz", async (payload: unknown) => {
    if (!socket.data.isAdmin) return;
    const parsed = z.object({ sessionId: z.string() }).safeParse(payload);
    if (!parsed.success) return;

    await prisma.quizSession.update({
      where: { id: parsed.data.sessionId },
      data: {
        status: "LOBBY",
        startedAt: new Date(),
        currentQuestionIndex: -1,
      },
    });
    await emitSessionState(parsed.data.sessionId);
  });

  socket.on("start_question", async (payload: unknown) => {
    if (!socket.data.isAdmin) return;
    const parsed = z
      .object({ sessionId: z.string(), questionIndex: z.number().int().min(0) })
      .safeParse(payload);
    if (!parsed.success) return;

    const session = await prisma.quizSession.findUnique({
      where: { id: parsed.data.sessionId },
      include: {
        quiz: { include: { questions: { orderBy: { order: "asc" } } } },
      },
    });
    if (!session) return;

    const qq = session.quiz.questions[parsed.data.questionIndex];
    if (!qq) return;

    const startedAt = new Date();
    const endsAt = new Date(startedAt.getTime() + qq.timeLimitSec * 1000);

    const room = roomStates.get(parsed.data.sessionId) ?? {
      sessionId: parsed.data.sessionId,
      correctOptionId: null,
      revealTimer: null,
    };
    room.correctOptionId = null;
    roomStates.set(parsed.data.sessionId, room);

    await prisma.quizSession.update({
      where: { id: parsed.data.sessionId },
      data: {
        status: "QUESTION_ACTIVE",
        currentQuestionIndex: parsed.data.questionIndex,
        questionStartedAt: startedAt,
        questionEndsAt: endsAt,
      },
    });

    scheduleReveal(parsed.data.sessionId, endsAt);
    await emitSessionState(parsed.data.sessionId);
  });

  socket.on("next_question", async (payload: unknown) => {
    if (!socket.data.isAdmin) return;
    const parsed = z
      .object({ sessionId: z.string(), questionIndex: z.number().int().min(0) })
      .safeParse(payload);
    if (!parsed.success) return;

    const session = await prisma.quizSession.findUnique({
      where: { id: parsed.data.sessionId },
    });
    if (
      !session ||
      (session.status !== "QUESTION_REVEAL" &&
        session.status !== "FREE_TEXT_REVIEW")
    ) {
      return;
    }

    const room = roomStates.get(parsed.data.sessionId);
    if (room?.revealTimer) clearTimeout(room.revealTimer);

    await prisma.quizSession.update({
      where: { id: parsed.data.sessionId },
      data: {
        status: "QUESTION_ACTIVE",
        currentQuestionIndex: parsed.data.questionIndex,
        questionStartedAt: null,
        questionEndsAt: null,
      },
    });

    const sessionWithQuiz = await prisma.quizSession.findUnique({
      where: { id: parsed.data.sessionId },
      include: {
        quiz: { include: { questions: { orderBy: { order: "asc" } } } },
      },
    });
    if (!sessionWithQuiz) return;

    const qq = sessionWithQuiz.quiz.questions[parsed.data.questionIndex];
    if (!qq) {
      await prisma.quizSession.update({
        where: { id: parsed.data.sessionId },
        data: { status: "COMPLETED", endedAt: new Date() },
      });
      await prisma.quiz.update({
        where: { id: sessionWithQuiz.quizId },
        data: { status: "COMPLETED" },
      });
    } else {
      const startedAt = new Date();
      const endsAt = new Date(startedAt.getTime() + qq.timeLimitSec * 1000);
      await prisma.quizSession.update({
        where: { id: parsed.data.sessionId },
        data: {
          questionStartedAt: startedAt,
          questionEndsAt: endsAt,
        },
      });
      scheduleReveal(parsed.data.sessionId, endsAt);
    }

    await emitSessionState(parsed.data.sessionId);
  });

  socket.on("award_free_text", async (payload: unknown) => {
    if (!socket.data.isAdmin) return;
    const parsed = z
      .object({
        sessionId: z.string(),
        awards: z.array(
          z.object({
            answerId: z.string(),
            isCorrect: z.boolean(),
            points: z.number().int().min(0).max(1000),
          }),
        ),
      })
      .safeParse(payload);
    if (!parsed.success) return;

    for (const award of parsed.data.awards) {
      const answer = await prisma.answer.update({
        where: { id: award.answerId },
        data: {
          isCorrect: award.isCorrect,
          points: award.isCorrect ? award.points : 0,
        },
        include: { participant: true },
      });

      if (award.isCorrect && award.points > 0) {
        await prisma.participant.update({
          where: { id: answer.participantId },
          data: { totalScore: { increment: award.points } },
        });
        await updateLeaderboardScores(
          answer.participant.companyId,
          answer.participant.playerName,
          award.points,
          answer.quizQuestionId,
        );
      }
    }

    await prisma.quizSession.update({
      where: { id: parsed.data.sessionId },
      data: { status: "QUESTION_REVEAL" },
    });
    await emitSessionState(parsed.data.sessionId);
  });

  socket.on("end_quiz", async (payload: unknown) => {
    if (!socket.data.isAdmin) return;
    const parsed = z.object({ sessionId: z.string() }).safeParse(payload);
    if (!parsed.success) return;

    const session = await prisma.quizSession.findUnique({
      where: { id: parsed.data.sessionId },
    });
    if (!session) return;

    await prisma.$transaction([
      prisma.quizSession.update({
        where: { id: parsed.data.sessionId },
        data: { status: "COMPLETED", endedAt: new Date() },
      }),
      prisma.quiz.update({
        where: { id: session.quizId },
        data: { status: "COMPLETED" },
      }),
    ]);

    await emitSessionState(parsed.data.sessionId);
  });
});

httpServer.listen(PORT, () => {
  console.log(`Socket server running on port ${PORT}`);
});
