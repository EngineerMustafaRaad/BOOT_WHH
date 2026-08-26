import { IWhatsAppAdapter, MessageHandler } from './adapter.interface.js';
import { IncomingMessage } from '../types/index.js';
import { config } from '../config/index.js';
import { logger } from '../utils/logger.js';
import path from 'path';
import fs from 'fs';

export class BaileysAdapter implements IWhatsAppAdapter {
  public name = 'Baileys Multi-Device Socket (Live WhatsApp)';
  private isConnected = false;
  private messageHandlers: MessageHandler[] = [];
  private socket: any = null;
  private qrCodeString: string | null = null;
  private authFolder = path.resolve(process.cwd(), 'baileys_auth_info');
  private groupMetadataCache: Map<string, { subject: string; participants: any[]; admins: Set<string> }> = new Map();

  public async connect(): Promise<void> {
    try {
      logger.info('Initializing Baileys Multi-Device WhatsApp Socket...');

      if (!fs.existsSync(this.authFolder)) {
        fs.mkdirSync(this.authFolder, { recursive: true });
      }

      // Dynamic imports for Baileys
      const baileys = await import('@whiskeysockets/baileys');
      const pino = (await import('pino')).default;

      const makeWASocket = baileys.default || baileys.makeWASocket;
      const { useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = baileys;

      const { state, saveCreds } = await useMultiFileAuthState(this.authFolder);
      const { version } = await fetchLatestBaileysVersion().catch(() => ({ version: [2, 3000, 1015901307] as any }));

      this.socket = makeWASocket({
        version,
        auth: state,
        printQRInTerminal: false,
        logger: pino({ level: 'silent' }),
        browser: ['WA Moderator Bot', 'Chrome', '1.0.0'],
        generateHighQualityLinkPreview: false,
      });

      this.socket.ev.on('creds.update', saveCreds);

      let pairingCodeRequested = false;

      this.socket.ev.on('connection.update', async (update: any) => {
        const { connection, lastDisconnect, qr } = update;

        if (qr && !config.BAILEYS_PHONE_NUMBER) {
          this.qrCodeString = qr;
          logger.info('QR Code generated. Set BAILEYS_PHONE_NUMBER to use a pairing code instead.');
        }

        if (config.BAILEYS_PHONE_NUMBER && !pairingCodeRequested && (connection === 'connecting' || qr)) {
          pairingCodeRequested = true;
          const phoneNumber = config.BAILEYS_PHONE_NUMBER.replace(/\D/g, '');

          if (phoneNumber.length < 8) {
            pairingCodeRequested = false;
            logger.error('BAILEYS_PHONE_NUMBER must include the international country code, for example 9665xxxxxxxx.');
          } else {
            try {
              const pairingCode = await this.socket.requestPairingCode(phoneNumber);
              logger.info(`\n======================================================\n📱 WhatsApp Pairing Code: ${pairingCode}\nOpen WhatsApp > Linked devices > Link a device > Link with phone number, then enter this code.\n======================================================`);
            } catch (error) {
              pairingCodeRequested = false;
              logger.error('Failed to generate WhatsApp pairing code:', { error });
            }
          }
        }

        if (connection === 'close') {
          this.isConnected = false;
          const statusCode = (lastDisconnect?.error as any)?.output?.statusCode;
          const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
          logger.warn(`Baileys connection closed. Reason: ${statusCode}. Reconnecting: ${shouldReconnect}`);

          if (shouldReconnect) {
            pairingCodeRequested = false;
            setTimeout(() => this.connect(), 5000);
          } else {
            logger.error('WhatsApp session logged out. Delete baileys_auth_info and restart to scan new QR.');
          }
        } else if (connection === 'open') {
          this.isConnected = true;
          this.qrCodeString = null;
          logger.info('✅ WhatsApp Socket Connected Successfully! Ready to moderate groups.');
          await this.syncGroups();
        }
      });

      // Listen for incoming messages
      this.socket.ev.on('messages.upsert', async (m: any) => {
        if (m.type !== 'notify') return;

        for (const msg of m.messages) {
          if (!msg.message || msg.key.fromMe) continue;

          const remoteJid = msg.key.remoteJid || '';
          const isGroup = remoteJid.endsWith('@g.us');
          const senderJid = isGroup ? msg.key.participant || msg.participant || remoteJid : remoteJid;

          // Extract text content from various message types
          const text =
            msg.message.conversation ||
            msg.message.extendedTextMessage?.text ||
            msg.message.imageMessage?.caption ||
            msg.message.videoMessage?.caption ||
            '';

          if (!text) continue;

          // Check if sender is an admin in group
          let isAdmin = false;
          let groupName = 'مجموعة واتساب';

          if (isGroup) {
            const groupInfo = await this.getGroupMetadata(remoteJid);
            if (groupInfo) {
              groupName = groupInfo.subject;
              isAdmin = groupInfo.admins.has(senderJid);
            }
          }

          const incoming: IncomingMessage = {
            id: msg.key.id || 'msg_' + Date.now(),
            from: senderJid,
            senderName: msg.pushName || senderJid.split('@')[0],
            groupId: remoteJid,
            groupName,
            text,
            timestamp: new Date((msg.messageTimestamp as number) * 1000 || Date.now()),
            isGroup,
            isAdmin,
            rawPayload: msg,
          };

          for (const handler of this.messageHandlers) {
            try {
              await handler(incoming);
            } catch (err) {
              logger.error('Error handling incoming Baileys message:', { err });
            }
          }
        }
      });
    } catch (error) {
      logger.error('Failed to initialize Baileys adapter:', { error });
      this.isConnected = false;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.socket) {
      try {
        await this.socket.end();
      } catch {
        // ignore
      }
    }
    this.isConnected = false;
    logger.info('Baileys adapter disconnected.');
  }

  public onMessage(handler: MessageHandler): void {
    this.messageHandlers.push(handler);
  }

  public async sendMessage(to: string, text: string): Promise<boolean> {
    if (!this.socket || !this.isConnected) {
      logger.warn(`Cannot send message to ${to}. WhatsApp socket not connected.`);
      return false;
    }

    try {
      await this.socket.sendMessage(to, { text });
      logger.info(`Message sent to ${to}: "${text.substring(0, 40)}..."`);
      return true;
    } catch (error) {
      logger.error(`Failed to send Baileys message to ${to}:`, { error });
      return false;
    }
  }

  public async deleteMessage(groupId: string, messageId: string, senderJid?: string): Promise<boolean> {
    if (!this.socket || !this.isConnected) return false;

    try {
      const key: any = {
        remoteJid: groupId,
        id: messageId,
        fromMe: false,
      };
      if (senderJid) {
        key.participant = senderJid;
      }

      await this.socket.sendMessage(groupId, { delete: key });
      logger.info(`Message ${messageId} revoked/deleted in group ${groupId}`);
      return true;
    } catch (error) {
      logger.error(`Failed to delete message ${messageId} in group ${groupId}:`, { error });
      return false;
    }
  }

  public async kickParticipant(groupId: string, participantJid: string): Promise<boolean> {
    if (!this.socket || !this.isConnected) return false;

    try {
      await this.socket.groupParticipantsUpdate(groupId, [participantJid], 'remove');
      logger.info(`Participant ${participantJid} removed from group ${groupId}`);
      return true;
    } catch (error) {
      logger.error(`Failed to kick participant ${participantJid} from ${groupId}:`, { error });
      return false;
    }
  }

  public async getMonitoredGroups(): Promise<Array<{ id: string; name: string; participantsCount: number }>> {
    const list: Array<{ id: string; name: string; participantsCount: number }> = [];
    for (const [id, data] of this.groupMetadataCache.entries()) {
      list.push({
        id,
        name: data.subject,
        participantsCount: data.participants.length,
      });
    }
    return list;
  }

  public getStatus(): { connected: boolean; provider: string; details?: string } {
    return {
      connected: this.isConnected,
      provider: this.name,
      details: this.isConnected
        ? 'Connected and listening for group events'
        : config.BAILEYS_PHONE_NUMBER
        ? 'Waiting for WhatsApp pairing code'
        : this.qrCodeString
        ? 'Waiting for QR Code scan'
        : 'Socket initializing...',
    };
  }

  private async syncGroups(): Promise<void> {
    try {
      const groups = await this.socket.groupFetchAllParticipating();
      for (const [jid, group] of Object.entries(groups as Record<string, any>)) {
        const admins = new Set<string>();
        for (const p of group.participants || []) {
          if (p.admin === 'admin' || p.admin === 'superadmin') {
            admins.add(p.id);
          }
        }
        this.groupMetadataCache.set(jid, {
          subject: group.subject || 'مجموعة واتساب',
          participants: group.participants || [],
          admins,
        });
      }
      logger.info(`Synced ${this.groupMetadataCache.size} active WhatsApp groups.`);
    } catch (err) {
      logger.error('Failed to sync WhatsApp groups metadata:', { err });
    }
  }

  private async getGroupMetadata(groupJid: string) {
    if (this.groupMetadataCache.has(groupJid)) {
      return this.groupMetadataCache.get(groupJid);
    }
    try {
      const metadata = await this.socket.groupMetadata(groupJid);
      const admins = new Set<string>();
      for (const p of metadata.participants || []) {
        if (p.admin === 'admin' || p.admin === 'superadmin') {
          admins.add(p.id);
        }
      }
      const data = {
        subject: metadata.subject || 'مجموعة واتساب',
        participants: metadata.participants || [],
        admins,
      };
      this.groupMetadataCache.set(groupJid, data);
      return data;
    } catch {
      return null;
    }
  }
}
