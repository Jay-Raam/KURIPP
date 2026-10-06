import { describe, it, expect } from 'vitest';
import { ALLOWED_MIME_TYPES, MAX_FILE_SIZE_BYTES } from '../src/documents/service';
import { StorageService } from '../src/documents/storage';
import { hasPermission, requirePermission } from '../src/workspaces/rbac';

describe('Phase 4: Document Vault & Storage Service Test Suite', () => {
  describe('Document Validation Rules', () => {
    it('accepts all allowed enterprise research MIME types', () => {
      const enterpriseMimeTypes = [
        'application/pdf',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/csv',
        'text/plain',
        'text/markdown',
        'image/png',
        'image/jpeg',
        'text/html',
      ];

      for (const mime of enterpriseMimeTypes) {
        expect(ALLOWED_MIME_TYPES.has(mime)).toBe(true);
      }
    });

    it('strictly rejects unauthorized or dangerous file types', () => {
      const dangerousMimeTypes = [
        'application/x-msdownload',
        'application/x-sh',
        'application/javascript',
        'application/x-bat',
        'application/octet-stream',
      ];

      for (const mime of dangerousMimeTypes) {
        expect(ALLOWED_MIME_TYPES.has(mime)).toBe(false);
      }
    });

    it('enforces maximum 50MB file size boundary', () => {
      expect(MAX_FILE_SIZE_BYTES).toBe(50 * 1024 * 1024);
      const oversized = 50 * 1024 * 1024 + 1;
      expect(oversized > MAX_FILE_SIZE_BYTES).toBe(true);
    });
  });

  describe('Storage Presigning Service', () => {
    it('generates presigned PUT upload URL with proper expiry and parameters', async () => {
      const objectKey = 'workspaces/ws-123/docs/sample-test.pdf';
      const uploadUrl = await StorageService.getPresignedUploadUrl(
        objectKey,
        'application/pdf',
        900
      );

      expect(uploadUrl).toBeDefined();
      expect(typeof uploadUrl).toBe('string');
      expect(uploadUrl).toContain('X-Amz-Signature');
      expect(uploadUrl).toContain('X-Amz-Expires=900');
    });

    it('generates presigned GET download URL with access constraints', async () => {
      const objectKey = 'workspaces/ws-123/docs/sample-test.pdf';
      const downloadUrl = await StorageService.getPresignedDownloadUrl(
        objectKey,
        900
      );

      expect(downloadUrl).toBeDefined();
      expect(typeof downloadUrl).toBe('string');
      expect(downloadUrl).toContain('X-Amz-Signature');
      expect(downloadUrl).toContain('X-Amz-Expires=900');
    });
  });

  describe('Document Vault RBAC Enforcement', () => {
    it('allows OWNER and ADMIN to perform full document lifecycle (upload, read, delete)', () => {
      for (const role of ['OWNER', 'ADMIN'] as const) {
        expect(hasPermission(role, 'document:create')).toBe(true);
        expect(hasPermission(role, 'document:read')).toBe(true);
        expect(hasPermission(role, 'document:delete')).toBe(true);
      }
    });

    it('allows MEMBER to create and read documents, but forbids deletion', () => {
      expect(hasPermission('MEMBER', 'document:create')).toBe(true);
      expect(hasPermission('MEMBER', 'document:read')).toBe(true);
      expect(hasPermission('MEMBER', 'document:delete')).toBe(false);

      expect(() => requirePermission('MEMBER', 'document:delete')).toThrowError(
        /Forbidden: Role 'MEMBER' lacks permission 'document:delete'/
      );
    });

    it('strictly confines VIEWER to document:read and denies upload or deletion', () => {
      expect(hasPermission('VIEWER', 'document:read')).toBe(true);
      expect(hasPermission('VIEWER', 'document:create')).toBe(false);
      expect(hasPermission('VIEWER', 'document:delete')).toBe(false);

      expect(() => requirePermission('VIEWER', 'document:create')).toThrowError(
        /Forbidden: Role 'VIEWER' lacks permission 'document:create'/
      );
      expect(() => requirePermission('VIEWER', 'document:delete')).toThrowError(
        /Forbidden: Role 'VIEWER' lacks permission 'document:delete'/
      );
    });
  });
});
