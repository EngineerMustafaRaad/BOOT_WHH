import { prisma } from '../database/prisma.js';

export interface ViolationsFilterDto {
  groupId?: string;
  userId?: string;
  category?: string;
  severity?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

export class ViolationsService {
  public static async getViolations(filter: ViolationsFilterDto) {
    const where: any = {};

    if (filter.groupId) {
      where.groupId = filter.groupId;
    }
    if (filter.userId) {
      where.userId = filter.userId;
    }
    if (filter.category) {
      where.category = filter.category;
    }
    if (filter.severity) {
      where.severity = filter.severity;
    }
    if (filter.startDate || filter.endDate) {
      where.createdAt = {};
      if (filter.startDate) where.createdAt.gte = new Date(filter.startDate);
      if (filter.endDate) where.createdAt.lte = new Date(filter.endDate);
    }

    const limit = filter.limit || 50;
    const offset = filter.offset || 0;

    const [items, total] = await Promise.all([
      prisma.violation.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
        include: {
          group: { select: { id: true, name: true, groupJid: true } },
          member: { select: { id: true, name: true, userJid: true, phoneNumber: true, totalViolations: true } },
        },
      }),
      prisma.violation.count({ where }),
    ]);

    return { items, total, limit, offset };
  }

  public static async getMembers(search?: string) {
    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phoneNumber: { contains: search } },
        { userJid: { contains: search } },
      ];
    }

    return prisma.member.findMany({
      where,
      orderBy: { totalViolations: 'desc' },
      include: {
        _count: {
          select: { violations: true },
        },
      },
    });
  }

  public static async resetMemberViolations(memberId: string) {
    return prisma.member.update({
      where: { id: memberId },
      data: { totalViolations: 0 },
    });
  }
}
