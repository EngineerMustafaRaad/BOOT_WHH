import { IWhatsAppAdapter, MessageHandler } from './adapter.interface.js';
import { IncomingMessage } from '../types/index.js';
import { logger } from '../utils/logger.js';

export interface SimulatedLog {
  id: string;
  type: 'INCOMING' | 'OUTGOING' | 'DELETED' | 'KICKED';
  target: string;
  content: string;
  timestamp: Date;
}

export class SimulatorAdapter implements IWhatsAppAdapter {
  public name = 'Interactive Local Simulator Adapter';
  private isConnected = false;
  private messageHandlers: MessageHandler[] = [];
  private activityLogs: SimulatedLog[] = [];
  private static readonly MAX_LOGS = 100;

  public async connect(): Promise<void> {
    this.isConnected = true;
    logger.info('WhatsApp Simulator Adapter initialized and ready for testing.');
  }

  public async disconnect(): Promise<void> {
    this.isConnected = false;
    logger.info('WhatsApp Simulator Adapter disconnected.');
  }

  public onMessage(handler: MessageHandler): void {
    this.messageHandlers.push(handler);
  }

  /**
   * Simulates an incoming message sent by a user in a group
   */
  public async simulateIncomingMessage(data: {
    text: string;
    senderJid?: string;
    senderName?: string;
    groupId?: string;
    groupName?: string;
    isAdmin?: boolean;
  }): Promise<IncomingMessage> {
    const id = 'sim_msg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const incoming: IncomingMessage = {
      id,
      from: data.senderJid || '966500000001@s.whatsapp.net',
      senderName: data.senderName || 'عضو تجريبي',
      groupId: data.groupId || '120363012345678901@g.us',
      groupName: data.groupName || 'مجموعة المطورين والتقنية (تجريبية)',
      text: data.text,
      timestamp: new Date(),
      isGroup: true,
      isAdmin: Boolean(data.isAdmin),
    };

    this.pushLog({
      id,
      type: 'INCOMING',
      target: incoming.groupId,
      content: `[${incoming.senderName}] ${incoming.text}`,
      timestamp: new Date(),
    });

    for (const handler of this.messageHandlers) {
      await handler(incoming);
    }

    return incoming;
  }

  public async sendMessage(to: string, text: string): Promise<boolean> {
    logger.info(`[Simulator Message Sent] To: ${to} | Text: "${text}"`);
    this.pushLog({
      id: 'sim_out_' + Date.now(),
      type: 'OUTGOING',
      target: to,
      content: text,
      timestamp: new Date(),
    });
    return true;
  }

  public async deleteMessage(groupId: string, messageId: string, senderJid?: string): Promise<boolean> {
    logger.info(`[Simulator Message Deleted] Group: ${groupId} | Message ID: ${messageId} | Sender: ${senderJid || 'n/a'}`);
    this.pushLog({
      id: 'sim_del_' + Date.now(),
      type: 'DELETED',
      target: groupId,
      content: `Deleted message ${messageId} by ${senderJid || 'member'}`,
      timestamp: new Date(),
    });
    return true;
  }

  public async kickParticipant(groupId: string, participantJid: string): Promise<boolean> {
    logger.info(`[Simulator Member Kicked] Group: ${groupId} | Target: ${participantJid}`);
    this.pushLog({
      id: 'sim_kick_' + Date.now(),
      type: 'KICKED',
      target: groupId,
      content: `Removed participant ${participantJid}`,
      timestamp: new Date(),
    });
    return true;
  }

  public async getMonitoredGroups(): Promise<Array<{ id: string; name: string; participantsCount: number }>> {
    return [
      {
        id: '120363012345678901@g.us',
        name: 'مجموعة المطورين والتقنية (تجريبية)',
        participantsCount: 48,
      },
    ];
  }

  public getStatus(): { connected: boolean; provider: string; details?: string } {
    return {
      connected: this.isConnected,
      provider: this.name,
      details: 'Simulator active - Ready for real-time testing and local development',
    };
  }

  public getActivityLogs(): SimulatedLog[] {
    return [...this.activityLogs];
  }

  public clearLogs(): void {
    this.activityLogs = [];
  }

  private pushLog(log: SimulatedLog): void {
    this.activityLogs.unshift(log);
    if (this.activityLogs.length > SimulatorAdapter.MAX_LOGS) {
      this.activityLogs.pop();
    }
  }
}
