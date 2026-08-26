import { describe, it, expect } from 'vitest';
import { generateToken, verifyToken } from '../src/utils/jwt.js';

describe('Auth & JWT Suite', () => {
  it('should sign and verify valid JWT token', () => {
    const payload = {
      userId: 'admin-uuid-1',
      email: 'admin@moderator.local',
      name: 'مشرف النظام',
      role: 'SUPER_ADMIN' as const,
    };

    const token = generateToken(payload);
    expect(typeof token).toBe('string');
    expect(token.split('.').length).toBe(3);

    const verified = verifyToken(token);
    expect(verified).not.toBeNull();
    expect(verified?.email).toBe(payload.email);
    expect(verified?.userId).toBe(payload.userId);
  });

  it('should return null for invalid or corrupted tokens', () => {
    const verified = verifyToken('invalid.token.payload');
    expect(verified).toBeNull();
  });
});
