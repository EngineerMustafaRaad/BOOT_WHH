import axios from 'axios';
import { INotificationProvider } from './notification.interface.js';
import { AdminNotificationPayload } from '../types/index.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

export class TelegramNotificationProvider implements INotificationProvider {
  public name = 'Telegram Bot Notification';

  public isEnabled(): boolean {
    return Boolean(config.TELEGRAM_BOT_TOKEN && config.TELEGRAM_CHAT_ID);
  }

  public async sendAlert(payload: AdminNotificationPayload): Promise<boolean> {
    if (!this.isEnabled()) return false;

    const formattedTime = new Intl.DateTimeFormat('ar-EG', {
      dateStyle: 'short',
      timeStyle: 'medium',
    }).format(payload.timestamp);

    const text =
      `🚨 *مخالفة جديدة*\n\n` +
      `🏢 *المجموعة:* ${payload.groupName}\n` +
      `👤 *العضو:* ${payload.userName} (\`${payload.phoneNumber || payload.userJid}\`)\n` +
      `⚠️ *المخالفة:* ${payload.category} [${payload.severity}]\n` +
      `💬 *النص:* "${payload.messageText}"\n` +
      `🎯 *القاعدة:* ${payload.detectedRule}\n` +
      `⚡ *الإجراء:* ${payload.actionTaken} (${payload.violationCount}/${payload.maxViolations})\n` +
      `🕒 *الوقت:* ${formattedTime}`;

    try {
      const url = `https://api.telegram.org/bot${config.TELEGRAM_BOT_TOKEN}/sendMessage`;
      await axios.post(
        url,
        {
          chat_id: config.TELEGRAM_CHAT_ID,
          text,
          parse_mode: 'Markdown',
        },
        { timeout: 5000 }
      );
      logger.info(`Admin notification sent via Telegram`);
      return true;
    } catch (error) {
      logger.error('Failed to send Telegram admin notification:', { error });
      return false;
    }
  }
}
