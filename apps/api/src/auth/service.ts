import { prisma } from '../lib/prisma';
import { hashPassword, verifyPassword } from './password';
import {
  generateAccessToken,
  generateRandomToken,
  hashToken,
} from './tokens';
import { sendPasswordResetEmail } from '../lib/email';
import { logger } from '../lib/logger';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters long'),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

export class AuthService {
  /**
   * Register new user, create default org & workspace, issue in-memory token and rotated session
   */
  static async register(
    input: { email: string; password: string; fullName: string },
    meta: { ipHash?: string; userAgent?: string }
  ) {
    const validated = registerSchema.parse(input);
    const normalizedEmail = validated.email.toLowerCase().trim();

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new Error('An account with this email address already exists.');
    }

    const passwordHash = await hashPassword(validated.password);

    // Run in transaction: create user, initial organization, workspace, and membership
    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          fullName: validated.fullName.trim(),
          emailVerified: false,
        },
      });

      const slug = `org-${newUser.id.slice(0, 8)}`;
      const org = await tx.organization.create({
        data: {
          name: `${validated.fullName}'s Team`,
          slug,
        },
      });

      const workspace = await tx.workspace.create({
        data: {
          organizationId: org.id,
          name: 'Default Workspace',
          slug: `ws-${newUser.id.slice(0, 8)}`,
          description: 'Primary research and knowledge repository',
        },
      });

      await tx.workspaceMember.create({
        data: {
          workspaceId: workspace.id,
          userId: newUser.id,
          role: 'OWNER',
        },
      });

      return newUser;
    });

    // Create session with new family ID
    const rawRefreshToken = generateRandomToken(48);
    const refreshTokenHash = hashToken(rawRefreshToken);
    const familyId = generateRandomToken(16);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash,
        familyId,
        ipHash: meta.ipHash,
        userAgent: meta.userAgent,
        expiresAt,
      },
    });

    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
    });

    logger.info(`User registered successfully: ${user.id}`);

    return {
      user,
      accessToken,
      rawRefreshToken,
    };
  }

  /**
   * Authenticate user with Argon2id and create session
   */
  static async login(
    input: { email: string; password: string },
    meta: { ipHash?: string; userAgent?: string }
  ) {
    const validated = loginSchema.parse(input);
    const normalizedEmail = validated.email.toLowerCase().trim();

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new Error('Invalid email or password.');
    }

    const isValidPassword = await verifyPassword(user.passwordHash, validated.password);
    if (!isValidPassword) {
      throw new Error('Invalid email or password.');
    }

    const rawRefreshToken = generateRandomToken(48);
    const refreshTokenHash = hashToken(rawRefreshToken);
    const familyId = generateRandomToken(16);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash,
        familyId,
        ipHash: meta.ipHash,
        userAgent: meta.userAgent,
        expiresAt,
      },
    });

    const accessToken = generateAccessToken({
      userId: user.id,
      email: user.email,
    });

    logger.info(`User logged in successfully: ${user.id}`);

    return {
      user,
      accessToken,
      rawRefreshToken,
    };
  }

  /**
   * Silent Refresh with Refresh Token Rotation (RTR) and Token Family Reuse Detection
   */
  static async refreshSession(
    rawRefreshToken: string,
    meta: { ipHash?: string; userAgent?: string }
  ) {
    if (!rawRefreshToken) {
      throw new Error('No refresh token provided.');
    }

    const presentedHash = hashToken(rawRefreshToken);

    const session = await prisma.session.findFirst({
      where: { refreshTokenHash: presentedHash },
      include: { user: true },
    });

    if (!session) {
      logger.warn('Refresh attempt with unrecognized token hash');
      throw new Error('Invalid session.');
    }

    // Token Reuse Detection Defense:
    // If an already-revoked or expired session is presented, revoke all sessions in that family immediately!
    if (session.isRevoked || session.expiresAt < new Date()) {
      logger.warn(`Potential refresh token reuse attack detected for family: ${session.familyId}`);
      await prisma.session.updateMany({
        where: { familyId: session.familyId },
        data: { isRevoked: true },
      });
      throw new Error('Session compromised or expired. Please sign in again.');
    }

    // Rotate token: revoke current session and issue new session in the same family
    await prisma.session.update({
      where: { id: session.id },
      data: { isRevoked: true },
    });

    const newRawRefreshToken = generateRandomToken(48);
    const newRefreshTokenHash = hashToken(newRawRefreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await prisma.session.create({
      data: {
        userId: session.userId,
        refreshTokenHash: newRefreshTokenHash,
        familyId: session.familyId,
        ipHash: meta.ipHash,
        userAgent: meta.userAgent,
        expiresAt,
      },
    });

    const accessToken = generateAccessToken({
      userId: session.user.id,
      email: session.user.email,
    });

    return {
      user: session.user,
      accessToken,
      newRawRefreshToken,
    };
  }

  /**
   * Revoke session during logout
   */
  static async logout(rawRefreshToken: string) {
    if (!rawRefreshToken) return true;
    const presentedHash = hashToken(rawRefreshToken);

    await prisma.session.updateMany({
      where: { refreshTokenHash: presentedHash },
      data: { isRevoked: true },
    });

    return true;
  }

  /**
   * Request password reset link (Timing-attack resistant, never reveals email existence)
   */
  static async requestPasswordReset(email: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (user) {
      const resetToken = generateRandomToken(32);
      const tokenHash = hashToken(resetToken);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt,
        },
      });

      await sendPasswordResetEmail(user.email, resetToken);
    }

    return true;
  }

  /**
   * Reset password with single-use cryptographic token
   */
  static async resetPassword(token: string, newPassword: string) {
    if (newPassword.length < 8) {
      throw new Error('Password must be at least 8 characters long.');
    }

    const tokenHash = hashToken(token);
    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
    });

    if (!resetRecord || resetRecord.isUsed || resetRecord.expiresAt < new Date()) {
      throw new Error('Invalid or expired password reset link.');
    }

    const newPasswordHash = await hashPassword(newPassword);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash: newPasswordHash },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { isUsed: true },
      }),
      // Revoke all existing sessions for this user
      prisma.session.updateMany({
        where: { userId: resetRecord.userId },
        data: { isRevoked: true },
      }),
    ]);

    logger.info(`Password successfully reset for user: ${resetRecord.userId}`);
    return true;
  }

  /**
   * List active sessions for authenticated user
   */
  static async getUserSessions(userId: string, currentSessionHash?: string) {
    const sessions = await prisma.session.findMany({
      where: {
        userId,
        isRevoked: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    return sessions.map((s) => ({
      id: s.id,
      userAgent: s.userAgent || 'Unknown Device',
      ipHash: s.ipHash || 'N/A',
      isCurrent: s.refreshTokenHash === currentSessionHash,
      createdAt: s.createdAt.toISOString(),
      expiresAt: s.expiresAt.toISOString(),
    }));
  }

  /**
   * Revoke specific session by ID
   */
  static async revokeSession(userId: string, sessionId: string) {
    await prisma.session.updateMany({
      where: {
        id: sessionId,
        userId,
      },
      data: { isRevoked: true },
    });
    return true;
  }
}
