import { describe, it, expect } from 'vitest';
import { hasPermission, requirePermission, ROLE_PERMISSIONS } from '../src/workspaces/rbac';
import type { UserRole, Permission } from '@kuripp/shared-types';

describe('Phase 3: Multi-Tenant RBAC Authorization Suite', () => {
  it('grants OWNER unrestricted permissions across all capabilities', () => {
    const ownerPermissions = ROLE_PERMISSIONS.OWNER;
    const allKnownPermissions: Permission[] = [
      'document:read',
      'document:create',
      'document:update',
      'document:delete',
      'chat:read',
      'chat:create',
      'chat:delete',
      'research:read',
      'research:create',
      'workspace:manage',
      'member:manage',
      'audit:read',
    ];

    for (const perm of allKnownPermissions) {
      expect(hasPermission('OWNER', perm)).toBe(true);
      expect(ownerPermissions.includes(perm)).toBe(true);
    }
  });

  it('restricts VIEWER strictly to read operations and blocks mutations', () => {
    expect(hasPermission('VIEWER', 'document:read')).toBe(true);
    expect(hasPermission('VIEWER', 'chat:read')).toBe(true);
    expect(hasPermission('VIEWER', 'research:read')).toBe(true);

    expect(hasPermission('VIEWER', 'document:create')).toBe(false);
    expect(hasPermission('VIEWER', 'document:delete')).toBe(false);
    expect(hasPermission('VIEWER', 'workspace:manage')).toBe(false);
    expect(hasPermission('VIEWER', 'member:manage')).toBe(false);
    expect(hasPermission('VIEWER', 'audit:read')).toBe(false);
  });

  it('prevents standard MEMBER from modifying workspace settings or managing members', () => {
    expect(hasPermission('MEMBER', 'document:create')).toBe(true);
    expect(hasPermission('MEMBER', 'chat:create')).toBe(true);

    expect(hasPermission('MEMBER', 'workspace:manage')).toBe(false);
    expect(hasPermission('MEMBER', 'member:manage')).toBe(false);
    expect(hasPermission('MEMBER', 'document:delete')).toBe(false);
    expect(hasPermission('MEMBER', 'audit:read')).toBe(false);
  });

  it('throws a typed Forbidden exception when requirePermission fails', () => {
    expect(() => requirePermission('VIEWER', 'document:create')).toThrowError(
      /Forbidden: Role 'VIEWER' lacks permission 'document:create'/
    );

    expect(() => requirePermission('MEMBER', 'workspace:manage')).toThrowError(
      /Forbidden: Role 'MEMBER' lacks permission 'workspace:manage'/
    );

    expect(() => requirePermission('OWNER', 'workspace:manage')).not.toThrow();
  });
});
