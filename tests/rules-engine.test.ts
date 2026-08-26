import { describe, it, expect, beforeAll, vi } from 'vitest';
import { RulesEngine } from '../src/moderation/rules-engine.js';
import { rulesCache } from '../src/moderation/cache.js';
import { prisma } from '../src/database/prisma.js';
import { ArabicNormalizer } from '../src/utils/arabic-normalizer.js';

describe('RulesEngine Suite', () => {
  beforeAll(async () => {
    vi.spyOn(prisma.forbiddenWord, 'findMany').mockResolvedValue([
      {
        id: 'rule-1',
        word: 'سبام_تجريبي',
        normalizedWord: ArabicNormalizer.normalize('سبام_تجريبي'),
        category: 'SPAM',
        severity: 'MEDIUM',
        enabled: true,
        isRegex: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    vi.spyOn(prisma.wordException, 'findMany').mockResolvedValue([
      {
        id: 'exc-1',
        word: 'إعلان رسمي من الإدارة',
        normalizedWord: ArabicNormalizer.normalize('إعلان رسمي من الإدارة'),
        reason: 'بيانات رسمية',
        createdAt: new Date(),
      },
    ]);

    vi.spyOn(prisma.group, 'findMany').mockResolvedValue([]);

    await rulesCache.initialize();
  });

  it('should detect forbidden word in message', async () => {
    const text = 'تحذير يوجد سبام_تجريبي هنا';
    const result = await RulesEngine.evaluate(text);
    expect(result.isViolation).toBe(true);
    expect(result.ruleMatched).toBe('سبام_تجريبي');
    expect(result.category).toBe('SPAM');
  });

  it('should ignore words matching exceptions list', async () => {
    const text = 'هذا إعلان رسمي من الإدارة نرجو الانتباه';
    const result = await RulesEngine.evaluate(text);
    expect(result.isViolation).toBe(false);
  });

  it('should pass completely clean text', async () => {
    const text = 'صباح الخير للجميع، نتمنى لكم يوماً سعيداً وموفقاً';
    const result = await RulesEngine.evaluate(text);
    expect(result.isViolation).toBe(false);
    expect(result.actionRequired).toBe('NONE');
  });
});
