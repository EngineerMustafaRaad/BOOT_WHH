import { prisma } from '../database/prisma.js';
import {
  IncomingMessage,
  ModerationResult,
  GroupConfig,
  AdminNotificationPayload,
  Category,
  Severity,
} from '../types/index.js';
import { logger } from '../utils/logger.js';

export interface ViolationHandlingResult {
  memberViolationCount: number;
  maxViolations: number;
  sanctionLevel: 'FIRST_WARNING' | 'SECOND_WARNING' | 'MAX_ACTION';
  warningMessage: string;
  actionTaken: string;
  notificationPayload: AdminNotificationPayload;
}

export class ViolationsManager {
  /**
   * Records a violation and determines progressive disciplinary action
   */
  public static async recordViolation(
    message: IncomingMessage,
    moderation: ModerationResult,
    groupConfig: GroupConfig
  ): Promise<ViolationHandlingResult> {
    const userJid = message.from;
    const userName = message.senderName || 'عضو';
    const groupJid = message.groupId;
    const groupName = message.groupName || groupConfig.groupName;

    // 1. Get or Create Member in Database
    let member = await prisma.member.findUnique({
      where: { userJid },
    });

    if (!member) {
      member = await prisma.member.create({
        data: {
          userJid,
          name: userName,
          phoneNumber: userJid.split('@')[0],
          totalViolations: 0,
        },
      });
    }

    // Increment violation count
    const updatedViolationCount = member.totalViolations + 1;
    await prisma.member.update({
      where: { id: member.id },
      data: {
        totalViolations: updatedViolationCount,
        lastViolationAt: new Date(),
      },
    });

    // 2. Determine Sanction Level based on progressive count
    const maxViolations = groupConfig.maxViolations || 3;
    let sanctionLevel: 'FIRST_WARNING' | 'SECOND_WARNING' | 'MAX_ACTION';
    let actionTaken = 'تم التحذير';
    let warningMessage = '';

    if (updatedViolationCount === 1) {
      sanctionLevel = 'FIRST_WARNING';
      actionTaken = groupConfig.deleteMessages ? 'حذف الرسالة + تحذير أول' : 'تحذير أول';
      warningMessage = `⚠️ تنبيه للعضو @${userJid.split('@')[0]}:\n` +
        `تم رصد مخالفة لتعليمات المجموعة (${moderation.ruleMatched || 'محتوى غير مسموح'}).\n` +
        `رصيد المخالفات: (1/${maxViolations}). يرجى الالتزام بالقوانين.`;
    } else if (updatedViolationCount < maxViolations) {
      sanctionLevel = 'SECOND_WARNING';
      actionTaken = groupConfig.deleteMessages ? 'حذف الرسالة + تحذير مشدد' : 'تحذير مشدد';
      warningMessage = `⚠️⚠️ تحذير مشدد للعضو @${userJid.split('@')[0]}:\n` +
        `لقد كررت مخالفة القواعد (${moderation.ruleMatched}).\n` +
        `رصيد المخالفات: (${updatedViolationCount}/${maxViolations}). عند تكرار المخالفة سيتم اتخاذ إجراء إداري فوري.`;
    } else {
      sanctionLevel = 'MAX_ACTION';
      const actionName =
        groupConfig.autoAction === 'KICK'
          ? 'طرد العضو'
          : groupConfig.autoAction === 'MUTE'
          ? 'كتم العضو'
          : 'حظر إداري';
      actionTaken = `تجاوز الحد الأقصى (${updatedViolationCount}/${maxViolations}) - ${actionName}`;
      warningMessage = `🚫 تنبيه إداري:\n` +
        `العضو @${userJid.split('@')[0]} تجاوز الحد الأقصى للمخالفات المسموحة (${updatedViolationCount}/${maxViolations}).\n` +
        `تم تطبيق الإجراء: ${actionName}.`;
    }

    // 3. Save Violation Audit Record in DB
    try {
      await prisma.violation.create({
        data: {
          groupId: groupConfig.groupId,
          groupJid,
          groupName,
          userId: member.id,
          userJid,
          userName,
          messageId: message.id,
          messageText: message.text,
          detectedRule: moderation.ruleMatched || 'قاعدة عامة',
          category: moderation.category || 'CUSTOM',
          severity: moderation.severity || 'MEDIUM',
          actionTaken,
        },
      });
      logger.info(`Violation recorded for ${userName} (${userJid}) in ${groupName}. Count: ${updatedViolationCount}`);
    } catch (error) {
      logger.error('Failed to save violation in database (logging audit in memory):', { error });
    }

    // 4. Build Admin Notification Payload
    const notificationPayload: AdminNotificationPayload = {
      groupName,
      groupJid,
      userName,
      userJid,
      phoneNumber: member.phoneNumber || userJid.split('@')[0],
      messageText: message.text,
      detectedRule: moderation.ruleMatched || 'مخالفة سياسات',
      category: (moderation.category || 'CUSTOM') as Category,
      severity: (moderation.severity || 'MEDIUM') as Severity,
      actionTaken,
      timestamp: new Date(),
      violationCount: updatedViolationCount,
      maxViolations,
    };

    return {
      memberViolationCount: updatedViolationCount,
      maxViolations,
      sanctionLevel,
      warningMessage,
      actionTaken,
      notificationPayload,
    };
  }
}
