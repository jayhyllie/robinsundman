import { TRPCError } from "@trpc/server";
import { z } from "zod";
import type { PrismaClient } from "@sundman/prisma";

import { generateJoinCode } from "~/lib/constants";
import { COLOR_VALUE, HEX_COLOR, BORDER_RADIUS_VALUE } from "~/lib/branding-colors";
import { applyFreeTextAwards } from "~/lib/free-text-grading";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";

export const companyRouter = createTRPCRouter({
  list: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.company.findMany({
      orderBy: { name: "asc" },
    });
  }),

  // Players can self-register a new company on the join page.
  // Returns existing company if name already exists (case-insensitive).
  findOrCreate: publicProcedure
    .input(z.object({ name: z.string().min(1).max(100) }))
    .mutation(async ({ ctx, input }) => {
      const trimmed = input.name.trim();
      // Case-insensitive match
      const existing = await ctx.db.company.findFirst({
        where: { name: { equals: trimmed, mode: "insensitive" } },
      });
      if (existing) return existing;
      return ctx.db.company.create({ data: { name: trimmed } });
    }),

  listPlayerNames: publicProcedure
    .input(z.object({ companyId: z.string() }))
    .query(async ({ ctx, input }) => {
      const participants = await ctx.db.participant.findMany({
        where: { companyId: input.companyId },
        select: { playerName: true, joinedAt: true },
        orderBy: { joinedAt: "desc" },
        take: 200,
      });

      const seen = new Set<string>();
      const names: string[] = [];
      for (const p of participants) {
        const key = p.playerName.toLowerCase();
        if (!seen.has(key)) {
          seen.add(key);
          names.push(p.playerName);
        }
      }
      return names;
    }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        logoUrl: z.string().url().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.company.create({ data: input });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).max(100),
        logoUrl: z.string().url().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.company.update({
        where: { id: input.id },
        data: { name: input.name, logoUrl: input.logoUrl },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const usageCount = await ctx.db.participant.count({
        where: { companyId: input.id },
      });
      if (usageCount > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Företaget har deltagit i ett quiz och kan inte tas bort",
        });
      }
      return ctx.db.company.delete({ where: { id: input.id } });
    }),
});

export const questionRouter = createTRPCRouter({
  listBank: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.question.findMany({
      where: { inBank: true },
      include: { options: { orderBy: { order: "asc" } } },
      orderBy: { updatedAt: "desc" },
    });
  }),

  create: protectedProcedure
    .input(
      z.object({
        textSv: z.string().min(1),
        textEn: z.string().optional(),
        type: z.enum(["MULTIPLE_CHOICE", "FREE_TEXT"]),
        inBank: z.boolean().default(true),
        options: z
          .array(
            z.object({
              labelSv: z.string().min(1),
              labelEn: z.string().optional(),
              letter: z.string(),
              isCorrect: z.boolean(),
              order: z.number(),
            }),
          )
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.type === "MULTIPLE_CHOICE") {
        const opts = input.options ?? [];
        if (opts.length < 2 || opts.length > 4) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Multiple choice needs 2-4 options",
          });
        }
        if (!opts.some((o) => o.isCorrect)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "At least one correct option required",
          });
        }
      }

      return ctx.db.question.create({
        data: {
          textSv: input.textSv,
          textEn: input.textEn,
          type: input.type,
          inBank: input.inBank,
          options: input.options
            ? { create: input.options }
            : undefined,
        },
        include: { options: true },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        textSv: z.string().min(1),
        textEn: z.string().nullable().optional(),
        type: z.enum(["MULTIPLE_CHOICE", "FREE_TEXT"]),
        options: z
          .array(
            z.object({
              labelSv: z.string().min(1),
              labelEn: z.string().optional(),
              letter: z.string(),
              isCorrect: z.boolean(),
              order: z.number(),
            }),
          )
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const existing = await ctx.db.question.findUnique({
        where: { id: input.id },
      });
      if (!existing) throw new TRPCError({ code: "NOT_FOUND" });

      if (input.type === "MULTIPLE_CHOICE") {
        const opts = input.options ?? [];
        if (opts.length < 2 || opts.length > 4) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Multiple choice needs 2-4 options",
          });
        }
        if (!opts.some((o) => o.isCorrect)) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "At least one correct option required",
          });
        }
      }

      await ctx.db.questionOption.deleteMany({
        where: { questionId: input.id },
      });

      return ctx.db.question.update({
        where: { id: input.id },
        data: {
          textSv: input.textSv,
          textEn: input.textEn === undefined ? undefined : input.textEn,
          type: input.type,
          options:
            input.type === "MULTIPLE_CHOICE" && input.options
              ? { create: input.options }
              : undefined,
        },
        include: { options: { orderBy: { order: "asc" } } },
      });
    }),

  listArchived: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.question.findMany({
      where: { inBank: false },
      include: { options: { orderBy: { order: "asc" } } },
      orderBy: { updatedAt: "desc" },
    });
  }),

  // Removing a question never hard-deletes it — quizzes (past or present)
  // keep referencing it via QuizQuestion. It's just taken out of the active
  // bank so it stops showing up when building new quizzes.
  archive: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.question.update({
        where: { id: input.id },
        data: { inBank: false },
      });
    }),

  restore: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.question.update({
        where: { id: input.id },
        data: { inBank: true },
      });
    }),
});

