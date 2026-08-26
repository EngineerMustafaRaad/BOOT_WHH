import { Request, Response, NextFunction } from 'express';
import { WordsService } from '../services/words.service.js';
import { prisma } from '../database/prisma.js';
import { logger } from '../utils/logger.js';
import { z } from 'zod';
import multer from 'multer';

// ─── Schemas ────────────────────────────────────────────────────────────────

export const createWordSchema = z.object({
  word: z.string().min(1, 'الكلمة مطلوبة'),
  category: z.enum(['SPAM', 'INSULT', 'ADVERTISEMENT', 'PROFANITY', 'HARASSMENT', 'CUSTOM']),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  enabled: z.boolean().optional().default(true),
  isRegex: z.boolean().optional().default(false),
});

export const updateWordSchema = createWordSchema.partial();

export const createExceptionSchema = z.object({
  word: z.string().min(1, 'العبارة المستثناة مطلوبة'),
  reason: z.string().optional(),
});

// ─── Multer: In-Memory Storage (no disk writes needed) ───────────────────────

export const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB max
  fileFilter: (_req, file, cb) => {
    const allowed = ['text/plain', 'text/csv', 'application/csv', 'application/vnd.ms-excel'];
    if (allowed.includes(file.mimetype) || file.originalname.match(/\.(txt|csv)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('يُسمح فقط بملفات .txt أو .csv'));
    }
  },
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseWordsFile(buffer: Buffer): string[] {
  const content = buffer.toString('utf-8');
  const lines = content
    .split(/[\r\n,،]+/)
    .map((l) => l.trim().replace(/^["'\u201C\u201D]+|["'\u201C\u201D]+$/g, '').trim())
    .filter((l) => l.length > 0 && l.length <= 200);
  return [...new Set(lines)]; // deduplicate
}

// ─── Controller ──────────────────────────────────────────────────────────────

export class WordsController {
  public static async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { search, category } = req.query;
      const words = await WordsService.getAllWords(search as string, category as string);
      res.json({ success: true, data: words });
    } catch (error) {
      next(error);
    }
  }

  public static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const word = await WordsService.createWord(req.body);
      res.status(201).json({ success: true, message: 'تم إضافة الكلمة بنجاح', data: word });
    } catch (error) {
      next(error);
    }
  }

  public static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const word = await WordsService.updateWord(req.params.id, req.body);
      res.json({ success: true, message: 'تم تحديث الكلمة بنجاح', data: word });
    } catch (error) {
      next(error);
    }
  }

  public static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await WordsService.deleteWord(req.params.id);
      res.json({ success: true, message: 'تم حذف الكلمة بنجاح' });
    } catch (error) {
      next(error);
    }
  }

  public static async getExceptions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const exceptions = await WordsService.getAllExceptions();
      res.json({ success: true, data: exceptions });
    } catch (error) {
      next(error);
    }
  }

  public static async createException(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { word, reason } = req.body;
      const exc = await WordsService.createException(word, reason);
      res.status(201).json({ success: true, message: 'تم إضافة الاستثناء بنجاح', data: exc });
    } catch (error) {
      next(error);
    }
  }

  public static async deleteException(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await WordsService.deleteException(req.params.id);
      res.json({ success: true, message: 'تم حذف الاستثناء بنجاح' });
    } catch (error) {
      next(error);
    }
  }

  public static async deleteAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const confirm = req.headers['x-confirm-delete-all'];
      if (confirm !== 'yes') {
        res.status(400).json({ success: false, message: 'يجب إرسال ترويسة التأكيد x-confirm-delete-all: yes' });
        return;
      }
      const result = await prisma.forbiddenWord.deleteMany({});
      res.json({ success: true, message: `تم حذف ${result.count} كلمة ممنوعة بنجاح`, deleted: result.count });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/words/import
   * Accepts multipart file upload (.txt or .csv) + body params:
   *   - action: 'WARN' | 'DELETE' | 'KICK'  (mapped to severity)
   *   - category: 'SPAM' | 'INSULT' | ...
   */
  public static async importFromFile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({ success: false, message: 'لم يتم تحميل أي ملف' });
        return;
      }

      const action: string = (req.body.action as string) || 'WARN';
      const category: string = (req.body.category as string) || 'CUSTOM';

      // Map action -> severity
      const actionSeverityMap: Record<string, string> = {
        WARN: 'MEDIUM',
        DELETE: 'HIGH',
        KICK: 'CRITICAL',
      };
      const severity = actionSeverityMap[action] || 'MEDIUM';

      const words = parseWordsFile(req.file.buffer);

      if (words.length === 0) {
        res.status(400).json({ success: false, message: 'الملف فارغ أو لا يحتوي على كلمات صالحة' });
        return;
      }

      // Bulk upsert — skip duplicates gracefully
      let added = 0;
      let skipped = 0;
      const errors: string[] = [];

      for (const word of words) {
        try {
          const existing = await prisma.forbiddenWord.findFirst({ where: { word } });
          if (existing) {
            skipped++;
            continue;
          }
          await prisma.forbiddenWord.create({
            data: {
              word,
              normalizedWord: word.replace(/[\u0627\u0623\u0625\u0622\u0671]/g, '\u0627').replace(/[\u0649\u064a]/g, '\u064a').replace(/\u0629/g, '\u0647').replace(/[\u064b-\u065f\u0670]/g, '').toLowerCase(),
              category: category as any,
              severity: severity as any,
              enabled: true,
              isRegex: false,
            },
          });
          added++;
        } catch (err) {
          logger.warn(`Failed to import word "${word}":`, { err });
          errors.push(word);
        }
      }

      logger.info(`Bulk import: ${added} words added, ${skipped} skipped, ${errors.length} errors.`);

      res.json({
        success: true,
        message: `تم استيراد ${added} كلمة بنجاح، تم تخطي ${skipped} كلمة مكررة${errors.length > 0 ? `، وفشل ${errors.length} كلمة` : ''}.`,
        added,
        skipped,
        total: words.length,
        errors: errors.slice(0, 10),
      });
    } catch (error) {
      next(error);
    }
  }
}
