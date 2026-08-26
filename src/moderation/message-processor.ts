import { IncomingMessage, GroupConfig } from '../types/index.js';
import { rulesCache } from './cache.js';
import { RulesEngine } from './rules-engine.js';
import { ViolationsManager } from './violations-manager.js';
import { CommandHandler } from '../admin/command-handler.js';
import { whatsappAdapter } from '../whatsapp/factory.js';
import { notificationService } from '../notifications/notification.service.js';
import { logger } from '../utils/logger.js';

export class MessageProcessor {
  /**
   * Main message processing orchestrator
   */
  public static async process(message: IncomingMessage): Promise<void> {
    const startTime = Date.now();
    logger.info(`Message received from ${message.from} in [${message.groupId}]: "${message.text.substring(0, 40)}"`);

    // 1. Get Group Configuration from Cache
    let groupConfig = rulesCache.getGroupConfig(message.groupId);

    // Fallback default config if group is unconfigured
    if (!groupConfig) {
      groupConfig = {
        groupId: 'unregistered',
        groupJid: message.groupId,
        groupName: message.groupName || 'مجموعة واتساب',
        moderationEnabled: true,
        deleteMessages: true,
        warnUsers: true,
        notifyAdmin: true,
        maxViolations: 3,
        autoAction: 'WARN',
        allowLinks: false,
        allowedDomains: ['youtube.com', 'facebook.com', 'instagram.com', 'twitter.com', 'x.com', 'github.com'],
        allowAds: false,
        allowMentions: true,
        aiModeration: false,
      };
    }

    // 2. Check for Admin In-Group Commands
    const isCommandHandled = await CommandHandler.handle(message, groupConfig);
    if (isCommandHandled) {
      return;
    }

    // 3. Skip moderation if disabled for this group
    if (!groupConfig.moderationEnabled) {
      logger.debug(`Moderation disabled for group ${groupConfig.groupName}. Skipping.`);
      return;
    }

    // Skip admin messages from moderation checks to allow administrative posting
    if (message.isAdmin) {
      logger.debug(`Message sent by group admin ${message.from}. Skipping moderation.`);
      return;
    }

    // 4. Run Moderation Rules Engine
    const moderation = await RulesEngine.evaluate(message.text, groupConfig);

    if (!moderation.isViolation) {
      const duration = Date.now() - startTime;
      logger.debug(`Message clean. Checked in ${duration}ms.`);
      return;
    }

    logger.warn(
      `VIOLATION DETECTED in ${groupConfig.groupName} by ${message.from}. Rule: ${moderation.ruleMatched} [${moderation.category}/${moderation.severity}]`
    );

    // 5. Delete Violating Message (if enabled in group settings)
    if (groupConfig.deleteMessages) {
      await whatsappAdapter.deleteMessage(message.groupId, message.id, message.from);
    }

    // 6. Record Violation & Process Progressive Sanctions
    const violationResult = await ViolationsManager.recordViolation(
      message,
      moderation,
      groupConfig
    );

    // 7. Send In-Group Warning Message
    if (groupConfig.warnUsers && violationResult.warningMessage) {
      await whatsappAdapter.sendMessage(message.groupId, violationResult.warningMessage);
    }

    // 8. Dispatch Admin Alerts
    if (groupConfig.notifyAdmin) {
      await notificationService.notifyAdmins(violationResult.notificationPayload);
    }

    // 9. Execute Auto-Action if Max Violations reached
    if (violationResult.sanctionLevel === 'MAX_ACTION') {
      if (groupConfig.autoAction === 'KICK') {
        logger.info(`Applying KICK action on ${message.from} in ${message.groupId}`);
        await whatsappAdapter.kickParticipant(message.groupId, message.from);
      }
    }

    const totalDuration = Date.now() - startTime;
    logger.info(`Violation fully processed in ${totalDuration}ms. Action: ${violationResult.actionTaken}`);
  }
}
