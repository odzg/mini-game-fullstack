import { ORPCError, os } from '@orpc/server';
import { z } from 'zod';

import { prisma } from './prisma.ts';
import type { SessionUser } from './session.ts';

interface RpcContext {
  user: SessionUser | null;
}

const listInputSchema = z
  .object({
    limit: z.number().int().min(1).max(50).default(10),
  })
  .optional();

const saveResultInputSchema = z.object({
  durationMs: z.number().int().min(1).max(60_000),
  score: z.number().int().min(0),
});

const base = os.$context<RpcContext>();

const authed = base.use(({ context, next }) => {
  if (context.user === null) {
    throw new ORPCError('UNAUTHORIZED');
  }

  return next({ context: { user: context.user } });
});

const saveResult = authed
  .input(saveResultInputSchema)
  .handler(async ({ context, input }) => {
    const result = await prisma.gameResult.create({
      data: {
        durationMs: input.durationMs,
        score: input.score,
        userId: context.user.id,
      },
      select: {
        createdAt: true,
        durationMs: true,
        id: true,
        score: true,
      },
    });

    return result;
  });

const listMyHistory = authed.input(listInputSchema).handler(async ({ context, input }) => {
  const results = await prisma.gameResult.findMany({
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      createdAt: true,
      durationMs: true,
      id: true,
      score: true,
    },
    take: input?.limit ?? 10,
    where: {
      userId: context.user.id,
    },
  });

  return results;
});

const listLeaderboard = base.input(listInputSchema).handler(async ({ input }) => {
  const results = await prisma.gameResult.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: [{ score: 'desc' }, { createdAt: 'asc' }],
    take: input?.limit ?? 10,
  });

  return results.map((result) => ({
    createdAt: result.createdAt,
    playerId: result.user.id,
    playerName: result.user.name ?? 'Anonymous Player',
    resultId: result.id,
    score: result.score,
  }));
});

export const rpcRouter = {
  game: {
    myHistory: listMyHistory,
    saveResult,
  },
  leaderboard: {
    list: listLeaderboard,
  },
};
