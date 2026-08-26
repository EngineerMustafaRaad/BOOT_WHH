import { rulesCache } from './cache.js';
import { ArabicNormalizer } from '../utils/arabic-normalizer.js';
import { UrlDetector } from './url-detector.js';
import { AdsDetector } from './ads-detector.js';
import { AiModerator } from './ai-moderator.js';
import { ModerationResult, GroupConfig, Category, Severity } from '../types/index.js';
import { logger } from '../utils/logger.js';

export class RulesEngine {
  /**
   * Main evaluation pipeline for an incoming message in a specific group
   */
  public static async evaluate(
    text: string,
    groupConfig?: GroupConfig
  ): Promise<ModerationResult> {
    if (!text || text.trim().length === 0) {
      return {
        isViolation: false,
        actionRequired: 'NONE',
        source: 'RULES_ENGINE',
      };
    }

    const normalizedText = ArabicNormalizer.normalize(text);

    // 1. Check Exceptions / Whitelist Phrases
    const exceptions = rulesCache.getExceptions();
    for (const exc of exceptions) {
      if (ArabicNormalizer.containsPhrase(normalizedText, exc.normalizedWord)) {
        logger.debug(`Message matched exception rule "${exc.word}". Allowed without violation.`);
        return {
          isViolation: false,
          actionRequired: 'NONE',
          source: 'RULES_ENGINE',
          normalizedText,
        };
      }
    }

    // 2. Check Forbidden Words & Phrases (In-Memory Fast Match)
    const rules = rulesCache.getRules();
    for (const rule of rules) {
      if (!rule.enabled) continue;

      let isMatch = false;
      if (rule.isRegex) {
        try {
          const regex = new RegExp(rule.word, 'iu');
          isMatch = regex.test(text) || regex.test(normalizedText);
        } catch {
          // Invalid regex fallback
          isMatch = false;
        }
      } else {
        isMatch = ArabicNormalizer.containsPhrase(normalizedText, rule.normalizedWord);
      }

      if (isMatch) {
        logger.warn(`Forbidden rule matched: "${rule.word}" [${rule.category}/${rule.severity}]`);
        return {
          isViolation: true,
          ruleMatched: rule.word,
          category: rule.category,
          severity: rule.severity,
          actionRequired: this.determineInitialAction(rule.severity),
          details: `تم اكتشاف كلمة أو عبارة ممنوعة (${rule.word}) تتبع لتصنيف ${rule.category}`,
          source: 'RULES_ENGINE',
          normalizedText,
        };
      }
    }

    // 3. Check URL / Link Policies (if group config available)
    if (groupConfig) {
      const urlCheck = UrlDetector.checkMessage(
        text,
        groupConfig.allowLinks,
        groupConfig.allowedDomains
      );

      if (urlCheck.isViolating) {
        logger.warn(`Unauthorized URL detected in group ${groupConfig.groupName}: ${urlCheck.unauthorizedUrls.join(', ')}`);
        return {
          isViolation: true,
          ruleMatched: urlCheck.unauthorizedUrls[0],
          category: 'SPAM',
          severity: 'MEDIUM',
          actionRequired: 'DELETE',
          details: `نشر روابط أو نطاقات غير مصرح بها في المجموعة: ${urlCheck.unauthorizedUrls.join(', ')}`,
          source: 'URL_FILTER',
          normalizedText,
        };
      }

      // 4. Check Advertisement & Phone numbers
      const adsCheck = AdsDetector.checkMessage(text, groupConfig.allowAds);
      if (adsCheck.isAd) {
        logger.warn(`Commercial advertisement detected in group ${groupConfig.groupName}`);
        return {
          isViolation: true,
          ruleMatched: adsCheck.detectedAdPhrases[0] || adsCheck.detectedPhoneNumbers[0] || 'إعلان تجاري',
          category: 'ADVERTISEMENT',
          severity: 'MEDIUM',
          actionRequired: 'DELETE',
          details: adsCheck.reason || 'تم اكتشاف إعلان تجاري أو رقم تواصل مخالف لتعليمات المجموعة',
          source: 'ADS_FILTER',
          normalizedText,
        };
      }
    }

    // 5. Optional AI Moderation Context Layer
    if (groupConfig?.aiModeration || (process.env.AI_MODERATION_ENABLED === 'true' && text.length > 20)) {
      const aiResult = await AiModerator.analyzeText(text);
      if (aiResult && aiResult.isViolation) {
        logger.warn(`AI Moderation detected contextual violation: ${aiResult.explanation}`);
        return {
          isViolation: true,
          ruleMatched: `AI:${aiResult.category || 'CUSTOM'}`,
          category: aiResult.category || 'INSULT',
          severity: aiResult.severity || 'HIGH',
          actionRequired: this.determineInitialAction(aiResult.severity || 'HIGH'),
          details: aiResult.explanation || 'تم اكتشاف محتوى مسيء عبر التحليل الدلالي بالذكاء الاصطناعي',
          source: 'AI_MODERATION',
          normalizedText,
        };
      }
    }

    return {
      isViolation: false,
      actionRequired: 'NONE',
      source: 'RULES_ENGINE',
      normalizedText,
    };
  }

  private static determineInitialAction(severity: Severity): 'WARN' | 'DELETE' | 'MUTE' | 'KICK' {
    switch (severity) {
      case 'CRITICAL':
        return 'KICK';
      case 'HIGH':
        return 'DELETE';
      case 'MEDIUM':
        return 'DELETE';
      case 'LOW':
      default:
        return 'WARN';
    }
  }
}
