import nodemailer from 'nodemailer';
import { INotificationProvider } from './notification.interface.js';
import { AdminNotificationPayload } from '../types/index.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

export class EmailNotificationProvider implements INotificationProvider {
  public name = 'Email Notification (SMTP)';
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    if (config.SMTP_HOST && config.SMTP_USER) {
      this.transporter = nodemailer.createTransport({
        host: config.SMTP_HOST,
        port: config.SMTP_PORT,
        secure: config.SMTP_PORT === 465,
        auth: {
          user: config.SMTP_USER,
          pass: config.SMTP_PASS,
        },
      });
    }
  }

  public isEnabled(): boolean {
    return Boolean(this.transporter && config.ALERT_EMAIL_RECIPIENT);
  }

  public async sendAlert(payload: AdminNotificationPayload): Promise<boolean> {
    if (!this.isEnabled() || !this.transporter || !config.ALERT_EMAIL_RECIPIENT) {
      return false;
    }

    const html = `
      <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background: #e53935; color: white; padding: 15px 20px; font-size: 20px; font-weight: bold;">
          🚨 تنبيه أمني: مخالفة جديدة في WhatsApp
        </div>
        <div style="padding: 20px;">
          <p><strong>المجموعة:</strong> ${payload.groupName}</p>
          <p><strong>العضو:</strong> ${payload.userName} (${payload.phoneNumber || payload.userJid})</p>
          <p><strong>نوع المخالفة:</strong> ${payload.category} - مستوى: ${payload.severity}</p>
          <p><strong>القاعدة المخترقة:</strong> ${payload.detectedRule}</p>
          <p><strong>الإجراء المتخذ:</strong> ${payload.actionTaken} (${payload.violationCount}/${payload.maxViolations})</p>
          <div style="background: #f9f9f9; border-right: 4px solid #e53935; padding: 12px; margin: 15px 0;">
            <strong>نص الرسالة:</strong><br/>
            "${payload.messageText}"
          </div>
          <p style="color: #777; font-size: 13px;">الوقت: ${new Date(payload.timestamp).toLocaleString('ar-EG')}</p>
        </div>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: config.SMTP_FROM,
        to: config.ALERT_EMAIL_RECIPIENT,
        subject: `[WhatsApp Moderator Alert] مخالفة جديدة في ${payload.groupName}`,
        html,
      });
      logger.info(`Admin notification email sent to ${config.ALERT_EMAIL_RECIPIENT}`);
      return true;
    } catch (error) {
      logger.error('Failed to send admin notification email:', { error });
      return false;
    }
  }
}
