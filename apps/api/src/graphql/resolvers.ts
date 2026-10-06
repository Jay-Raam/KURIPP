import { SUPPORTED_OPENROUTER_MODELS } from '@kuripp/shared-types';
import { prisma } from '../lib/prisma';
import { redis } from '../lib/redis';
import mongoose from 'mongoose';
import type { GraphQLDataLoaders } from '../lib/dataloaders';
import { AuthService } from '../auth/service';
import { WorkspaceService } from '../workspaces/service';
import { DocumentService } from '../documents/service';
import { IngestionService } from '../documents/ingestion';
import { HybridSearchService } from '../search/hybrid';
import { ChatService } from '../chat/service';
import { CollectionsService } from '../collections/service';
import { ResearchNotesService } from '../notes/service';
import { DeepResearchEngine } from '../research/engine';
import { DocumentComparisonEngine } from '../tools/diff';
import { AiToolRunner } from '../tools/runner';
import { ReportsService } from '../reports/service';
import { AiEvaluationHarness } from '../evaluation/harness';
import type { UserRole } from '@kuripp/shared-types';
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

    workspace: async (_: unknown, args: { id: string }, ctx: GraphQLContext) => {
      if (!ctx.userId) throw new Error('Unauthorized');
      return WorkspaceService.getWorkspace(ctx.userId, args.id);
    },

    workspaceMembers: async (_: unknown, args: { workspaceId: string }, ctx: GraphQLContext) => {
      if (!ctx.userId) throw new Error('Unauthorized');
      return WorkspaceService.getMembers(ctx.userId, args.workspaceId);
    },

    auditLogs: async (_: unknown, args: { workspaceId: string; limit?: number }, ctx: GraphQLContext) => {
      if (!ctx.userId) throw new Error('Unauthorized');
      return WorkspaceService.getAuditLogs(ctx.userId, args.workspaceId, args.limit);
    },

    documents: async (_: unknown, args: { workspaceId: string }, ctx: GraphQLContext) => {
      if (!ctx.userId) throw new Error('Unauthorized');
      return DocumentService.listDocuments(ctx.userId, args.workspaceId);
    },

    document: async (_: unknown, args: { id: string }, ctx: GraphQLContext) => {
      if (!ctx.userId) throw new Error('Unauthorized');
      return DocumentService.getDocument(ctx.userId, args.id);
    },

    documentDownloadUrl: async (_: unknown, args: { id: string }, ctx: GraphQLContext) => {
      if (!ctx.userId) throw new Error('Unauthorized');
      return DocumentService.getDownloadUrl(ctx.userId, args.id, {
        ipHash: ctx.req?.ip,
        userAgent: ctx.req?.get('user-agent'),
      });
    },

    documentChunks: async (_: unknown, args: { documentId: string }, ctx: GraphQLContext) => {
      if (!ctx.userId) throw new Error('Unauthorized');
      return DocumentService.getDocumentChunks(ctx.userId, args.documentId);
    },

    searchKnowledge: async (
      _: unknown,
      args: { input: { workspaceId: string; query: string; limit?: number } },
      ctx: GraphQLContext
    ) => {
      if (!ctx.userId) throw new Error('Unauthorized');
      return HybridSearchService.search(ctx.userId, args.input);
    },

    chatSessions: async (
      _: unknown,
      args: { workspaceId: string },
      ctx: GraphQLContext
    ) => {
      if (!ctx.userId) throw new Error('Unauthorized');
      return ChatService.listSessions(ctx.userId, args.workspaceId);
    },

    chatSession: async (
      _: unknown,
      args: { id: string },
      ctx: GraphQLContext
    ) => {
      if (!ctx.userId) throw new Error('Unauthorized');
      return ChatService.getSession(ctx.userId, args.id);
    },

    whatsAppLogs: async (_: unknown, args: { limit?: number }) => {
      return prisma.whatsAppMessage.findMany({
        take: args.limit || 50,
        orderBy: { createdAt: 'desc' },
      });
    },

    // Phase 8: Collections & Notes
    collections: async (
      _: unknown,
      args: { workspaceId: string },
      ctx: GraphQLContext
    ) => {
      if (!ctx.userId) throw new Error('Unauthorized');
      return CollectionsService.listCollections(ctx.userId, args.workspaceId);
    },

    collection: async (
      _: unknown,
      args: { id: string },
      ctx: GraphQLContext
    ) => {
      if (!ctx.userId) throw new Error('Unauthorized');
      return CollectionsService.getCollection(ctx.userId, args.id);
    },

    collectionDocuments: async (
      _: unknown,
      args: { collectionId: string },
      ctx: GraphQLContext
    ) => {
      if (!ctx.userId) throw new Error('Unauthorized');
      return CollectionsService.getCollectionDocuments(ctx.userId, args.collectionId);
    },

    researchNotes: async (
      _: unknown,
      args: { workspaceId: string; collectionId?: string | null; tag?: string },
      ctx: GraphQLContext
    ) => {
      if (!ctx.userId) throw new Error('Unauthorized');
      return ResearchNotesService.listNotes(ctx.userId, args.workspaceId, {
        collectionId: args.collectionId,
        tag: args.tag,
      });
    },

    researchNote: async (
      _: unknown,
      args: { id: string },
      ctx: GraphQLContext
    ) => {
      if (!ctx.userId) throw new Error('Unauthorized');
      return ResearchNotesService.getNote(ctx.userId, args.id);
    },

    // Phase 9: Document Diffs, Reports & Evaluation
    documentComparisons: async (
      _: unknown,
      args: { workspaceId: string },
      ctx: GraphQLContext
    ) => {
      if (!ctx.userId) throw new Error('Unauthorized');
      return DocumentComparisonEngine.listComparisons(ctx.userId, args.workspaceId);
    },

    documentComparison: async (
      _: unknown,
      args: { id: string },
      ctx: GraphQLContext
    ) => {
      if (!ctx.userId) throw new Error('Unauthorized');
      return DocumentComparisonEngine.getComparison(ctx.userId, args.id);
    },

    generatedReports: async (
      _: unknown,
      args: { workspaceId: string },
      ctx: GraphQLContext
    ) => {
      if (!ctx.userId) throw new Error('Unauthorized');
      return ReportsService.listReports(ctx.userId, args.workspaceId);
    },

    generatedReport: async (
      _: unknown,
      args: { id: string },
      ctx: GraphQLContext
    ) => {
      if (!ctx.userId) throw new Error('Unauthorized');
      return ReportsService.getReport(ctx.userId, args.id);
    },

    runAiEvaluationHarness: async (
      _: unknown,
      args: { workspaceId: string },
      ctx: GraphQLContext
    ) => {
      return AiEvaluationHarness.evaluateWorkspace(args.workspaceId, ctx.userId || 'system-evaluator');
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

    createWorkspace: async (
      _: unknown,
      args: { input: { name: string; slug?: string; description?: string } },
      ctx: GraphQLContext
    ) => {
      if (!ctx.userId) throw new Error('Unauthorized');
      return WorkspaceService.createWorkspace(ctx.userId, args.input, {
        ipHash: ctx.req?.ip,
        userAgent: ctx.req?.get('user-agent'),
      });
    },

    updateWorkspace: async (
      _: unknown,
      args: { id: string; input: { name?: string; description?: string } },
      ctx: GraphQLContext
    ) => {
      if (!ctx.userId) throw new Error('Unauthorized');
      return WorkspaceService.updateWorkspace(ctx.userId, args.id, args.input, {
        ipHash: ctx.req?.ip,
        userAgent: ctx.req?.get('user-agent'),
      });
    },

    deleteWorkspace: async (
      _: unknown,
      args: { id: string },
      ctx: GraphQLContext
    ) => {
      if (!ctx.userId) throw new Error('Unauthorized');
      return WorkspaceService.deleteWorkspace(ctx.userId, args.id, {
        ipHash: ctx.req?.ip,
        userAgent: ctx.req?.get('user-agent'),
      });
    },

    inviteWorkspaceMember: async (
      _: unknown,
      args: { input: { workspaceId: string; email: string; role: UserRole } },
      ctx: GraphQLContext
    ) => {
      if (!ctx.userId) throw new Error('Unauthorized');
      return WorkspaceService.inviteMember(ctx.userId, args.input, {
        ipHash: ctx.req?.ip,
        userAgent: ctx.req?.get('user-agent'),
      });
    },

    updateMemberRole: async (
      _: unknown,
      args: { input: { workspaceId: string; memberId: string; role: UserRole } },
      ctx: GraphQLContext
    ) => {
      if (!ctx.userId) throw new Error('Unauthorized');
      return WorkspaceService.updateMemberRole(ctx.userId, args.input, {
        ipHash: ctx.req?.ip,
        userAgent: ctx.req?.get('user-agent'),
      });
    },

    removeWorkspaceMember: async (
      _: unknown,
      args: { workspaceId: string; memberId: string },
      ctx: GraphQLContext
    ) => {
      if (!ctx.userId) throw new Error('Unauthorized');
      return WorkspaceService.removeMember(ctx.userId, args.workspaceId, args.memberId, {
        ipHash: ctx.req?.ip,
        userAgent: ctx.req?.get('user-agent'),
      });
    },

    createDocumentUpload: async (
      _: unknown,
      args: {
        input: {
          workspaceId: string;
          title: string;
          fileName: string;
          fileSize: number;
          mimeType: string;
        };
      },
      ctx: GraphQLContext
    ) => {
      if (!ctx.userId) throw new Error('Unauthorized');
      return DocumentService.createUpload(ctx.userId, args.input, {
        ipHash: ctx.req?.ip,
        userAgent: ctx.req?.get('user-agent'),
      });
    },

    confirmDocumentUpload: async (
      _: unknown,
      args: {
        input: {
          documentId: string;
          checksum?: string | null;
        };
      },
      ctx: GraphQLContext
    ) => {
      if (!ctx.userId) throw new Error('Unauthorized');
      return DocumentService.confirmUpload(ctx.userId, args.input, {
        ipHash: ctx.req?.ip,
        userAgent: ctx.req?.get('user-agent'),
      });
    },

    processDocument: async (
      _: unknown,
      args: { id: string },
      ctx: GraphQLContext
    ) => {
      if (!ctx.userId) throw new Error('Unauthorized');
      return IngestionService.processDocument(ctx.userId, args.id, {
        ipHash: ctx.req?.ip,
        userAgent: ctx.req?.get('user-agent'),
      });
    },

    deleteDocument: async (
      _: unknown,
      args: { id: string },
      ctx: GraphQLContext
    ) => {
      if (!ctx.userId) throw new Error('Unauthorized');
      return DocumentService.deleteDocument(ctx.userId, args.id, {
        ipHash: ctx.req?.ip,
        userAgent: ctx.req?.get('user-agent'),
      });
    },

    createChatSession: async (
      _: unknown,
      args: {
        input: {
          workspaceId: string;
          title?: string | null;
          mode?: string | null;
          model?: string | null;
        };
      },
      ctx: GraphQLContext
    ) => {
      if (!ctx.userId) throw new Error('Unauthorized');
      return ChatService.createSession(ctx.userId, args.input);
    },

    sendMessage: async (
      _: unknown,
      args: {
        input: {
          sessionId: string;
          workspaceId: string;
          content: string;
          mode?: string | null;
          model?: string | null;
        };
      },
      ctx: GraphQLContext
    ) => {
      if (!ctx.userId) throw new Error('Unauthorized');
      return ChatService.sendMessage(ctx.userId, args.input);
    },

    deleteChatSession: async (
      _: unknown,
      args: { id: string },
      ctx: GraphQLContext
    ) => {
      if (!ctx.userId) throw new Error('Unauthorized');
      return ChatService.deleteSession(ctx.userId, args.id);
    },

    // Phase 8: Collections & Notes Mutations
    createCollection: async (
      _: unknown,
      args: { input: any },
      ctx: GraphQLContext
    ) => {
      if (!ctx.userId) throw new Error('Unauthorized');
      return CollectionsService.createCollection(ctx.userId, args.input);
    },

    updateCollection: async (
      _: unknown,
      args: { id: string; input: any },
      ctx: GraphQLContext
    ) => {
      if (!ctx.userId) throw new Error('Unauthorized');
      return CollectionsService.updateCollection(ctx.userId, args.id, args.input);
    },

    deleteCollection: async (
      _: unknown,
      args: { id: string },
      ctx: GraphQLContext
    ) => {
      if (!ctx.userId) throw new Error('Unauthorized');
      return CollectionsService.deleteCollection(ctx.userId, args.id);
    },

    addDocumentToCollection: async (
      _: unknown,
      args: { input: { collectionId: string; documentId: string } },
      ctx: GraphQLContext
    ) => {
      if (!ctx.userId) throw new Error('Unauthorized');
      return CollectionsService.addDocument(ctx.userId, args.input.collectionId, args.input.documentId);
    },

    removeDocumentFromCollection: async (
      _: unknown,
      args: { input: { collectionId: string; documentId: string } },
      ctx: GraphQLContext
    ) => {
      if (!ctx.userId) throw new Error('Unauthorized');
      return CollectionsService.removeDocument(ctx.userId, args.input.collectionId, args.input.documentId);
    },

    createResearchNote: async (
      _: unknown,
      args: { input: any },
      ctx: GraphQLContext
    ) => {
      if (!ctx.userId) throw new Error('Unauthorized');
      return ResearchNotesService.createNote(ctx.userId, args.input);
    },

    updateResearchNote: async (
      _: unknown,
      args: { id: string; input: any },
      ctx: GraphQLContext
    ) => {
      if (!ctx.userId) throw new Error('Unauthorized');
      return ResearchNotesService.updateNote(ctx.userId, args.id, args.input);
    },

    deleteResearchNote: async (
      _: unknown,
      args: { id: string },
      ctx: GraphQLContext
    ) => {
      if (!ctx.userId) throw new Error('Unauthorized');
      return ResearchNotesService.deleteNote(ctx.userId, args.id);
    },

    runDeepResearch: async (
      _: unknown,
      args: { input: any },
      ctx: GraphQLContext
    ) => {
      if (!ctx.userId) throw new Error('Unauthorized');
      return DeepResearchEngine.runDeepResearch(ctx.userId, args.input);
    },

    // Phase 9: Document Diff, AI Tools & Reports Mutations
    compareDocuments: async (
      _: unknown,
      args: { input: any },
      ctx: GraphQLContext
    ) => {
      if (!ctx.userId) throw new Error('Unauthorized');
      return DocumentComparisonEngine.compareDocuments(ctx.userId, args.input);
    },

    executeAiTool: async (
      _: unknown,
      args: { input: any },
      ctx: GraphQLContext
    ) => {
      if (!ctx.userId) throw new Error('Unauthorized');
      return AiToolRunner.execute(ctx.userId, args.input);
    },

    generateReport: async (
      _: unknown,
      args: { input: any },
      ctx: GraphQLContext
    ) => {
      if (!ctx.userId) throw new Error('Unauthorized');
      return ReportsService.generateReport(ctx.userId, args.input);
    },

    deleteReport: async (
      _: unknown,
      args: { id: string },
      ctx: GraphQLContext
    ) => {
      if (!ctx.userId) throw new Error('Unauthorized');
      return ReportsService.deleteReport(ctx.userId, args.id);
    },
  },

  Document: {
    chunkCount: async (parent: { id: string }) => {
      return DocumentService.getChunkCount(parent.id);
    },
  },
};
