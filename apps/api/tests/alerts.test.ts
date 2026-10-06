import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WhatsAppProvider } from '../src/alerts/whatsapp';
import { AlertDeduplicator } from '../src/alerts/deduplicator';
import { AlertsService } from '../src/alerts/service';

describe('Phase 10: Proactive WhatsApp & Email Alerting Test Suite', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('Content Sanitization', () => {
    it('redacts sensitive Bearer tokens, database connection URLs, and API keys', () => {
      const sensitiveRaw = `Fatal worker error connecting to postgres://postgres:SecretDbPass123@db.kuripp.internal:5432/prod.
Authorization failed with header: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.sig
OpenRouter call failed using sk-or-v1-abcdef1234567890abcdef1234567890.`;

      const sanitized = WhatsAppProvider.sanitizeContent(sensitiveRaw);

      expect(sanitized).not.toContain('SecretDbPass123');
      expect(sanitized).toContain('postgres://[USER]:[REDACTED_SECRET]@');
      expect(sanitized).not.toContain('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
      expect(sanitized).toContain('Bearer [REDACTED_JWT]');
      expect(sanitized).not.toContain('sk-or-v1-abcdef1234567890abcdef1234567890');
      expect(sanitized).toContain('[REDACTED_API_KEY]');
    });
  });

  describe('Alert Deduplication with 15m Cooldown', () => {
    it('allows initial alert and suppresses duplicate alerts within cooldown window', async () => {
      const alertType = 'test-worker-crash';
      const payload = 'DocumentIngestionWorker: OOM on file large-scan.pdf';

      const isFirstDup = await AlertDeduplicator.isDuplicate(alertType, payload, 900);
      expect(isFirstDup).toBe(false);

      const isSecondDup = await AlertDeduplicator.isDuplicate(alertType, payload, 900);
      expect(isSecondDup).toBe(true);
    });
  });

  describe('WhatsApp Message Lifecycle', () => {
    it('creates alert with SENT status and updates status to DELIVERED and READ on receipt', async () => {
      const record = await WhatsAppProvider.sendAlert({
        recipientNumber: '+1234567890',
        templateName: 'APP_ERROR_ALERT',
        severity: 'CRITICAL',
        content: 'Database connection latency exceeded 5000ms threshold.',
      });

      expect(record).toBeDefined();
      expect(record.status).toBe('SENT');
      expect(record.externalMessageId).toBeDefined();

      // Simulate webhook delivery receipt
      const deliveredOk = await WhatsAppProvider.updateDeliveryStatus(
        record.externalMessageId!,
        'DELIVERED'
      );
      expect(deliveredOk).toBe(true);

      // Simulate webhook read receipt
      const readOk = await WhatsAppProvider.updateDeliveryStatus(
        record.externalMessageId!,
        'READ'
      );
      expect(readOk).toBe(true);
    });
  });

  describe('Application Error & CI Failure Dispatch', () => {
    it('formats and dispatches application error alert', async () => {
      const alert = await AlertsService.sendApplicationErrorAlert({
        error: new Error('Vector projection dimension mismatch: expected 1536 got 768'),
        context: 'Embedding Engine Worker',
        severity: 'ERROR',
      });

      expect(alert).toBeDefined();
      expect(alert?.templateName).toBe('APP_ERROR_ALERT');
      expect(alert?.contentSummary).toContain('Vector projection');
    });

    it('formats and dispatches CI/CD pipeline failure alert', async () => {
      const ciAlert = await AlertsService.sendCiFailureAlert({
        branch: 'feature/phase-10-11-alerting-hardening-cicd',
        commit: 'a1b2c3d4e5f6',
        author: 'Jay-Raam',
        jobName: 'Python Document Parser Tests',
        runUrl: 'https://github.com/Jay-Raam/KURIPP/actions/runs/123456789',
        failureReason: 'AssertionError: parsed chunks count (0) != expected (12)',
      });

      expect(ciAlert).toBeDefined();
      expect(ciAlert?.templateName).toBe('CI_FAILURE_ALERT');
      expect(ciAlert?.contentSummary).toContain('CI/CD PIPELINE FAILURE');
      expect(ciAlert?.contentSummary).toContain('Jay-Raam');
    });
  });
});
