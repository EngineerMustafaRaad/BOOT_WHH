import { describe, it, expect, vi } from 'vitest';
import { CommandHandler } from '../src/admin/command-handler.js';
import { IncomingMessage } from '../src/types/index.js';
import { whatsappAdapter } from '../src/whatsapp/factory.js';

describe('CommandHandler Suite', () => {
  it('should reject admin commands from non-admin participants', async () => {
    const nonAdminMsg: IncomingMessage = {
      id: 'cmd-1',
      from: '966500000099@s.whatsapp.net',
      groupId: '120363012345678901@g.us',
      text: '!addword كلمة_جديدة',
      timestamp: new Date(),
      isGroup: true,
      isAdmin: false,
    };

    const sendSpy = vi.spyOn(whatsappAdapter, 'sendMessage').mockResolvedValue(true);
    const handled = await CommandHandler.handle(nonAdminMsg);

    expect(handled).toBe(true);
    expect(sendSpy).toHaveBeenCalledWith(
      nonAdminMsg.groupId,
      expect.stringContaining('لمشرفي المجموعة فقط')
    );
  });

  it('should ignore non-command messages', async () => {
    const normalMsg: IncomingMessage = {
      id: 'msg-1',
      from: '966500000099@s.whatsapp.net',
      groupId: '120363012345678901@g.us',
      text: 'مرحبا كيف حالكم اليوم؟',
      timestamp: new Date(),
      isGroup: true,
      isAdmin: false,
    };

    const handled = await CommandHandler.handle(normalMsg);
    expect(handled).toBe(false);
  });
});
