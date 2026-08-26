import { IncomingMessage, GroupConfig } from '../types/index.js';
import { prisma } from '../database/prisma.js';
import { rulesCache } from '../moderation/cache.js';
import { whatsappAdapter } from '../whatsapp/factory.js';
import { ArabicNormalizer } from '../utils/arabic-normalizer.js';
import { logger } from '../utils/logger.js';

export class CommandHandler {
  /**
   * Checks if incoming message is an admin command and handles it
   */
  public static async handle(
    message: IncomingMessage,
    groupConfig?: GroupConfig
  ): Promise<boolean> {
    const text = message.text.trim();
    if (!text.startsWith('!') && !text.startsWith('/')) {
      return false;
    }

    const parts = text.slice(1).split(/\s+/);
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    logger.info(`Command received: !${command} in group ${message.groupId} by ${message.from} (isAdmin: ${message.isAdmin})`);

    // Only allow verified group admins to run moderation commands (except public !rules)
    if (command !== 'rules' && !message.isAdmin) {
      await whatsappAdapter.sendMessage(
        message.groupId,
        `⚠️ عذراً @${message.from.split('@')[0]}، هذه الأوامر الإدارية مخصصة لمشرفي المجموعة فقط.`
      );
      return true;
    }

    switch (command) {
      case 'rules':
      case 'قوانين':
        await this.cmdRules(message, groupConfig);
        return true;

      case 'status':
      case 'حالة':
        await this.cmdStatus(message, groupConfig);
        return true;

      case 'warnings':
      case 'تحذيرات':
        await this.cmdWarnings(message, args);
        return true;

      case 'addword':
      case 'اضافة_كلمة':
        await this.cmdAddWord(message, args);
        return true;

      case 'delword':
      case 'حذف_كلمة':
        await this.cmdDelWord(message, args);
        return true;

      case 'moderation':
      case 'مراقبة':
        await this.cmdToggleModeration(message, args, groupConfig);
        return true;

      case 'mute':
      case 'كتم':
        await this.cmdMute(message);
        return true;

      default:
        // Unknown command
        return false;
    }
  }

  private static async cmdRules(message: IncomingMessage, config?: GroupConfig): Promise<void> {
    const rules = [
      '📜 *قوانين المجموعة وتعليمات المراقبة الآلية:*',
      '1️⃣ يمنع منعاً باتاً السب والشتم والإساءة اللفظية.',
      '2️⃣ يمنع نشر الروابط الإعلانية والدعايات غير المصرح بها.',
      '3️⃣ يمنع نشر أرقام الهواتف ورسائل الترويج العشوائي (SPAM).',
      config?.allowLinks ? '✅ الروابط العامة مسموحة في هذه المجموعة.' : '🚫 الروابط مقيدة فقط بالمواقع المعتمدة.',
      `⚠️ الحد الأقصى للمخالفات قبل اتخاذ إجراء: ${config?.maxViolations || 3} مخالفات.`,
      '\n✨ نتمنى لكم تواجداً طيباً ومفيداً!',
    ].join('\n');

    await whatsappAdapter.sendMessage(message.groupId, rules);
  }

  private static async cmdStatus(message: IncomingMessage, config?: GroupConfig): Promise<void> {
    const status = whatsappAdapter.getStatus();
    const rulesCount = rulesCache.getRules().length;
    const isModEnabled = config ? config.moderationEnabled : true;

    const reply = [
      '🤖 *حالة بوت المراقبة والأمان:*',
      `• حالة المزود: ${status.connected ? '🟢 متصل ونشط' : '🔴 غير متصل'}`,
      `• المزود الحالي: ${status.provider}`,
      `• نظام المراقبة: ${isModEnabled ? '🟢 مفعّل' : '🔴 متوقف'}`,
      `• حذف الرسائل التلقائي: ${config?.deleteMessages ? 'مفعّل' : 'معطّل'}`,
      `• عدد القواعد والكلمات المحمية: ${rulesCount} كلمة`,
      `• الذكاء الاصطناعي: ${config?.aiModeration ? 'مفعّل' : 'معطّل'}`,
    ].join('\n');

    await whatsappAdapter.sendMessage(message.groupId, reply);
  }

