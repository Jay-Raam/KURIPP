import nodemailer from 'nodemailer';
import { env } from '../config/env';
import { logger } from './logger';

export const emailTransporter = nodemailer.createTransport({
  host: env.EMAIL_HOST,
  port: env.EMAIL_PORT,
  secure: env.EMAIL_SECURE,
  auth: env.EMAIL_USER
    ? {
        user: env.EMAIL_USER,
        pass: env.EMAIL_PASS,
      }
    : undefined,
});

export async function sendPasswordResetEmail(to: string, resetToken: string): Promise<boolean> {
  const resetUrl = `${env.WEB_URL}/reset-password?token=${encodeURIComponent(resetToken)}`;

  const mailOptions = {
    from: env.EMAIL_FROM,
    to,
    subject: 'KURIPP — Password Reset Request',
    text: `You requested a password reset for your KURIPP account.\n\nUse the link below to set a new password:\n${resetUrl}\n\nThis link will expire in 1 hour. If you did not request this, please ignore this email.`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #18181b;">
        <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 16px;">KURIPP Password Reset</h2>
        <p style="font-size: 14px; line-height: 1.6; color: #52525b;">You requested a password reset for your account. Click the button below to choose a new password:</p>
        <div style="margin: 28px 0;">
          <a href="${resetUrl}" style="background-color: #18181b; color: #fafafa; padding: 10px 20px; border-radius: 4px; text-decoration: none; font-size: 14px; font-weight: 500;">Reset Password</a>
        </div>
        <p style="font-size: 12px; color: #71717a; border-top: 1px solid #e4e4e7; padding-top: 16px;">This link will expire in 1 hour. If you did not initiate this request, no action is needed.</p>
      </div>
    `,
  };

  try {
    await emailTransporter.sendMail(mailOptions);
    logger.info(`Password reset email dispatched to ${to}`);
    return true;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    logger.warn(`Failed to dispatch reset email to ${to}: ${errorMsg}`);
    return false;
  }
}
