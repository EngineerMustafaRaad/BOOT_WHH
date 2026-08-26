import { INotificationProvider } from './notification.interface.js';
import { WhatsAppNotificationProvider } from './whatsapp.provider.js';
import { TelegramNotificationProvider } from './telegram.provider.js';
import { EmailNotificationProvider } from './email.provider.js';
import { WebhookNotificationProvider } from './webhook.provider.js';
import { AdminNotificationPayload } from '../types/index.js';
import { logger } from '../utils/logger.js';

export class NotificationService {
  private static instance: NotificationService;
  private providers: INotificationProvider[] = [];

  private constructor() {
    this.providers = [
      new WhatsAppNotificationProvider(),
      new TelegramNotificationProvider(),
      new EmailNotificationProvider(),
      new WebhookNotificationProvider(),
    ];
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  /**
   * Broadcasts violation alert to all enabled channels
   */
  public async notifyAdmins(payload: AdminNotificationPayload): Promise<void> {
    const activeProviders = this.providers.filter((p) => p.isEnabled());

    if (activeProviders.length === 0) {
      logger.debug('No external notification providers enabled.');
      return;
    }

    const promises = activeProviders.map(async (provider) => {
      try {
        await provider.sendAlert(payload);
      } catch (err) {
        logger.error(`Error in notification provider ${provider.name}:`, { err });
      }
    });

    await Promise.allSettled(promises);
  }

  public getActiveChannels(): string[] {
    return this.providers.filter((p) => p.isEnabled()).map((p) => p.name);
  }
}

export const notificationService = NotificationService.getInstance();
