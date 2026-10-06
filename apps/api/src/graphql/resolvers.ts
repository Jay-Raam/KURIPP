import { SUPPORTED_OPENROUTER_MODELS } from '@kuripp/shared-types';
import { prisma } from '../lib/prisma';
import { redis } from '../lib/redis';
import mongoose from 'mongoose';
import type { GraphQLDataLoaders } from '../lib/dataloaders';

export interface GraphQLContext {
  userId?: string | null;
  loaders: GraphQLDataLoaders;
  req: any;
  res: any;
}

export const resolvers = {
  Query: {
    health: async () => {
      let postgresOk = false;
      let redisOk = false;
      const mongoOk = mongoose.connection.readyState === 1;

      try {
        await prisma.$queryRaw`SELECT 1`;
        postgresOk = true;
      } catch {
        postgresOk = false;
      }

      try {
        if (redis.status === 'ready' || redis.status === 'connect') {
          await redis.ping();
          redisOk = true;
        }
      } catch {
        redisOk = false;
      }

      return {
        status: 'UP',
        version: '0.1.0',
        uptimeSeconds: process.uptime(),
        timestamp: new Date().toISOString(),
        postgres: postgresOk,
        mongodb: mongoOk,
        redis: redisOk,
      };
    },

    openRouterModels: () => {
      return SUPPORTED_OPENROUTER_MODELS;
    },

    me: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      if (!ctx.userId) return null;
      return ctx.loaders.userLoader.load(ctx.userId);
    },

    myWorkspaces: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      if (!ctx.userId) return [];
      const memberships = await prisma.workspaceMember.findMany({
        where: { userId: ctx.userId },
        include: { workspace: true },
      });
      return memberships.map((m) => ({
        ...m.workspace,
        role: m.role,
      }));
    },

    documents: async (_: unknown, args: { workspaceId: string }) => {
      const docs = await prisma.document.findMany({
        where: { workspaceId: args.workspaceId },
        orderBy: { createdAt: 'desc' },
      });
      return docs.map((d) => ({
        ...d,
        fileSize: Number(d.fileSize),
      }));
    },

    whatsAppLogs: async (_: unknown, args: { limit?: number }) => {
      return prisma.whatsAppMessage.findMany({
        take: args.limit || 50,
        orderBy: { createdAt: 'desc' },
      });
    },
  },

  Mutation: {
    healthPing: () => {
      return 'pong';
    },

    register: async () => {
      throw new Error('Register will be fully wired in Phase 2');
    },

    login: async () => {
      throw new Error('Login will be fully wired in Phase 2');
    },

    logout: () => {
      return true;
    },

    refreshToken: async () => {
      throw new Error('RefreshToken will be fully wired in Phase 2');
    },
  },
};