export const quizRouter = createTRPCRouter({
  getActive: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.quiz.findFirst({
      where: { status: "LIVE" },
      orderBy: { updatedAt: "desc" },
      include: {
        _count: { select: { questions: true } },
        sessions: {
          where: { status: { not: "COMPLETED" } },
          orderBy: { createdAt: "desc" },
          take: 1,
          include: {
            _count: { select: { participants: true } },
          },
        },
      },
    });
  }),

  list: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.quiz.findMany({
      include: {
        questions: { include: { question: true } },
        sessions: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { updatedAt: "desc" },
    });
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const quiz = await ctx.db.quiz.findUnique({
        where: { id: input.id },
        include: {
          questions: {
            include: {
              question: { include: { options: { orderBy: { order: "asc" } } } },
            },
            orderBy: { order: "asc" },
          },
          sessions: { orderBy: { createdAt: "desc" } },
        },
      });
      if (!quiz) throw new TRPCError({ code: "NOT_FOUND" });
      return quiz;
    }),

  create: protectedProcedure
    .input(
      z.object({
        titleSv: z.string().min(1),
        titleEn: z.string().optional(),
        matchNumber: z.number().int().positive().optional(),
        matchTitle: z.string().optional(),
        scheduledAt: z.date().optional(),
        questions: z
          .array(
            z.object({
              questionId: z.string(),
              timeLimitSec: z.number().int().min(5).max(300).default(10),
            }),
          )
          .min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.quiz.create({
        data: {
          titleSv: input.titleSv,
          titleEn: input.titleEn,
          matchNumber: input.matchNumber,
          matchTitle: input.matchTitle,
          scheduledAt: input.scheduledAt,
          status: input.scheduledAt ? "SCHEDULED" : "DRAFT",
          createdById: ctx.userId,
          questions: {
            create: input.questions.map((q, index) => ({
              questionId: q.questionId,
              order: index,
              timeLimitSec: q.timeLimitSec,
            })),
          },
        },
      });
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        titleSv: z.string().min(1),
        titleEn: z.string().optional(),
        matchNumber: z.number().int().positive().optional(),
        matchTitle: z.string().optional(),
        scheduledAt: z.date().nullable().optional(),
        status: z.enum(["DRAFT", "SCHEDULED"]).optional(),
        questions: z
          .array(
            z.object({
              questionId: z.string(),
              timeLimitSec: z.number().int().min(5).max(300).default(10),
            }),
          )
          .min(1)
          .optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, questions, ...data } = input;

      if (questions) {
        await ctx.db.quizQuestion.deleteMany({ where: { quizId: id } });
        await ctx.db.quizQuestion.createMany({
          data: questions.map((q, index) => ({
            quizId: id,
            questionId: q.questionId,
            order: index,
            timeLimitSec: q.timeLimitSec,
          })),
        });
      }

      return ctx.db.quiz.update({
        where: { id },
        data: {
          ...data,
          status:
            data.scheduledAt && data.status !== "DRAFT"
              ? "SCHEDULED"
              : data.status,
        },
      });
    }),

  updateQuestionTimeLimit: protectedProcedure
    .input(
      z.object({
        quizQuestionId: z.string(),
        timeLimitSec: z.number().int().min(5).max(300),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const qq = await ctx.db.quizQuestion.findUnique({
        where: { id: input.quizQuestionId },
        include: { quiz: true },
      });
      if (!qq) throw new TRPCError({ code: "NOT_FOUND" });
      if (qq.quiz.status === "LIVE" || qq.quiz.status === "COMPLETED") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot change time limit on a live or completed quiz",
        });
      }

      return ctx.db.quizQuestion.update({
        where: { id: input.quizQuestionId },
        data: { timeLimitSec: input.timeLimitSec },
      });
    }),

  launchSession: protectedProcedure
    .input(z.object({ quizId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const quiz = await ctx.db.quiz.findUnique({
        where: { id: input.quizId },
        include: { questions: true },
      });
      if (!quiz) throw new TRPCError({ code: "NOT_FOUND" });
      if (quiz.questions.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Quiz has no questions",
        });
      }

      let joinCode = generateJoinCode();
      let attempts = 0;
      while (attempts < 10) {
        const existing = await ctx.db.quizSession.findUnique({
          where: { joinCode },
        });
        if (!existing) break;
        joinCode = generateJoinCode();
        attempts++;
      }

      const [session] = await ctx.db.$transaction([
        ctx.db.quizSession.create({
          data: {
            quizId: quiz.id,
            joinCode,
            status: "LOBBY",
          },
        }),
        ctx.db.quiz.update({
          where: { id: quiz.id },
          data: { status: "LIVE" },
        }),
      ]);

      return session;
    }),

  getSessionByCode: publicProcedure
    .input(z.object({ joinCode: z.string() }))
    .query(async ({ ctx, input }) => {
      const session = await ctx.db.quizSession.findUnique({
        where: { joinCode: input.joinCode.toUpperCase() },
        include: {
          quiz: true,
          participants: { include: { company: true } },
        },
      });
      if (!session) throw new TRPCError({ code: "NOT_FOUND" });
      return session;
    }),

  getSessionById: publicProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ ctx, input }) => {
      const session = await ctx.db.quizSession.findUnique({
        where: { id: input.sessionId },
        include: {
          quiz: true,
          participants: {
            include: { company: true },
            orderBy: { totalScore: "desc" },
          },
        },
      });
      if (!session) throw new TRPCError({ code: "NOT_FOUND" });
      return session;
    }),

  getFreeTextGrading: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ ctx, input }) => {
      const session = await ctx.db.quizSession.findUnique({
        where: { id: input.sessionId },
        include: {
          quiz: {
            include: {
              questions: {
                include: {
                  question: true,
                  answers: {
                    where: { sessionId: input.sessionId },
                    include: {
                      participant: { include: { company: true } },
                    },
                    orderBy: { answeredAt: "asc" },
                  },
                },
                orderBy: { order: "asc" },
              },
            },
          },
        },
      });
      if (!session) throw new TRPCError({ code: "NOT_FOUND" });

      const questions = session.quiz.questions
        .filter((qq) => qq.question.type === "FREE_TEXT")
        .map((qq) => ({
          quizQuestionId: qq.id,
          order: qq.order,
          textSv: qq.question.textSv,
          textEn: qq.question.textEn,
          pendingCount: qq.answers.filter((a) => a.isCorrect === null).length,
          submissions: qq.answers.map((a) => ({
            answerId: a.id,
            playerName: a.participant.playerName,
            companyName: a.participant.company.name,
            textAnswer: a.textAnswer ?? "",
            isCorrect: a.isCorrect,
            points: a.points,
            graded: a.isCorrect !== null,
          })),
        }));

      return {
        sessionId: session.id,
        quizId: session.quizId,
        quizTitleSv: session.quiz.titleSv,
        sessionStatus: session.status,
        questions,
        pendingCount: questions.reduce((sum, q) => sum + q.pendingCount, 0),
      };
    }),

  getPendingFreeTextCount: protectedProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.answer.count({
        where: {
          sessionId: input.sessionId,
          isCorrect: null,
          textAnswer: { not: null },
          quizQuestion: { question: { type: "FREE_TEXT" } },
        },
      });
    }),

  awardFreeTextGrading: protectedProcedure
    .input(
      z.object({
        sessionId: z.string(),
        awards: z.array(
          z.object({
            answerId: z.string(),
            isCorrect: z.boolean(),
            points: z.number().int().min(0).max(1000),
          }),
        ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.awards.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No awards provided",
        });
      }

      const answers = await ctx.db.answer.findMany({
        where: {
          id: { in: input.awards.map((a) => a.answerId) },
          sessionId: input.sessionId,
        },
        include: {
          quizQuestion: { include: { question: true } },
        },
      });

      if (answers.length !== input.awards.length) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "One or more answers do not belong to this session",
        });
      }

      if (answers.some((a) => a.quizQuestion.question.type !== "FREE_TEXT")) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only free-text answers can be graded here",
        });
      }

      await applyFreeTextAwards(ctx.db, input.awards);
      return { success: true };
    }),
});

