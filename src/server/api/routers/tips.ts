import { TRPCError } from "@trpc/server";
import { z } from "zod";
import type { PrismaClient } from "@sundman/prisma";

import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";

const matchInclude = {
  homeTeam: true,
  awayTeam: true,
  sponsor: true,
  winner: {
    include: {
      prediction: true,
    },
  },
} as const;

function slugify(input: string) {
  return input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

/** Normalize and validate email. */
export function normalizeEmail(raw: string): string | null {
  const email = raw.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return null;
  if (email.length > 254) return null;
  return email;
}

type DbLike = {
  predictionMatch: {
    update: (args: {
      where: { id: string };
      data: { status: "CLOSED" };
    }) => Promise<unknown>;
  };
};

async function ensureLazyClose(
  db: DbLike,
  match: { id: string; status: string; puckDropAt: Date },
) {
  if (match.status === "OPEN" && match.puckDropAt.getTime() <= Date.now()) {
    await db.predictionMatch.update({
      where: { id: match.id },
      data: { status: "CLOSED" },
    });
    return "CLOSED" as const;
  }
  return match.status;
}

const stockholmDay = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Stockholm",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function dayKey(d: Date) {
  return stockholmDay.format(d);
}

const ARENA_LIVE_PRIORITY: Record<string, number> = {
  OPEN: 0,
  CLOSED: 1,
  RESULT_REGISTERED: 2,
  WINNER_PICKED: 3,
};

/** Prefer a drawn winner on the jumbotron winner screen. */
const WINNER_LIVE_PRIORITY: Record<string, number> = {
  WINNER_PICKED: 0,
  RESULT_REGISTERED: 1,
  CLOSED: 2,
  OPEN: 3,
};

type LiveMatchPurpose = "arena" | "winner";

/** Today's match for jumbotron, Europe/Stockholm calendar day. */
async function findLiveMatch(
  db: PrismaClient,
  purpose: LiveMatchPurpose = "arena",
) {
  const matches = await db.predictionMatch.findMany({
    where: { status: { not: "DRAFT" } },
    include: matchInclude,
    orderBy: { puckDropAt: "asc" },
  });

  const today = dayKey(new Date());
  const todays = matches.filter((m) => dayKey(m.puckDropAt) === today);
  const priority =
    purpose === "winner" ? WINNER_LIVE_PRIORITY : ARENA_LIVE_PRIORITY;

  const pickBest = (
    list: typeof matches,
  ): (typeof matches)[number] | null => {
    if (list.length === 0) return null;
    return [...list].sort((a, b) => {
      const pa = priority[a.status] ?? 99;
      const pb = priority[b.status] ?? 99;
      if (pa !== pb) return pa - pb;
      return (
        Math.abs(a.puckDropAt.getTime() - Date.now()) -
        Math.abs(b.puckDropAt.getTime() - Date.now())
      );
    })[0]!;
  };

  const fallback =
    purpose === "winner"
      ? matches.filter((m) =>
          ["WINNER_PICKED", "RESULT_REGISTERED", "CLOSED"].includes(m.status),
        )
      : matches.filter((m) => m.status === "OPEN");

  return pickBest(todays) ?? pickBest(fallback);
}

