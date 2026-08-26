import { whatsappAdapter } from '../whatsapp/factory.js';
import { SimulatorAdapter } from '../whatsapp/simulator.adapter.js';
import { MessageProcessor } from '../moderation/message-processor.js';
import { ArabicNormalizer } from '../utils/arabic-normalizer.js';
import { RulesEngine } from '../moderation/rules-engine.js';
import { rulesCache } from '../moderation/cache.js';

export interface SimulateMessageRequest {
  text: string;
  senderName?: string;
  senderPhone?: string;
  groupJid?: string;
  isAdmin?: boolean;
}

export class SimulatorService {
  public static async simulateIncomingMessage(data: SimulateMessageRequest) {
    const senderJid = data.senderPhone
      ? `${data.senderPhone.replace(/[@+\s]/g, '')}@s.whatsapp.net`
      : '966500000001@s.whatsapp.net';

    const groupJid = data.groupJid || '120363012345678901@g.us';

    let groupConfig = rulesCache.getGroupConfig(groupJid);
    if (!groupConfig) {
      groupConfig = {
        groupId: 'sim-group-1',
        groupJid,
        groupName: 'مجموعة المطورين والتقنية (تجريبية)',
        moderationEnabled: true,
        deleteMessages: true,
        warnUsers: true,
        notifyAdmin: true,
        maxViolations: 3,
        autoAction: 'WARN',
        allowLinks: false,
        allowedDomains: ['youtube.com', 'facebook.com', 'instagram.com', 'github.com'],
        allowAds: false,
        allowMentions: true,
        aiModeration: false,
      };
    }

    // Direct dry-run evaluation for instant UI response details
    const normalized = ArabicNormalizer.normalize(data.text);
    const moderationEvaluation = await RulesEngine.evaluate(data.text, groupConfig);

    // If SimulatorAdapter is active, trigger full lifecycle execution
    if (whatsappAdapter instanceof SimulatorAdapter) {
      await (whatsappAdapter as SimulatorAdapter).simulateIncomingMessage({
        text: data.text,
        senderJid,
        senderName: data.senderName || 'عضو تجريبي',
        groupId: groupJid,
        isAdmin: Boolean(data.isAdmin),
      });
    } else {
      // Process through MessageProcessor directly
      await MessageProcessor.process({
        id: 'sim_' + Date.now(),
        from: senderJid,
        senderName: data.senderName || 'عضو تجريبي',
        groupId: groupJid,
        groupName: groupConfig.groupName,
        text: data.text,
        timestamp: new Date(),
        isGroup: true,
        isAdmin: Boolean(data.isAdmin),
      });
    }

    const logs =
      whatsappAdapter instanceof SimulatorAdapter
        ? (whatsappAdapter as SimulatorAdapter).getActivityLogs()
        : [];

    return {
      success: true,
      originalText: data.text,
      normalizedText: normalized,
      evaluation: moderationEvaluation,
      recentLogs: logs.slice(0, 10),
    };
  }

  public static getSimulatorLogs() {
    if (whatsappAdapter instanceof SimulatorAdapter) {
      return (whatsappAdapter as SimulatorAdapter).getActivityLogs();
    }
    return [];
  }

  public static clearSimulatorLogs() {
    if (whatsappAdapter instanceof SimulatorAdapter) {
      (whatsappAdapter as SimulatorAdapter).clearLogs();
    }
    return { success: true };
  }
}
