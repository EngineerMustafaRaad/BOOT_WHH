import { Request, Response, NextFunction } from 'express';
import { SimulatorService } from '../services/simulator.service.js';
import { z } from 'zod';

export const simulateMessageSchema = z.object({
  text: z.string().min(1, 'نص الرسالة مطلوب'),
  senderName: z.string().optional(),
  senderPhone: z.string().optional(),
  groupJid: z.string().optional(),
  isAdmin: z.boolean().optional(),
});

export class SimulatorController {
  public static async simulateMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await SimulatorService.simulateIncomingMessage(req.body);
      res.json(result);
    } catch (error) {
      next(error);
    }
  }

  public static async getLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const logs = SimulatorService.getSimulatorLogs();
      res.json({ success: true, data: logs });
    } catch (error) {
      next(error);
    }
  }

  public static async clearLogs(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = SimulatorService.clearSimulatorLogs();
      res.json(result);
    } catch (error) {
      next(error);
    }
  }
}
