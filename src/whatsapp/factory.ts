import { IWhatsAppAdapter } from './adapter.interface.js';
import { CloudApiAdapter } from './cloud-api.adapter.js';
import { BaileysAdapter } from './baileys.adapter.js';
import { SimulatorAdapter } from './simulator.adapter.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';

class WhatsAppFactory {
  private static instance: IWhatsAppAdapter | null = null;

  public static getAdapter(): IWhatsAppAdapter {
    if (this.instance) {
      return this.instance;
    }

    const provider = config.WHATSAPP_PROVIDER;
    logger.info(`Selecting WhatsApp Provider Adapter: "${provider}"`);

    switch (provider) {
      case 'cloud_api':
        this.instance = new CloudApiAdapter();
        break;
      case 'baileys':
        this.instance = new BaileysAdapter();
        break;
      case 'simulator':
      default:
        this.instance = new SimulatorAdapter();
        break;
    }

    return this.instance;
  }
}

export const whatsappAdapter = WhatsAppFactory.getAdapter();
