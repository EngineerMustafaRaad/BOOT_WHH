import { prisma } from '../database/prisma.js';
import { rulesCache } from '../moderation/cache.js';
import { ArabicNormalizer } from '../utils/arabic-normalizer.js';
import { Category, Severity } from '../types/index.js';

export interface CreateWordDto {
  word: string;
  category: Category;
  severity: Severity;
  enabled?: boolean;
  isRegex?: boolean;
}

export interface UpdateWordDto {
  word?: string;
  category?: Category;
  severity?: Severity;
  enabled?: boolean;
  isRegex?: boolean;
}

export class WordsService {
  public static async getAllWords(search?: string, category?: string) {
    const where: any = {};
    if (category) {
      where.category = category;
    }
    if (search) {
      where.OR = [
        { word: { contains: search, mode: 'insensitive' } },
        { normalizedWord: { contains: ArabicNormalizer.normalize(search), mode: 'insensitive' } },
      ];
    }

    return prisma.forbiddenWord.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });
  }

  public static async createWord(dto: CreateWordDto) {
    const norm = ArabicNormalizer.normalize(dto.word);
    const word = await prisma.forbiddenWord.create({
      data: {
        word: dto.word.trim(),
        normalizedWord: norm,
        category: dto.category,
        severity: dto.severity,
        enabled: dto.enabled !== undefined ? dto.enabled : true,
        isRegex: Boolean(dto.isRegex),
      },
    });

    await rulesCache.reloadRules();
    return word;
  }

  public static async updateWord(id: string, dto: UpdateWordDto) {
    const data: any = { ...dto };
    if (dto.word) {
      data.word = dto.word.trim();
      data.normalizedWord = ArabicNormalizer.normalize(dto.word);
    }

    const updated = await prisma.forbiddenWord.update({
      where: { id },
      data,
    });

    await rulesCache.reloadRules();
    return updated;
  }

  public static async deleteWord(id: string) {
    const deleted = await prisma.forbiddenWord.delete({
      where: { id },
    });

    await rulesCache.reloadRules();
    return deleted;
  }

  public static async getAllExceptions() {
    return prisma.wordException.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  public static async createException(word: string, reason?: string) {
    const norm = ArabicNormalizer.normalize(word);
    const exc = await prisma.wordException.create({
      data: {
        word: word.trim(),
        normalizedWord: norm,
        reason,
      },
    });

    await rulesCache.reloadExceptions();
    return exc;
  }

  public static async deleteException(id: string) {
    const deleted = await prisma.wordException.delete({
      where: { id },
    });

    await rulesCache.reloadExceptions();
    return deleted;
  }
}
