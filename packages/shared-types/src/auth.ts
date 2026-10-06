export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  emailVerified: boolean;
  avatarUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthTokens {
  accessToken: string; // Exists strictly in client memory
  expiresIn: number;    // seconds
}

export interface AuthSession {
  id: string;
  userId: string;
  familyId: string;
  ipHash?: string;
  userAgent?: string;
  isRevoked: boolean;
  createdAt: string;
  expiresAt: string;
}

export type UserRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

export type Permission =
  | 'document:read'
  | 'document:create'
  | 'document:update'
  | 'document:delete'
  | 'chat:read'
  | 'chat:create'
  | 'chat:delete'
  | 'research:read'
  | 'research:create'
  | 'workspace:manage'
  | 'member:manage'
  | 'audit:read';
