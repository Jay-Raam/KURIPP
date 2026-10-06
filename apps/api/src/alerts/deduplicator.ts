import { createHash } from 'crypto';
import { redis } from '../lib/redis';
import { logger } from '../lib/logger';

export class AlertDeduplicator {
  private static memoryFingerprints = new Map<string, number>();

  /**
   * Generates a deterministic fingerprint for an alert
   */
  static generateFingerprint(alertType: string, keyPayload: string): string {
    const raw = `${alertType}:${keyPayload.trim().toLowerCase().slice(0, 200)}`;
    return createHash('sha256').update(raw).digest('hex').slice(0, 16);
  }

  /**
   * Determines if the alert is a duplicate within the cooldown window (default: 15 mins / 900s)
   */
  static async isDuplicate(
    alertType: string,
    keyPayload: string,
    cooldownSeconds: number = 900
  ): Promise<boolean> {
    const fingerprint = this.generateFingerprint(alertType, keyPayload);
    const redisKey = `kuripp:alert:dedup:${fingerprint}`;

    try {
      if (redis.status === 'ready' || redis.status === 'connect') {
        const result = await redis.set(redisKey, '1', 'EX', cooldownSeconds, 'NX');
        // If NX was not acquired, key already existed => duplicate
        if (!result) {
          logger.info('Duplicate alert suppressed by Redis deduplicator', { fingerprint, alertType });
          return true;
        }
        return false;
      }
    } catch {
      // Fall through to memory
    }

    // In-memory fallback
    const now = Date.now();
    const expiry = this.memoryFingerprints.get(fingerprint);
    if (expiry && now < expiry) {
      logger.info('Duplicate alert suppressed by in-memory deduplicator', { fingerprint, alertType });
      return true;
    }

    this.memoryFingerprints.set(fingerprint, now + cooldownSeconds * 1000);
    return false;
  }
}
