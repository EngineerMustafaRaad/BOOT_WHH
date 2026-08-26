import axios from 'axios';
import { INotificationProvider } from './notification.interface.js';
import { AdminNotificationPayload } from '../types/index.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

export class WebhookNotificationProvider implements INotificationProvider {
  public name = 'Custom Webhook Notification (Discord / Custom API)';

  public isEnabled(): boolean {
    return Boolean(config.WEBHOOK_ALERT_URL);
  }

  public async sendAlert(payload: AdminNotificationPayload): Promise<boolean> {
    if (!this.isEnabled() || !config.WEBHOOK_ALERT_URL) return false;

    // Supports generic webhook format and Discord embed format
    const isDiscord = config.WEBHOOK_ALERT_URL.includes('discord.com');

    const body = isDiscord
      ? {
          content: `🚨 **مخالفة جديدة في مجموعة:** ${payload.groupName}`,
          embeds: [
            {
              title: `المخالفة: ${payload.category} (${payload.severity})`,
              description: `**العضو:** ${payload.userName} (${payload.phoneNumber || payload.userJid})\n**النص:** ${payload.messageText}\n**القاعدة:** ${payload.detectedRule}\n**الإجراء:** ${payload.actionTaken} (${payload.violationCount}/${payload.maxViolations})`,
              color: payload.severity === 'CRITICAL' ? 15158332 : 16753920,
              timestamp: payload.timestamp.toISOString(),
            },
          ],
        }
      : {
          event: 'whatsapp.violation',
          data: payload,
        };

    try {
      await axios.post(config.WEBHOOK_ALERT_URL, body, {
        headers: { 'Content-Type': 'application/json' },
        timeout: 5000,
      });
      logger.info('Admin webhook notification sent successfully.');
      return true;
    } catch (error) {
      logger.error('Failed to send webhook notification:', { error });
      return false;
    }
  }
}
