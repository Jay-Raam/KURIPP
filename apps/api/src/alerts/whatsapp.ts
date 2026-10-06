import { prisma } from '../lib/prisma';
import { env } from '../config/env';
import { logger } from '../lib/logger';

export interface SendWhatsAppParams {
  recipientNumber?: string;
  templateName: string;
  severity: 'INFO' | 'WARNING' | 'ERROR' | 'CRITICAL';
  content: string;
  metadata?: Record<string, any>;
}

export interface WhatsAppMessageRecord {
  id: string;
  externalMessageId?: string | null;
  recipientNumber: string;
  templateName: string;
  severity: string;
  contentSummary: string;
  status: 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  errorMessage?: string | null;
  sentAt?: Date | null;
  deliveredAt?: Date | null;
  readAt?: Date | null;
  createdAt: Date;
  metadata?: any;
}

// In-memory fallback for testing
const memoryMessages = new Map<string, WhatsAppMessageRecord>();

export class WhatsAppProvider {
  /**
   * Sanitizes message content to prevent leaking credentials in WhatsApp alerts
   */
  static sanitizeContent(text: string): string {
    return text
      // Redact Bearer tokens & JWTs
      .replace(/Bearer\s+[A-Za-z0-9\-_.]+/gi, 'Bearer [REDACTED_JWT]')
      .replace(/eyJ[A-Za-z0-9\-_.]+/g, '[REDACTED_JWT]')
      // Redact database passwords
      .replace(/(postgres|mongodb|redis):\/\/[^:]+:([^@]+)@/gi, '$1://[USER]:[REDACTED_SECRET]@')
      // Redact API keys
      .replace(/(sk-[A-Za-z0-9\-_]{16,})/gi, '[REDACTED_API_KEY]')
      // Redact generic secrets & passwords
      .replace(/(password|secret|key|token)["':\s=]+([^\s"',;]+)/gi, '$1: [REDACTED]');
  }

  /**
   * Dispatches WhatsApp alert via Evolution API and records state transition in database
   */
  static async sendAlert(params: SendWhatsAppParams): Promise<WhatsAppMessageRecord> {
    const recipient = params.recipientNumber || env.ALERT_WHATSAPP_NUMBER || '+1234567890';
    const sanitizedContent = this.sanitizeContent(params.content);
    const id = `wa-${Date.now()}-${Math.random().toString(36).substring(7)}`;

    // Create record with PENDING status
    let record: WhatsAppMessageRecord = {
      id,
      recipientNumber: recipient,
      templateName: params.templateName,
      severity: params.severity,
      contentSummary: sanitizedContent.slice(0, 500),
      status: 'PENDING',
      createdAt: new Date(),
      metadata: params.metadata || null,
    };

    try {
      await prisma.whatsAppMessage.create({
        data: {
          id: record.id,
          recipientNumber: record.recipientNumber,
          templateName: record.templateName,
          severity: record.severity,
          contentSummary: record.contentSummary,
          status: 'PENDING',
          metadata: record.metadata,
        },
      });
    } catch {
      memoryMessages.set(id, record);
    }

    // Attempt Evolution API dispatch if configured
    if (env.WHATSAPP_API_KEY && env.WHATSAPP_API_URL && process.env.NODE_ENV !== 'test') {
      try {
        const url = `${env.WHATSAPP_API_URL}/message/sendText/${env.WHATSAPP_INSTANCE_NAME}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: env.WHATSAPP_API_KEY,
          },
          body: JSON.stringify({
            number: recipient.replace(/[^0-9]/g, ''),
            text: sanitizedContent,
            options: {
              delay: 1200,
              presence: 'composing',
            },
          }),
        });

        if (response.ok) {
          const resData = (await response.json()) as any;
          const externalId = resData?.key?.id || `ext-${Date.now()}`;
          record.status = 'SENT';
          record.externalMessageId = externalId;
          record.sentAt = new Date();

          await prisma.whatsAppMessage.update({
            where: { id },
            data: {
              status: 'SENT',
              externalMessageId: externalId,
              sentAt: record.sentAt,
            },
          }).catch(() => {});
        } else {
          const errText = await response.text();
          record.status = 'FAILED';
          record.errorMessage = `HTTP ${response.status}: ${errText.slice(0, 200)}`;

          await prisma.whatsAppMessage.update({
            where: { id },
            data: {
              status: 'FAILED',
              errorMessage: record.errorMessage,
            },
          }).catch(() => {});
        }
      } catch (networkErr: any) {
        record.status = 'FAILED';
        record.errorMessage = networkErr.message || 'Network dispatch failure';
        await prisma.whatsAppMessage.update({
          where: { id },
          data: { status: 'FAILED', errorMessage: record.errorMessage },
        }).catch(() => {});
      }
    } else {
      // In development or test, simulate immediate successful dispatch
      record.status = 'SENT';
      record.sentAt = new Date();
      record.externalMessageId = `mock-ext-${Date.now()}`;

      try {
        await prisma.whatsAppMessage.update({
          where: { id },
          data: {
            status: 'SENT',
            externalMessageId: record.externalMessageId,
            sentAt: record.sentAt,
          },
        });
      } catch {
        memoryMessages.set(id, record);
      }
    }

    logger.info('WhatsApp alert processed', {
      id: record.id,
      status: record.status,
      recipient: record.recipientNumber,
      severity: record.severity,
    });

    return record;
  }

  /**
   * Updates delivery status on webhook arrival (SENT -> DELIVERED -> READ)
   */
  static async updateDeliveryStatus(
    externalMessageId: string,
    status: 'DELIVERED' | 'READ' | 'FAILED',
    errorMessage?: string
  ): Promise<boolean> {
    const now = new Date();

    if (process.env.NODE_ENV === 'test') {
      for (const item of memoryMessages.values()) {
        if (item.externalMessageId === externalMessageId) {
          item.status = status;
          if (status === 'DELIVERED') item.deliveredAt = now;
          if (status === 'READ') item.readAt = now;
          if (status === 'FAILED') item.errorMessage = errorMessage || null;
          return true;
        }
      }
      return false;
    }

    try {
      const existing = await prisma.whatsAppMessage.findFirst({
        where: { externalMessageId },
      });

      if (!existing) return false;

      const updateData: any = { status };
      if (status === 'DELIVERED') updateData.deliveredAt = now;
      if (status === 'READ') updateData.readAt = now;
      if (status === 'FAILED' && errorMessage) updateData.errorMessage = errorMessage;

      await prisma.whatsAppMessage.update({
        where: { id: existing.id },
        data: updateData,
      });

      return true;
    } catch {
      for (const item of memoryMessages.values()) {
        if (item.externalMessageId === externalMessageId) {
          item.status = status;
          if (status === 'DELIVERED') item.deliveredAt = now;
          if (status === 'READ') item.readAt = now;
          if (status === 'FAILED') item.errorMessage = errorMessage || null;
          return true;
        }
      }
      return false;
    }
  }

  /**
   * Lists recent WhatsApp audit log messages
   */
  static async listLogs(limit: number = 50): Promise<WhatsAppMessageRecord[]> {
    if (process.env.NODE_ENV === 'test') {
      return Array.from(memoryMessages.values()).slice(0, limit);
    }
    try {
      const records = await prisma.whatsAppMessage.findMany({
        take: limit,
        orderBy: { createdAt: 'desc' },
      });
      return records as WhatsAppMessageRecord[];
    } catch {
      return Array.from(memoryMessages.values()).slice(0, limit);
    }
  }
}
