import { Request, Response } from 'express';
import { config } from '../config/index.js';
import { whatsappAdapter } from '../whatsapp/factory.js';
import { CloudApiAdapter } from '../whatsapp/cloud-api.adapter.js';
import { logger } from '../utils/logger.js';

export class WebhookController {
  /**
   * Meta Webhook verification handshake (GET)
   */
  public static verifyWebhook(req: Request, res: Response): void {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === config.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
      logger.info('Meta WhatsApp Webhook verification handshake successful.');
      res.status(200).send(challenge);
      return;
    }

    logger.warn('Meta WhatsApp Webhook verification failed - invalid token.');
    res.status(403).send('Forbidden: Token mismatch');
  }

  /**
   * Meta Webhook incoming events (POST)
   */
  public static async handleWebhookEvent(req: Request, res: Response): Promise<void> {
    try {
      // Immediate acknowledgment per Meta requirements
      res.status(200).send('EVENT_RECEIVED');

      if (whatsappAdapter instanceof CloudApiAdapter) {
        await (whatsappAdapter as CloudApiAdapter).processWebhookPayload(req.body);
      }
    } catch (error) {
      logger.error('Error handling webhook event:', { error });
    }
  }
}