export const participantRouter = createTRPCRouter({
  join: publicProcedure
    .input(
      z.object({
        joinCode: z.string(),
        companyId: z.string(),
        playerName: z.string().min(1).max(80),
        sessionToken: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const session = await ctx.db.quizSession.findUnique({
        where: { joinCode: input.joinCode.toUpperCase() },
      });
      if (!session) throw new TRPCError({ code: "NOT_FOUND" });

      if (session.status !== "LOBBY") {
        if (input.sessionToken) {
          const existing = await ctx.db.participant.findUnique({
            where: { sessionToken: input.sessionToken },
          });
          if (existing?.sessionId === session.id) {
            return existing;
          }
        }
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Quiz has already started",
        });
      }

      const existing = await ctx.db.participant.findUnique({
        where: {
          sessionId_playerName_companyId: {
            sessionId: session.id,
            playerName: input.playerName.trim(),
            companyId: input.companyId,
          },
        },
      });
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Already joined",
        });
      }

      const { customAlphabet } = await import("nanoid");
      const tokenGen = customAlphabet(
        "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz",
        32,
      );

      return ctx.db.participant.create({
        data: {
          sessionId: session.id,
          companyId: input.companyId,
          playerName: input.playerName.trim(),
          sessionToken: tokenGen(),
        },
        include: { company: true },
      });
    }),

  getByToken: publicProcedure
    .input(z.object({ sessionToken: z.string() }))
    .query(async ({ ctx, input }) => {
      const participant = await ctx.db.participant.findUnique({
        where: { sessionToken: input.sessionToken },
        include: {
          company: true,
          session: { include: { quiz: true } },
        },
      });
      if (!participant) throw new TRPCError({ code: "NOT_FOUND" });
      return participant;
    }),
});

