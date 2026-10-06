import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword } from '../src/auth/password';
import {
  generateAccessToken,
  verifyAccessToken,
  hashToken,
  generateRandomToken,
} from '../src/auth/tokens';

describe('Phase 2: Authentication Security Suite', () => {
  describe('Argon2id Password Hashing', () => {
    it('hashes passwords using Argon2id and verifies matches correctly', async () => {
      const plainPassword = 'CorrectHorseBatteryStaple123!';
      const hash = await hashPassword(plainPassword);

      // Verify Argon2id format
      expect(hash).toContain('$argon2id$');

      // Verify valid match
      const isMatch = await verifyPassword(hash, plainPassword);
      expect(isMatch).toBe(true);

      // Verify mismatch
      const isWrongMatch = await verifyPassword(hash, 'WrongPassword456!');
      expect(isWrongMatch).toBe(false);
    });

    it('generates distinct salt hashes for identical plain passwords', async () => {
      const password = 'SamePasswordTwice!';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
      expect(await verifyPassword(hash1, password)).toBe(true);
      expect(await verifyPassword(hash2, password)).toBe(true);
    });
  });

  describe('JWT Access Token Lifecycle (In-Memory Only)', () => {
    it('generates a valid short-lived JWT signed with JWT_SECRET', () => {
      const payload = { userId: 'usr_abc123', email: 'test@kuripp.local' };
      const token = generateAccessToken(payload);

      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3);

      const decoded = verifyAccessToken(token);
      expect(decoded).not.toBeNull();
      expect(decoded?.userId).toBe('usr_abc123');
      expect(decoded?.email).toBe('test@kuripp.local');
    });

    it('rejects tampered or forged JWT tokens', () => {
      const token = generateAccessToken({ userId: 'usr_valid', email: 'valid@kuripp.local' });
      const tampered = token.slice(0, -6) + 'abcdef';

      const decoded = verifyAccessToken(tampered);
      expect(decoded).toBeNull();
    });
  });

  describe('Cryptographic Token Hashing & Rotation', () => {
    it('hashes refresh tokens deterministically using SHA-256 before database storage', () => {
      const rawToken = generateRandomToken(48);
      const hash1 = hashToken(rawToken);
      const hash2 = hashToken(rawToken);

      expect(hash1).toBe(hash2);
      expect(hash1.length).toBe(64); // SHA-256 hex digest length
      expect(rawToken).not.toBe(hash1); // Never store raw token
    });
  });
});
