import { WhatsAppProvider, WhatsAppMessageRecord } from './whatsapp';
import { AlertDeduplicator } from './deduplicator';
import { logger } from '../lib/logger';

export interface ApplicationErrorAlertInput {
  error: Error | string;
  context?: string;
  severity?: 'WARNING' | 'ERROR' | 'CRITICAL';
  metadata?: Record<string, any>;
}

export interface CiFailureAlertInput {
  branch: string;
  commit: string;
  author: string;
  jobName: string;
  runUrl: string;
  failureReason: string;
}

export class AlertsService {
  /**
   * Dispatches proactive WhatsApp notification on application errors with deduplication
   */
  static async sendApplicationErrorAlert(
    input: ApplicationErrorAlertInput
  ): Promise<WhatsAppMessageRecord | null> {
    const errorMsg = typeof input.error === 'string' ? input.error : input.error.message;
    const severity = input.severity || 'ERROR';
    const context = input.context || 'General Application Runtime';

    // Check 15-minute deduplication window
    const isDup = await AlertDeduplicator.isDuplicate('app-error', `${context}:${errorMsg}`);
    if (isDup) {
      logger.warn('Suppressed duplicate application error alert', { context, errorMsg });
      return null;
    }

    const formattedMessage = `🚨 *KURIPP SYSTEM ALERT — ${severity}*
*Environment*: Production
*Service*: API Core Gateway
*Context*: ${context}
*Timestamp*: ${new Date().toISOString()}

*Error Details*:
\`\`\`
${errorMsg.slice(0, 300)}
\`\`\`

_Sanitized automated alert dispatched via Evolution API._`;

    return WhatsAppProvider.sendAlert({
      templateName: 'APP_ERROR_ALERT',
      severity,
      content: formattedMessage,
      metadata: { context, ...input.metadata },
    });
  }

  /**
   * Dispatches proactive WhatsApp notification on CI/CD build or test failures
   */
  static async sendCiFailureAlert(
    input: CiFailureAlertInput
  ): Promise<WhatsAppMessageRecord | null> {
    const isDup = await AlertDeduplicator.isDuplicate('ci-failure', `${input.branch}:${input.commit}`);
    if (isDup) {
      logger.warn('Suppressed duplicate CI failure alert', { branch: input.branch, commit: input.commit });
      return null;
    }

    const formattedMessage = `❌ *KURIPP CI/CD PIPELINE FAILURE*
*Repository*: Jay-Raam/KURIPP
*Branch*: \`${input.branch}\`
*Commit*: \`${input.commit.slice(0, 7)}\` by *${input.author}*
*Failed Job*: ${input.jobName}

*Failure Diagnosis*:
\`\`\`
${input.failureReason.slice(0, 250)}
\`\`\`

*Action Required*: Investigate pipeline run:
${input.runUrl}

_Automated diagnostic alert dispatched via Evolution API._`;

    return WhatsAppProvider.sendAlert({
      templateName: 'CI_FAILURE_ALERT',
      severity: 'CRITICAL',
      content: formattedMessage,
      metadata: input,
    });
  }

  /**
   * Triggers manual test alert
   */
  static async testAlert(
    message: string = 'Test alert triggered from KURIPP administrative console',
    severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL' = 'INFO'
  ): Promise<WhatsAppMessageRecord> {
    const formatted = `🔔 *KURIPP TEST ALERT*
*Timestamp*: ${new Date().toISOString()}
*Message*: ${message}

_Verification test successfully dispatched._`;

    return WhatsAppProvider.sendAlert({
      templateName: 'MANUAL_TEST_ALERT',
      severity,
      content: formatted,
      metadata: { isManualTest: true },
    });
  }

  /**
   * Lists alert history records
   */
  static async listLogs(limit: number = 50): Promise<WhatsAppMessageRecord[]> {
    return WhatsAppProvider.listLogs(limit);
  }
}
