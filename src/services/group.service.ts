import { prisma } from '../database/prisma.js';
import { rulesCache } from '../moderation/cache.js';
import { AutoAction } from '../types/index.js';

export interface UpdateGroupSettingsDto {
  moderationEnabled?: boolean;
  deleteMessages?: boolean;
  warnUsers?: boolean;
  notifyAdmin?: boolean;
  maxViolations?: number;
  autoAction?: AutoAction;
  allowLinks?: boolean;
  allowedDomains?: string;
  allowAds?: boolean;
  allowMentions?: boolean;
  aiModeration?: boolean;
}

export class GroupService {
  public static async getAllGroups() {
    return prisma.group.findMany({
      include: {
        settings: true,
        _count: {
          select: { violations: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  public static async getGroupById(id: string) {
    return prisma.group.findUnique({
      where: { id },
      include: {
        settings: true,
        violations: {
          take: 20,
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }

  public static async createOrUpdateGroup(groupJid: string, name: string, participantCount = 0) {
    const group = await prisma.group.upsert({
      where: { groupJid },
      update: { name, participantCount },
      create: {
        groupJid,
        name,
        participantCount,
        settings: {
          create: {
            moderationEnabled: true,
            deleteMessages: true,
            warnUsers: true,
            notifyAdmin: true,
            maxViolations: 3,
            autoAction: 'WARN',
            allowLinks: false,
            allowedDomains: 'youtube.com,facebook.com,instagram.com,twitter.com,x.com,github.com',
            allowAds: false,
            allowMentions: true,
            aiModeration: false,
          },
        },
      },
      include: { settings: true },
    });

    await rulesCache.reloadGroupConfigs();
    return group;
  }

  public static async updateGroupSettings(groupId: string, data: UpdateGroupSettingsDto) {
    const settings = await prisma.groupSettings.upsert({
      where: { groupId },
      update: data,
      create: {
        groupId,
        ...data,
      },
    });

    await rulesCache.reloadGroupConfigs();
    return settings;
  }

  public static async toggleGroupStatus(id: string, isActive: boolean) {
    const group = await prisma.group.update({
      where: { id },
      data: { isActive },
      include: { settings: true },
    });

    await rulesCache.reloadGroupConfigs();
    return group;
  }
}
