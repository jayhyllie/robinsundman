import { companyRouter, leaderboardRouter, participantRouter, questionRouter, quizRouter, tenantRouter } from "~/server/api/routers/quiz";
import { tipsRouter } from "~/server/api/routers/tips";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

export const appRouter = createTRPCRouter({
  company: companyRouter,
  question: questionRouter,
  quiz: quizRouter,
  participant: participantRouter,
  leaderboard: leaderboardRouter,
  tenant: tenantRouter,
  tips: tipsRouter,
});

export type AppRouter = typeof appRouter;
export const createCaller = createCallerFactory(appRouter);
