export type WhatsAppMessageStatus = 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';

export interface WhatsAppMessageRecord {
  id: string;
  externalMessageId?: string | null;
  recipientNumber: string;
  templateName: string;
  severity: 'INFO' | 'HIGH' | 'CRITICAL';
  contentSummary: string;
  status: WhatsAppMessageStatus;
  errorMessage?: string | null;
  sentAt?: string | null;
  deliveredAt?: string | null;
  readAt?: string | null;
  createdAt: string;
  metadata?: Record<string, unknown> | null;
}

export interface EmailNotification {
  to: string;
  subject: string;
  html: string;
  text?: string;
}
