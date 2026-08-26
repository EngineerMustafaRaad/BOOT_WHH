import { AdminNotificationPayload } from '../types/index.js';

export interface INotificationProvider {
  name: string;
  isEnabled(): boolean;
  sendAlert(payload: AdminNotificationPayload): Promise<boolean>;
}