export const tipsRouter = createTRPCRouter({
  liveMatch: publicProcedure.query(async ({ ctx }) => {
    const match = await findLiveMatch(ctx.db, "arena");
    if (!match) return null;
    const status = await ensureLazyClose(ctx.db, match);
    return { ...match, status };
  }),

  /** Match for `/tips/arena/live/winner` — prefers WINNER_PICKED over OPEN. */
  liveWinnerMatch: publicProcedure.query(async ({ ctx }) => {
    const match = await findLiveMatch(ctx.db, "winner");
    if (!match) return null;
    const status = await ensureLazyClose(ctx.db, match);
    return { ...match, status };
  }),

  matchBySlug: publicProcedure
    .input(z.object({ slug: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const match = await ctx.db.predictionMatch.findUnique({
        where: { slug: input.slug },
        include: matchInclude,
      });
      if (!match) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Match not found" });
      }
      const status = await ensureLazyClose(ctx.db, match);
      return { ...match, status };
    }),

  publicStats: publicProcedure
    .input(z.object({ slug: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const match = await ctx.db.predictionMatch.findUnique({
        where: { slug: input.slug },
        select: {
          id: true,
          status: true,
          puckDropAt: true,
          predictionCount: true,
          homeScore: true,
          awayScore: true,
        },
      });
      if (!match) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      const status = await ensureLazyClose(ctx.db, match);
      return {
        predictionCount: match.predictionCount,
        status,
        homeScore: match.homeScore,
        awayScore: match.awayScore,
        puckDropAt: match.puckDropAt,
      };
    }),

  winnerBySlug: publicProcedure
    .input(z.object({ slug: z.string().min(1) }))
    .query(async ({ ctx, input }) => {
      const match = await ctx.db.predictionMatch.findUnique({
        where: { slug: input.slug },
        include: {
          homeTeam: true,
          awayTeam: true,
          sponsor: true,
          winner: { include: { prediction: true } },
        },
      });
      if (!match) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }
      return match;
    }),

  submitPrediction: publicProcedure
    .input(
      z.object({
        slug: z.string().min(1),
        playerName: z.string().trim().min(2).max(80),
        email: z.string().min(3).max(254),
        marketingConsent: z.boolean(),
        homeGoals: z.number().int().min(0).max(20),
        awayGoals: z.number().int().min(0).max(20),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const email = normalizeEmail(input.email);
      if (!email) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Ogiltig e-postadress",
        });
      }

      const match = await ctx.db.predictionMatch.findUnique({
        where: { slug: input.slug },
      });
      if (!match) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      const status = await ensureLazyClose(ctx.db, match);
      if (status !== "OPEN") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Tippningen är stängd",
        });
      }

      try {
        const prediction = await ctx.db.$transaction(async (tx) => {
          const created = await tx.matchPrediction.create({
            data: {
              matchId: match.id,
              playerName: input.playerName,
              email,
              marketingConsent: input.marketingConsent,
              marketingConsentAt: input.marketingConsent
                ? new Date()
                : null,
              homeGoals: input.homeGoals,
              awayGoals: input.awayGoals,
            },
          });
          await tx.predictionMatch.update({
            where: { id: match.id },
            data: { predictionCount: { increment: 1 } },
          });
          return created;
        });
        return prediction;
      } catch {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Du har redan tippat på den här matchen",
        });
      }
    }),

  /** Unique emails that opted in to newsletter / offers. */
  marketingSubscribers: protectedProcedure.query(async ({ ctx }) => {
    const rows = await ctx.db.matchPrediction.findMany({
      where: { marketingConsent: true },
      select: {
        email: true,
        playerName: true,
        marketingConsentAt: true,
        createdAt: true,
      },
      orderBy: { marketingConsentAt: "desc" },
    });

    const byEmail = new Map<
      string,
      {
        email: string;
        playerName: string;
        marketingConsentAt: Date | null;
        createdAt: Date;
      }
    >();
    for (const row of rows) {
      if (!byEmail.has(row.email)) {
        byEmail.set(row.email, row);
      }
    }
    return [...byEmail.values()];
  }),

  // ── Teams ──────────────────────────────────────────────────────────────
  teamsList: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.hockeyTeam.findMany({
      orderBy: [{ isHomeClub: "desc" }, { name: "asc" }],
    });
  }),

  teamCreate: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        shortName: z.string().min(1).max(8),
        logoUrl: z.string().optional().nullable(),
        isHomeClub: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.isHomeClub) {
        await ctx.db.hockeyTeam.updateMany({
          data: { isHomeClub: false },
        });
      }
      return ctx.db.hockeyTeam.create({
        data: {
          name: input.name,
          shortName: input.shortName,
          logoUrl: input.logoUrl ?? null,
          isHomeClub: input.isHomeClub ?? false,
        },
      });
    }),

  teamUpdate: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        shortName: z.string().min(1).max(8).optional(),
        logoUrl: z.string().nullable().optional(),
        isHomeClub: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      if (data.isHomeClub) {
        await ctx.db.hockeyTeam.updateMany({
          where: { NOT: { id } },
          data: { isHomeClub: false },
        });
      }
      return ctx.db.hockeyTeam.update({ where: { id }, data });
    }),

  teamDelete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const team = await ctx.db.hockeyTeam.findUnique({
        where: { id: input.id },
      });
      if (team?.isHomeClub) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Cannot delete home club",
        });
      }
      await ctx.db.hockeyTeam.delete({ where: { id: input.id } });
      return { ok: true };
    }),

  // ── Sponsors ───────────────────────────────────────────────────────────
  sponsorsList: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.sponsor.findMany({ orderBy: { name: "asc" } });
  }),

  sponsorCreate: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        logoUrl: z.string().optional().nullable(),
        campaignText: z.string().optional().nullable(),
        primaryColor: z.string().optional().nullable(),
        accentColor: z.string().optional().nullable(),
        textColor: z.string().optional().nullable(),
        isActive: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.sponsor.create({
        data: {
          name: input.name,
          logoUrl: input.logoUrl ?? null,
          campaignText: input.campaignText ?? null,
          primaryColor: input.primaryColor ?? "#ffd700",
          accentColor: input.accentColor ?? null,
          textColor: input.textColor ?? null,
          isActive: input.isActive ?? true,
        },
      });
    }),

  sponsorUpdate: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().min(1).optional(),
        logoUrl: z.string().nullable().optional(),
        campaignText: z.string().nullable().optional(),
        primaryColor: z.string().nullable().optional(),
        accentColor: z.string().nullable().optional(),
        textColor: z.string().nullable().optional(),
        isActive: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.sponsor.update({ where: { id }, data });
    }),

  sponsorDelete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await ctx.db.sponsor.delete({ where: { id: input.id } });
      return { ok: true };
    }),

  // ── Matches ────────────────────────────────────────────────────────────
  matchesList: protectedProcedure.query(async ({ ctx }) => {
    const matches = await ctx.db.predictionMatch.findMany({
      include: matchInclude,
      orderBy: { puckDropAt: "desc" },
    });
    return Promise.all(
      matches.map(async (m) => {
        const status = await ensureLazyClose(ctx.db, m);
        return { ...m, status };
      }),
    );
  }),

  matchById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const match = await ctx.db.predictionMatch.findUnique({
        where: { id: input.id },
        include: {
          ...matchInclude,
          predictions: { orderBy: { createdAt: "desc" } },
        },
      });
      if (!match) throw new TRPCError({ code: "NOT_FOUND" });
      const status = await ensureLazyClose(ctx.db, match);
      return { ...match, status };
    }),

  matchCreate: protectedProcedure
    .input(
      z.object({
        awayTeamId: z.string(),
        sponsorId: z.string().optional().nullable(),
        puckDropAt: z.coerce.date(),
        slug: z.string().optional(),
        publish: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const home = await ctx.db.hockeyTeam.findFirst({
        where: { isHomeClub: true },
      });
      if (!home) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No home club configured",
        });
      }
      const away = await ctx.db.hockeyTeam.findUnique({
        where: { id: input.awayTeamId },
      });
      if (!away) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Away team missing" });
      }

      const trimmedSlug = input.slug?.trim();
      let slug =
        trimmedSlug && trimmedSlug.length > 0
          ? trimmedSlug
          : slugify(`${home.shortName}-vs-${away.shortName}-${Date.now()}`);
      const existing = await ctx.db.predictionMatch.findUnique({
        where: { slug },
      });
      if (existing) slug = `${slug}-${Date.now().toString(36)}`;

      return ctx.db.predictionMatch.create({
        data: {
          slug,
          homeTeamId: home.id,
          awayTeamId: away.id,
          sponsorId: input.sponsorId ?? null,
          puckDropAt: input.puckDropAt,
          status: input.publish ? "OPEN" : "DRAFT",
        },
        include: matchInclude,
      });
    }),

  matchUpdate: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        awayTeamId: z.string().optional(),
        sponsorId: z.string().nullable().optional(),
        puckDropAt: z.coerce.date().optional(),
        slug: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...data } = input;
      return ctx.db.predictionMatch.update({
        where: { id },
        data,
        include: matchInclude,
      });
    }),

  matchPublish: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.predictionMatch.update({
        where: { id: input.id },
        data: { status: "OPEN" },
        include: matchInclude,
      });
    }),

  matchClose: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return ctx.db.predictionMatch.update({
        where: { id: input.id },
        data: { status: "CLOSED" },
        include: matchInclude,
      });
    }),

  registerResult: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        homeScore: z.number().int().min(0).max(20),
        awayScore: z.number().int().min(0).max(20),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      return ctx.db.predictionMatch.update({
        where: { id: input.id },
        data: {
          homeScore: input.homeScore,
          awayScore: input.awayScore,
          status: "RESULT_REGISTERED",
        },
        include: matchInclude,
      });
    }),

  correctPredictions: protectedProcedure
    .input(z.object({ matchId: z.string() }))
    .query(async ({ ctx, input }) => {
      const match = await ctx.db.predictionMatch.findUnique({
        where: { id: input.matchId },
      });
      if (match?.homeScore == null || match.awayScore == null) {
        return [];
      }
      return ctx.db.matchPrediction.findMany({
        where: {
          matchId: input.matchId,
          homeGoals: match.homeScore,
          awayGoals: match.awayScore,
        },
        orderBy: { createdAt: "asc" },
      });
    }),

  drawWinner: protectedProcedure
    .input(z.object({ matchId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const match = await ctx.db.predictionMatch.findUnique({
        where: { id: input.matchId },
        include: { winner: true },
      });
      if (match?.homeScore == null || match.awayScore == null) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Register result first",
        });
      }
      if (match.winner) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Winner already drawn",
        });
      }

      const pool = await ctx.db.matchPrediction.findMany({
        where: {
          matchId: input.matchId,
          homeGoals: match.homeScore,
          awayGoals: match.awayScore,
        },
      });
      if (pool.length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No correct predictions",
        });
      }

      const picked = pool[Math.floor(Math.random() * pool.length)]!;

      const winner = await ctx.db.$transaction(async (tx) => {
        const w = await tx.matchWinner.create({
          data: {
            matchId: input.matchId,
            predictionId: picked.id,
          },
          include: { prediction: true },
        });
        await tx.predictionMatch.update({
          where: { id: input.matchId },
          data: { status: "WINNER_PICKED" },
        });
        return w;
      });

      return winner;
    }),

  redrawWinner: protectedProcedure
    .input(z.object({ matchId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const match = await ctx.db.predictionMatch.findUnique({
        where: { id: input.matchId },
        include: { winner: true },
      });
      if (!match?.winner) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No winner yet" });
      }
      const elapsed = Date.now() - match.winner.drawnAt.getTime();
      if (elapsed > 10 * 60 * 1000) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Redraw window expired (10 min)",
        });
      }
      if (match.homeScore == null || match.awayScore == null) {
        throw new TRPCError({ code: "BAD_REQUEST" });
      }

      const pool = await ctx.db.matchPrediction.findMany({
        where: {
          matchId: input.matchId,
          homeGoals: match.homeScore,
          awayGoals: match.awayScore,
          NOT: { id: match.winner.predictionId },
        },
      });
      const source =
        pool.length > 0
          ? pool
          : await ctx.db.matchPrediction.findMany({
              where: {
                matchId: input.matchId,
                homeGoals: match.homeScore,
                awayGoals: match.awayScore,
              },
            });
      const picked = source[Math.floor(Math.random() * source.length)]!;

      return ctx.db.matchWinner.update({
        where: { matchId: input.matchId },
        data: {
          predictionId: picked.id,
          drawnAt: new Date(),
        },
        include: { prediction: true },
      });
    }),
});
