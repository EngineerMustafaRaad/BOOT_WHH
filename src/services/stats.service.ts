import { prisma } from '../database/prisma.js';
import { whatsappAdapter } from '../whatsapp/factory.js';
import { rulesCache } from '../moderation/cache.js';

export class StatsService {
  public static async getDashboardStats() {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      totalGroups,
      activeGroups,
      totalMembers,
      totalViolations,
      todayViolations,
      topViolators,
      topRules,
      recentViolations,
    ] = await Promise.all([
      prisma.group.count(),
      prisma.group.count({ where: { isActive: true } }),
      prisma.member.count(),
      prisma.violation.count(),
      prisma.violation.count({
        where: { createdAt: { gte: todayStart } },
      }),
      prisma.member.findMany({
        where: { totalViolations: { gt: 0 } },
        orderBy: { totalViolations: 'desc' },
        take: 5,
        select: {
          id: true,
          name: true,
          phoneNumber: true,
          userJid: true,
          totalViolations: true,
          lastViolationAt: true,
        },
      }),
      prisma.violation.groupBy({
        by: ['detectedRule', 'category'],
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 5,
      }),
      prisma.violation.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          group: { select: { name: true } },
          member: { select: { name: true, phoneNumber: true } },
        },
      }),
    ]);

    const adapterStatus = whatsappAdapter.getStatus();
    const totalRules = rulesCache.getRules().length;

    // Approximate actions breakdown
    const deletedCount = await prisma.violation.count({
      where: { actionTaken: { contains: 'حذف' } },
    });

    const warningsCount = await prisma.violation.count({
      where: { actionTaken: { contains: 'تحذير' } },
    });

    return {
      overview: {
        botStatus: adapterStatus,
        totalGroups,
        activeGroups,
        totalMembers,
        totalRules,
        totalViolations,
        todayViolations,
        deletedMessages: deletedCount,
        warningsSent: warningsCount,
      },
      topViolators,
      topRules: topRules.map((r) => ({
        rule: r.detectedRule,
        category: r.category,
        count: r._count.id,
      })),
      recentViolations,
    };
  }
}
