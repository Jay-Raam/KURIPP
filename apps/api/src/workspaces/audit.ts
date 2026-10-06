import { prisma } from '../lib/prisma';
import { logger } from '../lib/logger';

export interface AuditLogData {
  userId?: string | null;
  workspaceId?: string | null;
  action: string;
  resourceType: string;
  resourceId?: string | null;
  ipHash?: string | null;
  userAgent?: string | null;
  metadata?: Record<string, unknown> | null;
}

export async function logAuditEvent(data: AuditLogData): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: data.userId || null,
        workspaceId: data.workspaceId || null,
        action: data.action,
        resourceType: data.resourceType,
        resourceId: data.resourceId || null,
        ipHash: data.ipHash || null,
        userAgent: data.userAgent || null,
        metadata: data.metadata ? (data.metadata as any) : undefined,
      },
    });
  } catch (err) {
    logger.error('Failed to persist audit log record:', { error: err });
  }
}