// Sports-season label spanning a calendar year boundary, e.g. "25/26" for
// Aug 2025 – Jul 2026. Season start month (July, 0-indexed 6) matches the
// hardcoded default that used to live here ("Säsong 25/26").
function seasonLabel(date: Date): string {
  const startYear = date.getMonth() >= 6 ? date.getFullYear() : date.getFullYear() - 1;
  const endYear = startYear + 1;
  return `${String(startYear).slice(-2)}/${String(endYear).slice(-2)}`;
}

function seasonPeriodDefaults(now: Date) {
  const label = seasonLabel(now);
  return {
    nameSv: `Säsong ${label}`,
    nameEn: `Season ${label}`,
    type: "SEASON" as const,
    startsAt: now,
    isActive: true,
  };
}

function monthlyPeriodDefaults(now: Date) {
  return {
    nameSv: now.toLocaleString("sv-SE", { month: "long", year: "numeric" }),
    nameEn: now.toLocaleString("en-US", { month: "long", year: "numeric" }),
    type: "MONTHLY" as const,
    startsAt: new Date(now.getFullYear(), now.getMonth(), 1),
    isActive: true,
  };
}

// Creates missing SEASON/MONTHLY periods, and rolls the monthly period over
// to a fresh one when the calendar month has changed. The outgoing period is
// archived (isActive: false) rather than deleted, so past months/seasons
// stay browsable via listArchivedPeriods/getPeriodById instead of being lost.
async function ensureAndRolloverPeriods(db: PrismaClient) {
  const now = new Date();
  let created = false;

  const activeSeason = await db.leaderboardPeriod.findFirst({
    where: { type: "SEASON", isActive: true },
  });
  if (!activeSeason) {
    await db.leaderboardPeriod.create({ data: seasonPeriodDefaults(now) });
    created = true;
  }

  const activeMonthly = await db.leaderboardPeriod.findFirst({
    where: { type: "MONTHLY", isActive: true },
  });
  const sameMonth =
    !!activeMonthly?.startsAt &&
    activeMonthly.startsAt.getFullYear() === now.getFullYear() &&
    activeMonthly.startsAt.getMonth() === now.getMonth();

  if (!activeMonthly) {
    await db.leaderboardPeriod.create({ data: monthlyPeriodDefaults(now) });
    created = true;
  } else if (!sameMonth) {
    await db.$transaction([
      db.leaderboardPeriod.update({
        where: { id: activeMonthly.id },
        data: { isActive: false, endsAt: now, lastResetAt: now },
      }),
      db.leaderboardPeriod.create({ data: monthlyPeriodDefaults(now) }),
    ]);
    created = true;
  }

  return created;
}

