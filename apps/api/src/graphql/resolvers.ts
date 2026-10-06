import { SUPPORTED_OPENROUTER_MODELS } from '@kuripp/shared-types';
import { prisma } from '../lib/prisma';
import { redis } from '../lib/redis';
import mongoose from 'mongoose';
import type { GraphQLDataLoaders } from '../lib/dataloaders';
import { AuthService } from '../auth/service';
import {
  REFRESH_COOKIE_NAME,
  REFRESH_COOKIE_OPTIONS,
  hashToken,
} from '../auth/tokens';
import type { Request, Response } from 'express';

export interface GraphQLContext {
  userId?: string | null;
  loaders: GraphQLDataLoaders;
  req?: Request;
  res?: Response;
  request?: globalThis.Request;
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

    mySessions: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      if (!ctx.userId) {
        throw new Error('Unauthorized.');
      }
      const rawRefreshToken = ctx.req?.cookies?.[REFRESH_COOKIE_NAME];
      const currentHash = rawRefreshToken ? hashToken(rawRefreshToken) : undefined;
      return AuthService.getUserSessions(ctx.userId, currentHash);
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

    register: async (
      _: unknown,
      args: { input: { email: string; password: string; fullName: string } },
      ctx: GraphQLContext
    ) => {
      const meta = {
        ipHash: ctx.req?.ip,
        userAgent: ctx.req?.get('user-agent'),
      };

      const result = await AuthService.register(args.input, meta);

      if (ctx.res) {
        ctx.res.cookie(
          REFRESH_COOKIE_NAME,
          result.rawRefreshToken,
          REFRESH_COOKIE_OPTIONS
        );
      }

      return {
        accessToken: result.accessToken,
        user: result.user,
      };
    },

    login: async (
      _: unknown,
      args: { input: { email: string; password: string } },
      ctx: GraphQLContext
    ) => {
      const meta = {
        ipHash: ctx.req?.ip,
        userAgent: ctx.req?.get('user-agent'),
      };

      const result = await AuthService.login(args.input, meta);

      if (ctx.res) {
        ctx.res.cookie(
          REFRESH_COOKIE_NAME,
          result.rawRefreshToken,
          REFRESH_COOKIE_OPTIONS
        );
      }

      return {
        accessToken: result.accessToken,
        user: result.user,
      };
    },

    refreshToken: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      // Extract from HttpOnly cookie
      const rawRefreshToken = ctx.req?.cookies?.[REFRESH_COOKIE_NAME];
      if (!rawRefreshToken) {
        throw new Error('No refresh token cookie found.');
      }

      const meta = {
        ipHash: ctx.req?.ip,
        userAgent: ctx.req?.get('user-agent'),
      };

      const result = await AuthService.refreshSession(rawRefreshToken, meta);

      if (ctx.res) {
        ctx.res.cookie(
          REFRESH_COOKIE_NAME,
          result.newRawRefreshToken,
          REFRESH_COOKIE_OPTIONS
        );
      }

      return {
        accessToken: result.accessToken,
        user: result.user,
      };
    },

    logout: async (_: unknown, __: unknown, ctx: GraphQLContext) => {
      const rawRefreshToken = ctx.req?.cookies?.[REFRESH_COOKIE_NAME];
      if (rawRefreshToken) {
        await AuthService.logout(rawRefreshToken);
      }

      if (ctx.res) {
        ctx.res.clearCookie(REFRESH_COOKIE_NAME, {
          path: '/graphql',
        });
      }

      return true;
    },

    requestPasswordReset: async (
      _: unknown,
      args: { input: { email: string } }
    ) => {
      return AuthService.requestPasswordReset(args.input.email);
    },

    resetPassword: async (
      _: unknown,
      args: { input: { token: string; newPassword: string } }
    ) => {
      return AuthService.resetPassword(args.input.token, args.input.newPassword);
    },

    verifyEmail: async (_: unknown, args: { token: string }) => {
      const record = await prisma.emailVerificationToken.findUnique({
        where: { tokenHash: hashToken(args.token) },
      });

      if (!record || record.isUsed || record.expiresAt < new Date()) {
        throw new Error('Invalid or expired verification link.');
      }

      await prisma.$transaction([
        prisma.user.update({
          where: { id: record.userId },
          data: { emailVerified: true },
        }),
        prisma.emailVerificationToken.update({
          where: { id: record.id },
          data: { isUsed: true },
        }),
      ]);

      return true;
    },

    revokeSession: async (
      _: unknown,
      args: { sessionId: string },
      ctx: GraphQLContext
    ) => {
      if (!ctx.userId) {
        throw new Error('Unauthorized.');
      }
      return AuthService.revokeSession(ctx.userId, args.sessionId);
    },
  },
};
