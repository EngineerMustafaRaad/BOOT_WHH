import axios from 'axios';
import { IWhatsAppAdapter, MessageHandler } from './adapter.interface.js';
import { IncomingMessage } from '../types/index.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

export class CloudApiAdapter implements IWhatsAppAdapter {
  public name = 'WhatsApp Business Cloud API (Official)';
  private isConnected = false;
  private messageHandlers: MessageHandler[] = [];
  private graphApiUrl = 'https://graph.facebook.com/v21.0';

  public async connect(): Promise<void> {
    if (!config.WHATSAPP_ACCESS_TOKEN || !config.WHATSAPP_PHONE_NUMBER_ID) {
      logger.warn('WhatsApp Cloud API credentials not fully configured in .env. Operating in pending mode.');
      this.isConnected = false;
      return;
    }

    try {
      // Test credentials with Meta Graph API
      const res = await axios.get(
        `${this.graphApiUrl}/${config.WHATSAPP_PHONE_NUMBER_ID}`,
        {
          headers: { Authorization: `Bearer ${config.WHATSAPP_ACCESS_TOKEN}` },
          timeout: 5000,
        }
      );
      this.isConnected = true;
      logger.info(`WhatsApp Cloud API connected for phone ID: ${config.WHATSAPP_PHONE_NUMBER_ID} (Verified Name: ${res.data?.verified_name || 'Business'})`);
    } catch (error) {
      logger.error('WhatsApp Cloud API connection test failed:', { error });
      this.isConnected = false;
    }
  }

  public async disconnect(): Promise<void> {
    this.isConnected = false;
    logger.info('WhatsApp Cloud API adapter disconnected.');
  }

  public onMessage(handler: MessageHandler): void {
    this.messageHandlers.push(handler);
  }

  public async processWebhookPayload(payload: any): Promise<void> {
    try {
      const entry = payload?.entry?.[0];
      const changes = entry?.changes?.[0];
      const value = changes?.value;
      const message = value?.messages?.[0];

      if (!message) return;

      const incoming: IncomingMessage = {
        id: message.id,
        from: message.from + '@s.whatsapp.net',
        senderName: value?.contacts?.[0]?.profile?.name || message.from,
        groupId: value?.metadata?.phone_number_id || 'direct_or_cloud_group',
        groupName: 'WhatsApp Business Channel',
        text: message.text?.body || '',
        timestamp: new Date(parseInt(message.timestamp, 10) * 1000),
        isGroup: false,
        isAdmin: false,
        rawPayload: payload,
      };

      for (const handler of this.messageHandlers) {
        await handler(incoming);
      }
    } catch (error) {
      logger.error('Error processing Cloud API Webhook payload:', { error });
    }
  }

  public async sendMessage(to: string, text: string): Promise<boolean> {
    if (!config.WHATSAPP_ACCESS_TOKEN || !config.WHATSAPP_PHONE_NUMBER_ID) {
      logger.warn(`Cloud API not configured. Cannot send message to ${to}`);
      return false;
    }

    try {
      const cleanTo = to.replace(/[@a-zA-Z._-]/g, '');
      await axios.post(
        `${this.graphApiUrl}/${config.WHATSAPP_PHONE_NUMBER_ID}/messages`,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: cleanTo,
          type: 'text',
          text: { preview_url: false, body: text },
        },
        {
          headers: {
            Authorization: `Bearer ${config.WHATSAPP_ACCESS_TOKEN}`,
            'Content-Type': 'application/json',
          },
          timeout: 8000,
        }
      );
      logger.info(`Message successfully sent via Cloud API to ${to}`);
      return true;
    } catch (error) {
      logger.error(`Failed to send message via Cloud API to ${to}:`, { error });
      return false;
    }
  }

  public async deleteMessage(groupId: string, messageId: string): Promise<boolean> {
    // Official Cloud API limitation notice:
    logger.warn(
      `[Cloud API Limitation] Meta WhatsApp Cloud API does not support deleting third-party user messages in generic user groups directly. Message ID: ${messageId}`
    );
    return false;
  }

  public async kickParticipant(groupId: string, participantJid: string): Promise<boolean> {
    logger.warn(
      `[Cloud API Limitation] Direct group kick is not supported on standard Cloud API. Target: ${participantJid}`
    );
    return false;
  }

  public async getMonitoredGroups(): Promise<Array<{ id: string; name: string; participantsCount: number }>> {
    return [
      {
        id: config.WHATSAPP_PHONE_NUMBER_ID || 'cloud_api_channel',
        name: 'قناة واتساب الرسمية (Cloud API)',
        participantsCount: 1,
      },
    ];
  }

  public getStatus(): { connected: boolean; provider: string; details?: string } {
    return {
      connected: this.isConnected,
      provider: this.name,
      details: this.isConnected
        ? `Connected to Phone ID ${config.WHATSAPP_PHONE_NUMBER_ID}`
        : 'Credentials unverified or missing',
    };
  }
}