export const leaderboardRouter = createTRPCRouter({
  getActivePeriods: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.leaderboardPeriod.findMany({
      where: { isActive: true },
      include: {
        companyScores: {
          include: { company: true },
          orderBy: { points: "desc" },
          take: 10,
        },
        playerScores: {
          include: { company: true },
          orderBy: { points: "desc" },
          take: 10,
        },
      },
    });
  }),

  // Read-only history: past (archived) periods, most recent first.
  listArchivedPeriods: publicProcedure
    .input(z.object({ type: z.enum(["SEASON", "MONTHLY"]).optional() }).optional())
    .query(async ({ ctx, input }) => {
      return ctx.db.leaderboardPeriod.findMany({
        where: { isActive: false, ...(input?.type ? { type: input.type } : {}) },
        orderBy: { startsAt: "desc" },
        select: {
          id: true,
          nameSv: true,
          nameEn: true,
          type: true,
          startsAt: true,
          endsAt: true,
        },
      });
    }),

  // Full scores for one period (active or archived) — powers the history picker.
  getPeriodById: publicProcedure
    .input(z.object({ periodId: z.string() }))
    .query(async ({ ctx, input }) => {
      const period = await ctx.db.leaderboardPeriod.findUnique({
        where: { id: input.periodId },
        include: {
          companyScores: {
            include: { company: true },
            orderBy: { points: "desc" },
            take: 10,
          },
          playerScores: {
            include: { company: true },
            orderBy: { points: "desc" },
            take: 10,
          },
        },
      });
      if (!period) throw new TRPCError({ code: "NOT_FOUND" });
      return period;
    }),

  ensureDefaults: protectedProcedure.mutation(async ({ ctx }) => {
    const created = await ensureAndRolloverPeriods(ctx.db);
    return { created };
  }),

  // Archives the period (keeps its scores for history) and starts a fresh
  // one of the same type, instead of destroying the data.
  reset: protectedProcedure
    .input(z.object({ periodId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const period = await ctx.db.leaderboardPeriod.findUnique({
        where: { id: input.periodId },
      });
      if (!period) throw new TRPCError({ code: "NOT_FOUND" });

      const now = new Date();
      const nextDefaults =
        period.type === "SEASON" ? seasonPeriodDefaults(now) : monthlyPeriodDefaults(now);

      const [, newPeriod] = await ctx.db.$transaction([
        ctx.db.leaderboardPeriod.update({
          where: { id: input.periodId },
          data: { isActive: false, endsAt: now, lastResetAt: now },
        }),
        ctx.db.leaderboardPeriod.create({ data: nextDefaults }),
      ]);

      return { success: true, newPeriodId: newPeriod.id };
    }),

  getLatestMatchPodium: publicProcedure.query(async ({ ctx }) => {
    const session = await ctx.db.quizSession.findFirst({
      where: { status: "COMPLETED" },
      orderBy: { endedAt: "desc" },
      include: {
        quiz: true,
        participants: {
          include: { company: true },
          orderBy: { totalScore: "desc" },
          take: 3,
        },
        _count: { select: { participants: true } },
      },
    });

    if (!session) return null;

    return {
      sessionId: session.id,
      matchTitle: session.quiz.matchTitle,
      matchNumber: session.quiz.matchNumber,
      endedAt: session.endedAt,
      participantCount: session._count.participants,
      podium: session.participants.map((p, i) => ({
        rank: i + 1,
        name: p.playerName,
        company: p.company.name,
        points: p.totalScore,
      })),
    };
  }),

  ensureDefaultsPublic: publicProcedure.mutation(async ({ ctx }) => {
    const created = await ensureAndRolloverPeriods(ctx.db);
    return { created };
  }),

  getSessionLeaderboard: publicProcedure
    .input(z.object({ sessionId: z.string() }))
    .query(async ({ ctx, input }) => {
      const participants = await ctx.db.participant.findMany({
        where: { sessionId: input.sessionId },
        include: { company: true },
        orderBy: { totalScore: "desc" },
        take: 50,
      });
      return participants.map((p, i) => ({
        rank: i + 1,
        id: p.id,
        name: p.playerName,
        company: p.company.name,
        points: p.totalScore,
        initials: p.playerName
          .split(" ")
          .map((n) => n[0])
          .join("")
          .toUpperCase()
          .slice(0, 2),
      }));
    }),
});

