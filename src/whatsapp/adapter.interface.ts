import { IncomingMessage } from '../types/index.js';

export type MessageHandler = (message: IncomingMessage) => Promise<void>;

export interface IWhatsAppAdapter {
  name: string;

  /**
   * Initializes and connects the WhatsApp provider adapter
   */
  connect(): Promise<void>;

  /**
   * Disconnects the adapter
   */
  disconnect(): Promise<void>;

  /**
   * Registers callback handler for incoming group and direct messages
   */
  onMessage(handler: MessageHandler): void;

  /**
   * Sends a plain text message to a group or user
   */
  sendMessage(to: string, text: string): Promise<boolean>;

  /**
   * Deletes a message from a group if permissions and adapter capabilities allow it
   */
  deleteMessage(groupId: string, messageId: string, senderJid?: string): Promise<boolean>;

  /**
   * Kicks or removes a participant from a group (if supported)
   */
  kickParticipant(groupId: string, participantJid: string): Promise<boolean>;

  /**
   * Gets the list of groups monitored by the bot
   */
  getMonitoredGroups(): Promise<Array<{ id: string; name: string; participantsCount: number }>>;

  /**
   * Returns current adapter connection status
   */
  getStatus(): { connected: boolean; provider: string; details?: string };
}
