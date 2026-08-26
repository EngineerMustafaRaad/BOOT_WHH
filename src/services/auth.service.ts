import bcrypt from 'bcryptjs';
import { prisma } from '../database/prisma.js';
import { generateToken, TokenPayload } from '../utils/jwt.js';
import { Role } from '../types/index.js';

export class AuthService {
  public static async login(email: string, password: string): Promise<{ token: string; user: TokenPayload } | null> {
    const user = await prisma.adminUser.findUnique({
      where: { email: email.toLowerCase().trim() },
    });

    if (!user || !user.isActive) {
      return null;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return null;
    }

    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role as Role,
    };

    const token = generateToken(payload);
    return { token, user: payload };
  }

  public static async getProfile(userId: string) {
    const user = await prisma.adminUser.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
    return user;
  }
}
