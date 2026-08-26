import { Router } from 'express';
import { WebhookController } from '../controllers/webhook.controller.js';

const router = Router();

// Meta WhatsApp Cloud API verification handshake
router.get('/', WebhookController.verifyWebhook);

// Meta WhatsApp Cloud API events listener
router.post('/', WebhookController.handleWebhookEvent);

export default router;
