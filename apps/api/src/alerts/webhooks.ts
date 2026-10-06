import { Router, Request, Response } from 'express';
import { WhatsAppProvider } from './whatsapp';
import { AlertsService } from './service';
import { logger } from '../lib/logger';

export const alertsWebhookRouter = Router();

/**
 * Evolution API Webhook endpoint for delivery & read receipts
 */
alertsWebhookRouter.post('/whatsapp/status', async (req: Request, res: Response) => {
  try {
    const payload = req.body;
    logger.info('Received WhatsApp webhook payload', { event: payload?.event });

    // Evolution API event format handling
    const event = payload?.event || payload?.type;
    const data = payload?.data;

    if (data?.key?.id) {
      const externalId = data.key.id;
      let targetStatus: 'DELIVERED' | 'READ' | 'FAILED' | null = null;

      if (event === 'messages.update' || event === 'message.update') {
        const rawStatus = data.status?.toUpperCase();
        if (rawStatus === 'DELIVERY_ACK' || rawStatus === 'DELIVERED') {
          targetStatus = 'DELIVERED';
        } else if (rawStatus === 'READ') {
          targetStatus = 'READ';
        } else if (rawStatus === 'ERROR' || rawStatus === 'FAILED') {
          targetStatus = 'FAILED';
        }
      }

      if (targetStatus) {
        await WhatsAppProvider.updateDeliveryStatus(externalId, targetStatus);
      }
    }

    res.status(200).json({ success: true, processed: true });
  } catch (err: any) {
    logger.error('Error processing WhatsApp webhook', { err });
    res.status(500).json({ error: 'Webhook processing error' });
  }
});

/**
 * Webhook endpoint for CI/CD failure reporting from GitHub Actions
 */
alertsWebhookRouter.post('/ci-alert', async (req: Request, res: Response) => {
  try {
    const { branch, commit, author, jobName, runUrl, failureReason } = req.body;

    if (!branch || !commit) {
      res.status(400).json({ error: 'branch and commit are required' });
      return;
    }

    const record = await AlertsService.sendCiFailureAlert({
      branch,
      commit,
      author: author || 'GitHub Actions',
      jobName: jobName || 'CI Workflow',
      runUrl: runUrl || 'https://github.com/Jay-Raam/KURIPP/actions',
      failureReason: failureReason || 'Job exited with non-zero status',
    });

    res.status(200).json({ success: true, alertId: record?.id || null });
  } catch (err: any) {
    logger.error('Error processing CI failure alert webhook', { err });
    res.status(500).json({ error: 'CI alert processing error' });
  }
});
