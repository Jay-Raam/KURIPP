import type { UserRole, Permission } from '@kuripp/shared-types';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  OWNER: [
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
  ],
  ADMIN: [
    'document:read',
    'document:create',
    'document:update',
    'document:delete',
    'chat:read',
    'chat:create',
    'chat:delete',
    'research:read',
    'research:create',
    'member:manage',
    'audit:read',
  ],
  MEMBER: [
    'document:read',
    'document:create',
    'document:update',
    'chat:read',
    'chat:create',
    'research:read',
    'research:create',
  ],
  VIEWER: [
    'document:read',
    'chat:read',
    'research:read',
  ],
};

export function hasPermission(role: UserRole, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

export function requirePermission(role: UserRole, permission: Permission): void {
  if (!hasPermission(role, permission)) {
    throw new Error(`Forbidden: Role '${role}' lacks permission '${permission}'`);
  }
}
