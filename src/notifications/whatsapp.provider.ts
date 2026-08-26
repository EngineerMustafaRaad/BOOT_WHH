import { INotificationProvider } from './notification.interface.js';
import { AdminNotificationPayload } from '../types/index.js';
import { whatsappAdapter } from '../whatsapp/factory.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

export class WhatsAppNotificationProvider implements INotificationProvider {
  public name = 'WhatsApp Direct Notification';

  public isEnabled(): boolean {
    return Boolean(config.ADMIN_WHATSAPP_NUMBER);
  }

  public async sendAlert(payload: AdminNotificationPayload): Promise<boolean> {
    if (!this.isEnabled() || !config.ADMIN_WHATSAPP_NUMBER) {
      return false;
    }

    const formattedTime = new Intl.DateTimeFormat('ar-EG', {
      dateStyle: 'short',
      timeStyle: 'medium',
    }).format(payload.timestamp);

    const message =
      `🚨 *مخالفة جديدة*\n\n` +
      `*المجموعة:*\n${payload.groupName}\n\n` +
      `*العضو:*\n${payload.userName} (${payload.phoneNumber || payload.userJid})\n\n` +
      `*المخالفة:*\n${payload.category} [${payload.severity}]\n\n` +
      `*النص:*\n"${payload.messageText}"\n\n` +
      `*القاعدة:*\n${payload.detectedRule}\n\n` +
      `*الإجراء:*\n${payload.actionTaken} (المخالفة رقم ${payload.violationCount}/${payload.maxViolations})\n\n` +
      `*الوقت:*\n${formattedTime}`;

    try {
      const recipient = config.ADMIN_WHATSAPP_NUMBER.includes('@')
        ? config.ADMIN_WHATSAPP_NUMBER
        : `${config.ADMIN_WHATSAPP_NUMBER.replace(/\+/g, '')}@s.whatsapp.net`;

      await whatsappAdapter.sendMessage(recipient, message);
      logger.info(`Admin notification sent via WhatsApp to ${config.ADMIN_WHATSAPP_NUMBER}`);
      return true;
    } catch (error) {
      logger.error('Failed to send WhatsApp admin notification:', { error });
      return false;
    }
  }
}
