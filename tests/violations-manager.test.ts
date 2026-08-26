import { describe, it, expect, vi } from 'vitest';
import { ViolationsManager } from '../src/moderation/violations-manager.js';
import { IncomingMessage, ModerationResult, GroupConfig } from '../src/types/index.js';
import { prisma } from '../src/database/prisma.js';

describe('ViolationsManager Progressive Sanctions', () => {
  const dummyMessage: IncomingMessage = {
    id: 'test-msg-1',
    from: '966599999999@s.whatsapp.net',
    senderName: 'محمد التجريبي',
    groupId: 'test-group-jid@g.us',
    groupName: 'مجموعة الاختبار',
    text: 'رسالة تحتوي سبام_تجريبي',
    timestamp: new Date(),
    isGroup: true,
    isAdmin: false,
  };

  const dummyModeration: ModerationResult = {
    isViolation: true,
    ruleMatched: 'سبام_تجريبي',
    category: 'SPAM',
    severity: 'MEDIUM',
    actionRequired: 'DELETE',
    source: 'RULES_ENGINE',
  };

  const dummyGroupConfig: GroupConfig = {
    groupId: 'group-uuid-1',
    groupJid: 'test-group-jid@g.us',
    groupName: 'مجموعة الاختبار',
    moderationEnabled: true,
    deleteMessages: true,
    warnUsers: true,
    notifyAdmin: true,
    maxViolations: 3,
    autoAction: 'KICK',
    allowLinks: false,
    allowedDomains: ['youtube.com'],
    allowAds: false,
    allowMentions: true,
    aiModeration: false,
  };

  it('should format progressive warning message for 1st, 2nd, and 3rd violation', async () => {
    // Mock prisma responses
    let currentViolations = 0;

    vi.spyOn(prisma.member, 'findUnique').mockImplementation(async () => ({
      id: 'member-123',
      userJid: dummyMessage.from,
      phoneNumber: '966599999999',
      name: 'محمد التجريبي',
      totalViolations: currentViolations,
      isBlocked: false,
      lastViolationAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    vi.spyOn(prisma.member, 'update').mockImplementation(async () => {
      currentViolations++;
      return {} as any;
    });

    vi.spyOn(prisma.violation, 'create').mockImplementation(async () => ({} as any));

    // 1st Violation test
    currentViolations = 0;
    const res1 = await ViolationsManager.recordViolation(dummyMessage, dummyModeration, dummyGroupConfig);
    expect(res1.sanctionLevel).toBe('FIRST_WARNING');
    expect(res1.memberViolationCount).toBe(1);
    expect(res1.warningMessage).toContain('1/3');

    // 2nd Violation test
    currentViolations = 1;
    const res2 = await ViolationsManager.recordViolation(dummyMessage, dummyModeration, dummyGroupConfig);
    expect(res2.sanctionLevel).toBe('SECOND_WARNING');
    expect(res2.memberViolationCount).toBe(2);
    expect(res2.warningMessage).toContain('2/3');

    // 3rd Violation test (Max)
    currentViolations = 2;
    const res3 = await ViolationsManager.recordViolation(dummyMessage, dummyModeration, dummyGroupConfig);
    expect(res3.sanctionLevel).toBe('MAX_ACTION');
    expect(res3.memberViolationCount).toBe(3);
    expect(res3.actionTaken).toContain('طرد العضو');
  });
});