  private static async cmdWarnings(message: IncomingMessage, args: string[]): Promise<void> {
    const targetJid = args[0]
      ? `${args[0].replace(/[@+\s]/g, '')}@s.whatsapp.net`
      : message.from;

    const member = await prisma.member.findUnique({
      where: { userJid: targetJid },
      include: {
        violations: {
          take: 5,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!member || member.totalViolations === 0) {
      await whatsappAdapter.sendMessage(
        message.groupId,
        `✅ السجل نظيف للعضو @${targetJid.split('@')[0]} - لا توجد أي مخالفات مسجلة.`
      );
      return;
    }

    let reply = `📋 *سجل مخالفات العضو @${targetJid.split('@')[0]}:*\n` +
      `• إجمالي المخالفات: ${member.totalViolations}\n` +
      `• آخر مخالفة: ${member.lastViolationAt ? new Date(member.lastViolationAt).toLocaleDateString('ar-EG') : 'غير محدد'}\n` +
      `• تفاصيل آخر المخالفات:\n`;

    member.violations.forEach((v, idx) => {
      reply += ` ${idx + 1}. [${v.category}] ${v.detectedRule} (${v.actionTaken})\n`;
    });

    await whatsappAdapter.sendMessage(message.groupId, reply);
  }

  private static async cmdAddWord(message: IncomingMessage, args: string[]): Promise<void> {
    const word = args.join(' ').trim();
    if (!word) {
      await whatsappAdapter.sendMessage(
        message.groupId,
        '❌ يرجى تحديد الكلمة المراد منعها. مثال:\n`!addword كلمة_ممنوعة`'
      );
      return;
    }

    const norm = ArabicNormalizer.normalize(word);
    try {
      await prisma.forbiddenWord.upsert({
        where: { word },
        update: { enabled: true, normalizedWord: norm },
        create: {
          word,
          normalizedWord: norm,
          category: 'CUSTOM',
          severity: 'MEDIUM',
          enabled: true,
        },
      });

      await rulesCache.reloadRules();
      await whatsappAdapter.sendMessage(
        message.groupId,
        `✅ تم بنجاح إضافة الكلمة "${word}" إلى قائمة الكلمات الممنوعة وتحديث الذاكرة المؤقتة.`
      );
    } catch (error) {
      logger.error('Error in !addword command:', { error });
      await whatsappAdapter.sendMessage(message.groupId, '❌ حدث خطأ أثناء حفظ الكلمة.');
    }
  }

  private static async cmdDelWord(message: IncomingMessage, args: string[]): Promise<void> {
    const word = args.join(' ').trim();
    if (!word) {
      await whatsappAdapter.sendMessage(
        message.groupId,
        '❌ يرجى كتابة الكلمة المراد حذفها. مثال:\n`!delword الكلمة`'
      );
      return;
    }

    try {
      const existing = await prisma.forbiddenWord.findFirst({
        where: { word },
      });

      if (!existing) {
        await whatsappAdapter.sendMessage(
          message.groupId,
          `⚠️ الكلمة "${word}" غير موجودة في قائمة الممنوعات.`
        );
        return;
      }

      await prisma.forbiddenWord.delete({ where: { id: existing.id } });
      await rulesCache.reloadRules();

      await whatsappAdapter.sendMessage(
        message.groupId,
        `✅ تم حذف الكلمة "${word}" من قائمة الممنوعات بنجاح.`
      );
    } catch (error) {
      logger.error('Error in !delword command:', { error });
      await whatsappAdapter.sendMessage(message.groupId, '❌ حدث خطأ أثناء حذف الكلمة.');
    }
  }

  private static async cmdToggleModeration(
    message: IncomingMessage,
    args: string[],
    config?: GroupConfig
  ): Promise<void> {
    const mode = args[0]?.toLowerCase();
    if (mode !== 'on' && mode !== 'off' && mode !== 'تشغيل' && mode !== 'ايقاف') {
      await whatsappAdapter.sendMessage(
        message.groupId,
        '❌ الصيغة الصحيحة: `!moderation on` أو `!moderation off`'
      );
      return;
    }

    const isEnabled = mode === 'on' || mode === 'تشغيل';

    if (config?.groupId) {
      await prisma.groupSettings.upsert({
        where: { groupId: config.groupId },
        update: { moderationEnabled: isEnabled },
        create: {
          groupId: config.groupId,
          moderationEnabled: isEnabled,
        },
      });
      await rulesCache.reloadGroupConfigs();
    }

    await whatsappAdapter.sendMessage(
      message.groupId,
      `🛡️ تم ${isEnabled ? 'تشغيل 🟢' : 'إيقاف 🔴'} نظام المراقبة التلقائية في هذه المجموعة.`
    );
  }

  private static async cmdMute(message: IncomingMessage): Promise<void> {
    await whatsappAdapter.sendMessage(
      message.groupId,
      '⚙️ أمر الكتم الإداري: يرجى استخدام إعدادات المجموعة في لوحة التحكم لتطبيق سياسة الكتم التلقائي.'
    );
  }
}
