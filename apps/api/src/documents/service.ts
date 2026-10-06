import { prisma } from '../lib/prisma';
import { WorkspaceService } from '../workspaces/service';
import { requirePermission } from '../workspaces/rbac';
import { logAuditEvent } from '../workspaces/audit';
import { StorageService } from './storage';
import { randomUUID } from 'crypto';
import { z } from 'zod';

export const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'text/csv',
  'application/csv',
  'text/plain',
  'text/markdown',
  'text/x-markdown',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
  'image/tiff',
  'text/html',
]);

export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024; // 50MB

const createUploadSchema = z.object({
  workspaceId: z.string().uuid(),
  title: z.string().min(1, 'Title is required').max(255),
  fileName: z.string().min(1, 'File name is required').max(255),
  fileSize: z.number().positive().max(MAX_FILE_SIZE_BYTES, 'File size exceeds maximum 50MB limit'),
  mimeType: z.string().refine((mime) => ALLOWED_MIME_TYPES.has(mime.toLowerCase()), {
    message: 'Unsupported file type. Supported types: PDF, DOCX, PPTX, XLSX, CSV, TXT, Markdown, Images, HTML.',
  }),
});

function sanitizeFileName(fileName: string): string {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export class DocumentService {
  /**
   * Initializes a document record in PostgreSQL and generates a presigned S3 PUT URL
   */
  static async createUpload(
    userId: string,
    input: {
      workspaceId: string;
      title: string;
      fileName: string;
      fileSize: number;
      mimeType: string;
    },
    meta: { ipHash?: string; userAgent?: string } = {}
  ) {
    const validated = createUploadSchema.parse(input);

    const role = await WorkspaceService.getMemberRole(userId, validated.workspaceId);
    if (!role) {
      throw new Error('Access denied: You are not a member of this workspace.');
    }
    requirePermission(role, 'document:create');

    const sanitized = sanitizeFileName(validated.fileName);
    const objectKey = `workspaces/${validated.workspaceId}/docs/${randomUUID()}-${sanitized}`;

    const document = await prisma.document.create({
      data: {
        workspaceId: validated.workspaceId,
        title: validated.title,
        mimeType: validated.mimeType.toLowerCase(),
        fileSize: BigInt(Math.round(validated.fileSize)),
        r2ObjectKey: objectKey,
        status: 'UPLOADING',
        currentVersion: 1,
      },
    });

    const uploadUrl = await StorageService.getPresignedUploadUrl(
      objectKey,
      validated.mimeType.toLowerCase(),
      900 // 15 minutes
    );

    await logAuditEvent({
      userId,
      workspaceId: validated.workspaceId,
      action: 'DOCUMENT_UPLOAD_INITIATED',
      resourceType: 'Document',
      resourceId: document.id,
      ipHash: meta.ipHash,
      userAgent: meta.userAgent,
      metadata: {
        title: validated.title,
        fileName: validated.fileName,
        fileSize: validated.fileSize,
        mimeType: validated.mimeType,
        objectKey,
      },
    });

    return {
      documentId: document.id,
      uploadUrl,
      objectKey,
      expiresInSeconds: 900,
    };
  }

  /**
   * Confirms client direct upload to S3 completed and marks document as UPLOADED
   */
  static async confirmUpload(
    userId: string,
    input: { documentId: string; checksum?: string | null },
    meta: { ipHash?: string; userAgent?: string } = {}
  ) {
    const document = await prisma.document.findUnique({
      where: { id: input.documentId },
    });

    if (!document) {
      throw new Error('Document not found.');
    }

    const role = await WorkspaceService.getMemberRole(userId, document.workspaceId);
    if (!role) {
      throw new Error('Access denied: You are not a member of this workspace.');
    }
    requirePermission(role, 'document:create');

    if (document.status !== 'UPLOADING') {
      throw new Error(`Document status cannot be confirmed from current status: ${document.status}`);
    }

    const updated = await prisma.document.update({
      where: { id: document.id },
      data: {
        status: 'UPLOADED',
      },
    });

    await logAuditEvent({
      userId,
      workspaceId: document.workspaceId,
      action: 'DOCUMENT_UPLOAD_CONFIRMED',
      resourceType: 'Document',
      resourceId: document.id,
      ipHash: meta.ipHash,
      userAgent: meta.userAgent,
      metadata: {
        checksum: input.checksum ?? null,
      },
    });

    return {
      ...updated,
      fileSize: Number(updated.fileSize),
    };
  }

  /**
   * Generates presigned GET download URL with access-control verification
   */
  static async getDownloadUrl(
    userId: string,
    documentId: string,
    meta: { ipHash?: string; userAgent?: string } = {}
  ) {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new Error('Document not found.');
    }

    const role = await WorkspaceService.getMemberRole(userId, document.workspaceId);
    if (!role) {
      throw new Error('Access denied: You are not a member of this workspace.');
    }
    requirePermission(role, 'document:read');

    const downloadUrl = await StorageService.getPresignedDownloadUrl(document.r2ObjectKey, 900);

    await logAuditEvent({
      userId,
      workspaceId: document.workspaceId,
      action: 'DOCUMENT_DOWNLOADED',
      resourceType: 'Document',
      resourceId: document.id,
      ipHash: meta.ipHash,
      userAgent: meta.userAgent,
      metadata: {
        title: document.title,
      },
    });

    return {
      downloadUrl,
      expiresInSeconds: 900,
    };
  }

  /**
   * Deletes document from storage and database
   */
  static async deleteDocument(
    userId: string,
    documentId: string,
    meta: { ipHash?: string; userAgent?: string } = {}
  ): Promise<boolean> {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new Error('Document not found.');
    }

    const role = await WorkspaceService.getMemberRole(userId, document.workspaceId);
    if (!role) {
      throw new Error('Access denied: You are not a member of this workspace.');
    }
    requirePermission(role, 'document:delete');

    // Remove from S3
    await StorageService.deleteObject(document.r2ObjectKey);

    // Remove from database (cascades to chunks)
    await prisma.document.delete({
      where: { id: document.id },
    });

    await logAuditEvent({
      userId,
      workspaceId: document.workspaceId,
      action: 'DOCUMENT_DELETED',
      resourceType: 'Document',
      resourceId: document.id,
      ipHash: meta.ipHash,
      userAgent: meta.userAgent,
      metadata: {
        title: document.title,
        r2ObjectKey: document.r2ObjectKey,
      },
    });

    return true;
  }

  /**
   * Lists all documents in a workspace after verifying document:read permission
   */
  static async listDocuments(userId: string, workspaceId: string) {
    const role = await WorkspaceService.getMemberRole(userId, workspaceId);
    if (!role) {
      throw new Error('Access denied: You are not a member of this workspace.');
    }
    requirePermission(role, 'document:read');

    const docs = await prisma.document.findMany({
      where: { workspaceId },
      orderBy: { createdAt: 'desc' },
    });

    return docs.map((d) => ({
      ...d,
      fileSize: Number(d.fileSize),
    }));
  }

  /**
   * Retrieves single document after verifying document:read permission
   */
  static async getDocument(userId: string, documentId: string) {
    const doc = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!doc) {
      return null;
    }

    const role = await WorkspaceService.getMemberRole(userId, doc.workspaceId);
    if (!role) {
      throw new Error('Access denied: You are not a member of this workspace.');
    }
    requirePermission(role, 'document:read');

    return {
      ...doc,
      fileSize: Number(doc.fileSize),
    };
  }
}