const tenantDefaults = {
  appName: "ÖIK BUSINESS CLUB",
  challengeTag: "CHALLENGE",
  taglineSv: "5 frågor – 10 sekunder per fråga – Tävla mot andra företag!",
  taglineEn: "5 questions – 10 seconds per question – Compete against companies!",
  primaryColor: "#a4c639",
  primaryBrightColor: "#39ff14",
  accentColor: "#ffd700",
  bgColor: "#0a120e",
  cardColor: "rgba(10, 30, 18, 0.85)",
  borderColor: "rgba(164, 198, 57, 0.4)",
  sidebarColor: "#0f1a12",
  borderRadius: "0.625rem",
  logoUrl: null,
  faviconUrl: null,
  clubName: "Östersunds IK",
  clubShort: "ÖIK",
  hashtag: "#VIÄRÖIK",
  footerText: "TILLSAMMANS ÄR VI STARKARE",
  homeBgImageUrl: null,
  joinBgImageUrl: null,
  quizBgImageUrl: null,
  nextMatchBgImageUrl: null,
};

export const tenantRouter = createTRPCRouter({
  get: publicProcedure.query(async ({ ctx }) => {
    const tenant = await ctx.db.tenant.findUnique({ where: { id: "default" } });
    return tenant ?? { id: "default", updatedAt: new Date(), ...tenantDefaults };
  }),

  update: protectedProcedure
    .input(
      z.object({
        appName: z.string().min(1).max(80).optional(),
        challengeTag: z.string().max(40).optional(),
        taglineSv: z.string().max(200).optional(),
        taglineEn: z.string().max(200).optional(),
        primaryColor: z.string().regex(HEX_COLOR).optional(),
        primaryBrightColor: z.string().regex(HEX_COLOR).optional(),
        accentColor: z.string().regex(HEX_COLOR).optional(),
        bgColor: z.string().regex(HEX_COLOR).optional(),
        cardColor: z.string().regex(COLOR_VALUE).optional(),
        borderColor: z.string().regex(COLOR_VALUE).optional(),
        sidebarColor: z.string().regex(COLOR_VALUE).optional(),
        borderRadius: z.string().regex(BORDER_RADIUS_VALUE).optional(),
        logoUrl: z.string().url().nullable().optional(),
        faviconUrl: z.string().url().nullable().optional(),
        clubName: z.string().max(80).optional(),
        clubShort: z.string().max(20).optional(),
        hashtag: z.string().max(40).optional(),
        footerText: z.string().max(120).optional(),
        homeBgImageUrl: z.string().url().nullable().optional(),
        joinBgImageUrl: z.string().url().nullable().optional(),
        quizBgImageUrl: z.string().url().nullable().optional(),
        nextMatchBgImageUrl: z.string().url().nullable().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.tenant.upsert({
        where: { id: "default" },
        create: { id: "default", ...tenantDefaults, ...input },
        update: input,
      });
    }),
});
