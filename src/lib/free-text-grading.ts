import type { PrismaClient } from "@sundman/prisma";

export type FreeTextAwardInput = {
  answerId: string;
  isCorrect: boolean;
  points: number;
};

/** Recalculate session participant totals from their answer points. */
async function syncParticipantTotals(
  db: PrismaClient,
  participantIds: string[],
) {
  for (const participantId of participantIds) {
    const sum = await db.answer.aggregate({
      where: { participantId },
      _sum: { points: true },
    });
    await db.participant.update({
      where: { id: participantId },
      data: { totalScore: sum._sum.points ?? 0 },
    });
  }
}

/** Recalculate player + company leaderboard rows from stored answers. */
async function syncLeaderboardForEntities(
  db: PrismaClient,
  companyIds: string[],
  players: { playerName: string; companyId: string }[],
) {
  const periods = await db.leaderboardPeriod.findMany({
    where: { isActive: true },
  });

  for (const period of periods) {
    for (const { playerName, companyId } of players) {
      const playerAnswers = await db.answer.findMany({
        where: {
          points: { gt: 0 },
          participant: { playerName, companyId },
        },
      });
      const playerTotal = playerAnswers.reduce((sum, a) => sum + a.points, 0);

      await db.playerScore.upsert({
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
          points: playerTotal,
        },
        update: { points: playerTotal },
      });
    }

    for (const companyId of companyIds) {
      const companyAnswers = await db.answer.findMany({
        where: {
          points: { gt: 0 },
          participant: { companyId },
        },
        select: { quizQuestionId: true, points: true },
      });

      const bestByQuestion = new Map<string, number>();
      for (const answer of companyAnswers) {
        const prev = bestByQuestion.get(answer.quizQuestionId) ?? 0;
        bestByQuestion.set(
          answer.quizQuestionId,
          Math.max(prev, answer.points),
        );
      }
      const companyTotal = [...bestByQuestion.values()].reduce(
        (sum, pts) => sum + pts,
        0,
      );

      await db.companyScore.upsert({
        where: {
          companyId_periodId: { companyId, periodId: period.id },
        },
        create: {
          companyId,
          periodId: period.id,
          points: companyTotal,
        },
        update: { points: companyTotal },
      });
    }
  }
}

/** Apply free-text awards and sync dependent scores. Safe to re-run. */
export async function applyFreeTextAwards(
  db: PrismaClient,
  awards: FreeTextAwardInput[],
) {
  if (awards.length === 0) return;

  const answers = await db.answer.findMany({
    where: { id: { in: awards.map((a) => a.answerId) } },
    include: {
      participant: true,
      quizQuestion: { include: { question: true } },
    },
  });

  const answerMap = new Map(answers.map((a) => [a.id, a]));
  const participantIds = new Set<string>();
  const companyIds = new Set<string>();
  const players = new Map<string, { playerName: string; companyId: string }>();

  for (const award of awards) {
    const answer = answerMap.get(award.answerId);
    if (answer?.quizQuestion.question.type !== "FREE_TEXT") {
      throw new Error(`Invalid free-text answer: ${award.answerId}`);
    }

    const points = award.isCorrect ? award.points : 0;

    await db.answer.update({
      where: { id: award.answerId },
      data: {
        isCorrect: award.isCorrect,
        points,
      },
    });

    participantIds.add(answer.participantId);
    companyIds.add(answer.participant.companyId);
    players.set(`${answer.participant.playerName}:${answer.participant.companyId}`, {
      playerName: answer.participant.playerName,
      companyId: answer.participant.companyId,
    });
  }

  await syncParticipantTotals(db, [...participantIds]);
  await syncLeaderboardForEntities(db, [...companyIds], [...players.values()]);
}
