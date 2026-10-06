import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import type { CookieOptions } from 'express';

export const REFRESH_COOKIE_NAME = 'kuripp_refresh_token';

export const REFRESH_COOKIE_OPTIONS: CookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/graphql',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
};

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export function generateRandomToken(bytes = 32): string {
  return crypto.randomBytes(bytes).toString('hex');
}

export function generateAccessToken(payload: { userId: string; email: string }): string {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: '15m', // Short-lived access token strictly kept in client memory
    issuer: 'kuripp-api',
  });
}

export function verifyAccessToken(token: string): { userId: string; email: string } | null {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET, {
      issuer: 'kuripp-api',
    }) as { userId: string; email: string };
    return decoded;
  } catch {
    return null;
  }
}
