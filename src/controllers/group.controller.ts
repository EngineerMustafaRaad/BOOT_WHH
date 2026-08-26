import { Request, Response, NextFunction } from 'express';
import { GroupService } from '../services/group.service.js';
import { whatsappAdapter } from '../whatsapp/factory.js';
import { prisma } from '../database/prisma.js';
import { logger } from '../utils/logger.js';
import { z } from 'zod';

export const updateSettingsSchema = z.object({
  moderationEnabled: z.boolean().optional(),
  deleteMessages: z.boolean().optional(),
  warnUsers: z.boolean().optional(),
  notifyAdmin: z.boolean().optional(),
  maxViolations: z.number().min(1).max(10).optional(),
  autoAction: z.enum(['NONE', 'WARN', 'MUTE', 'KICK']).optional(),
  allowLinks: z.boolean().optional(),
  allowedDomains: z.string().optional(),
  allowAds: z.boolean().optional(),
  allowMentions: z.boolean().optional(),
  aiModeration: z.boolean().optional(),
});

export const broadcastSchema = z.object({
  message: z.string().min(1, 'نص الرسالة مطلوب'),
  groupId: z.string().optional(),
  targetJid: z.string().optional(), // raw WhatsApp JID for live groups
});

export class GroupController {
  public static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const groups = await GroupService.getAllGroups();
      res.json({ success: true, data: groups });
    } catch (error) {
      next(error);
    }
  }

  public static async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const group = await GroupService.getGroupById(req.params.id);
      if (!group) {
        res.status(404).json({ success: false, message: 'المجموعة غير موجودة' });
        return;
      }
      res.json({ success: true, data: group });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Returns all live WhatsApp groups the bot is currently participating in (from the adapter).
   * If using Baileys, these are the real groups fetched directly from WhatsApp.
   * Falls back to DB groups if adapter is in simulator mode.
   */
  public static async getLiveGroups(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const adapterStatus = whatsappAdapter.getStatus();
      let liveGroups: Array<{ id: string; name: string; participantsCount: number }> = [];

      if (adapterStatus.connected) {
        liveGroups = await whatsappAdapter.getMonitoredGroups();
      }

      // If adapter returned nothing, also include DB groups as fallback
      const dbGroups = await prisma.group.findMany({ select: { groupJid: true, name: true, participantCount: true } });
      const dbMap = new Map(dbGroups.map((g) => [g.groupJid, g]));

      // Merge: live groups take priority, DB fills extras
      const merged = [...liveGroups];
      for (const dbg of dbGroups) {
        if (!liveGroups.find((lg) => lg.id === dbg.groupJid)) {
          merged.push({ id: dbg.groupJid, name: dbg.name, participantsCount: dbg.participantCount });
        }
      }

      res.json({
        success: true,
        connected: adapterStatus.connected,
        provider: adapterStatus.provider,
        data: merged.map((g) => ({
          jid: g.id,
          name: g.name,
          participantsCount: g.participantsCount,
        })),
      });
    } catch (error) {
      next(error);
    }
  }

  public static async updateSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const settings = await GroupService.updateGroupSettings(req.params.id, req.body);
      res.json({
        success: true,
        message: 'تم تحديث إعدادات المجموعة بنجاح',
        data: settings,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async toggleStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { isActive } = req.body;
      const group = await GroupService.toggleGroupStatus(req.params.id, Boolean(isActive));
      res.json({
        success: true,
        message: `تم ${group.isActive ? 'تفعيل' : 'تعطيل'} المجموعة بنجاح`,
        data: group,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Broadcast a message to one or all groups.
   * Supports:
   *  - groupId: DB group ID
   *  - targetJid: raw WhatsApp JID (for live groups not yet in DB)
   *  - 'ALL': sends to all active DB groups + live adapter groups
   */
  public static async broadcastMessage(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { message, groupId, targetJid } = req.body;

      const formattedAnnouncement = `📢 *إعلان عام من إدارة المجموعة:*\n\n${message}\n\n✨ _بوت الإدارة والمراقبة_`;

      let sentCount = 0;
      const failed: string[] = [];

      // Case 1: Send to a specific raw WhatsApp JID (live group)
      if (targetJid) {
        const ok = await whatsappAdapter.sendMessage(targetJid, formattedAnnouncement);
        if (ok) sentCount++;
        else failed.push(targetJid);
      }
      // Case 2: Send to ALL groups (DB + live adapter)
      else if (!groupId || groupId === 'ALL') {
        const liveGroups = await whatsappAdapter.getMonitoredGroups();
        const dbGroups = await prisma.group.findMany({ where: { isActive: true } });

        // Combine unique JIDs
        const jids = new Set<string>([
          ...liveGroups.map((g) => g.id),
          ...dbGroups.map((g) => g.groupJid),
        ]);

        for (const jid of jids) {
          try {
            const ok = await whatsappAdapter.sendMessage(jid, formattedAnnouncement);
            if (ok) sentCount++;
            else failed.push(jid);
          } catch (err) {
            logger.error(`Failed to send broadcast to ${jid}:`, { err });
            failed.push(jid);
          }
        }
      }
      // Case 3: Send to a specific DB group
      else {
        const singleGroup = await prisma.group.findUnique({ where: { id: groupId } });
        if (singleGroup) {
          const ok = await whatsappAdapter.sendMessage(singleGroup.groupJid, formattedAnnouncement);
          if (ok) sentCount++;
          else failed.push(singleGroup.groupJid);
        }
      }

      res.json({
        success: true,
        message: `تم إرسال الرسالة بنجاح إلى ${sentCount} مجموعة.`,
        sentCount,
        failed,
      });
    } catch (error) {
      next(error);
    }
  }
}
