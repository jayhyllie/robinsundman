import type { PrismaClient } from "@sundman/prisma";

import { generateJoinCode } from "~/lib/constants";

const stockholmDay = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Stockholm",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Calendar day key in Europe/Stockholm, e.g. `2026-09-20`. */
export function stockholmDayKey(d: Date = new Date()) {
  return stockholmDay.format(d);
}

/**
 * Tips: open DRAFT matches whose puck drop falls on today's Stockholm date.
 */
export async function ensureTodaysTipsMatchesOpen(db: PrismaClient) {
  const today = stockholmDayKey();
  const drafts = await db.predictionMatch.findMany({
    where: { status: "DRAFT" },
    select: { id: true, puckDropAt: true },
  });
  const ids = drafts
    .filter((m) => stockholmDayKey(m.puckDropAt) === today)
    .map((m) => m.id);
  if (ids.length === 0) return;
  await db.predictionMatch.updateMany({
    where: { id: { in: ids } },
    data: { status: "OPEN" },
  });
}

async function uniqueJoinCode(db: PrismaClient) {
  let joinCode = generateJoinCode();
  for (let attempts = 0; attempts < 10; attempts++) {
    const existing = await db.quizSession.findUnique({
      where: { joinCode },
    });
    if (!existing) return joinCode;
    joinCode = generateJoinCode();
  }
  return joinCode;
}

/**
 * Quiz: for SCHEDULED quizzes whose scheduledAt is today (Stockholm),
 * set LIVE and create a lobby session if none exists (same as Launch quiz).
 */
export async function ensureTodaysQuizzesLive(db: PrismaClient) {
  const today = stockholmDayKey();
  const scheduled = await db.quiz.findMany({
    where: {
      status: "SCHEDULED",
      scheduledAt: { not: null },
    },
    include: {
      questions: { select: { id: true } },
      sessions: {
        where: { status: { not: "COMPLETED" } },
        take: 1,
        select: { id: true },
      },
    },
  });

  for (const quiz of scheduled) {
    if (!quiz.scheduledAt || stockholmDayKey(quiz.scheduledAt) !== today) {
      continue;
    }
    if (quiz.questions.length === 0) continue;

    if (quiz.sessions.length > 0) {
      await db.quiz.update({
        where: { id: quiz.id },
        data: { status: "LIVE" },
      });
      continue;
    }

    const joinCode = await uniqueJoinCode(db);
    await db.$transaction([
      db.quizSession.create({
        data: {
          quizId: quiz.id,
          joinCode,
          status: "LOBBY",
        },
      }),
      db.quiz.update({
        where: { id: quiz.id },
        data: { status: "LIVE" },
      }),
    ]);
  }
}
