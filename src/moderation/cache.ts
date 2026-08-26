import { prisma } from '../database/prisma.js';
import { CachedRule, CachedException, GroupConfig, Category, Severity, AutoAction } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { ArabicNormalizer } from '../utils/arabic-normalizer.js';

class RulesCache {
  private static instance: RulesCache;
  private rules: CachedRule[] = [];
  private exceptions: CachedException[] = [];
  private groupConfigs: Map<string, GroupConfig> = new Map();
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): RulesCache {
    if (!RulesCache.instance) {
      RulesCache.instance = new RulesCache();
    }
    return RulesCache.instance;
  }

  public async initialize(): Promise<void> {
    try {
      await this.reloadRules();
      await this.reloadExceptions();
      await this.reloadGroupConfigs();
      this.isInitialized = true;
      logger.info(`In-memory RulesCache loaded with ${this.rules.length} rules, ${this.exceptions.length} exceptions, and ${this.groupConfigs.size} group configs`);
    } catch (error) {
      logger.warn('Failed to load RulesCache from DB (falling back to initial in-memory defaults)', { error });
      // Provide fallback default rules if DB is offline initially
      if (this.rules.length === 0) {
        this.rules = [
          {
            id: 'default-1',
            word: 'سبام_تجريبي',
            normalizedWord: ArabicNormalizer.normalize('سبام_تجريبي'),
            category: 'SPAM',
            severity: 'LOW',
            enabled: true,
            isRegex: false,
          },
          {
            id: 'default-2',
            word: 'احتيال_مالي',
            normalizedWord: ArabicNormalizer.normalize('احتيال_مالي'),
            category: 'SPAM',
            severity: 'CRITICAL',
            enabled: true,
            isRegex: false,
          },
        ];
      }
      this.isInitialized = true;
    }
  }

  public async reloadRules(): Promise<void> {
    try {
      const dbRules = await prisma.forbiddenWord.findMany({
        where: { enabled: true },
      });
      this.rules = dbRules.map((r) => ({
        id: r.id,
        word: r.word,
        normalizedWord: r.normalizedWord || ArabicNormalizer.normalize(r.word),
        category: r.category as Category,
        severity: r.severity as Severity,
        enabled: r.enabled,
        isRegex: r.isRegex,
      }));
    } catch (error) {
      logger.error('Error reloading rules into cache:', { error });
    }
  }

  public async reloadExceptions(): Promise<void> {
    try {
      const dbExceptions = await prisma.wordException.findMany();
      this.exceptions = dbExceptions.map((e) => ({
        id: e.id,
        word: e.word,
        normalizedWord: e.normalizedWord || ArabicNormalizer.normalize(e.word),
      }));
    } catch (error) {
      logger.error('Error reloading exceptions into cache:', { error });
    }
  }

  public async reloadGroupConfigs(): Promise<void> {
    try {
      const dbGroups = await prisma.group.findMany({
        include: { settings: true },
      });
      this.groupConfigs.clear();
      for (const g of dbGroups) {
        const s = g.settings;
        this.groupConfigs.set(g.groupJid, {
          groupId: g.id,
          groupJid: g.groupJid,
          groupName: g.name,
          moderationEnabled: s ? s.moderationEnabled : true,
          deleteMessages: s ? s.deleteMessages : true,
          warnUsers: s ? s.warnUsers : true,
          notifyAdmin: s ? s.notifyAdmin : true,
          maxViolations: s ? s.maxViolations : 3,
          autoAction: (s ? s.autoAction : 'WARN') as AutoAction,
          allowLinks: s ? s.allowLinks : false,
          allowedDomains: s && s.allowedDomains ? s.allowedDomains.split(',').map((d) => d.trim().toLowerCase()) : [],
          allowAds: s ? s.allowAds : false,
          allowMentions: s ? s.allowMentions : true,
          aiModeration: s ? s.aiModeration : false,
        });
      }
    } catch (error) {
      logger.error('Error reloading group configs into cache:', { error });
    }
  }

  public getRules(): CachedRule[] {
    return this.rules;
  }

  public getExceptions(): CachedException[] {
    return this.exceptions;
  }

  public getGroupConfig(groupJid: string): GroupConfig | undefined {
    return this.groupConfigs.get(groupJid);
  }

  public setGroupConfig(groupJid: string, config: GroupConfig): void {
    this.groupConfigs.set(groupJid, config);
  }

  public isReady(): boolean {
    return this.isInitialized;
  }
}

export const rulesCache = RulesCache.getInstance();
