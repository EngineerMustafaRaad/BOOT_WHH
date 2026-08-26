import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { Role } from '../types/index.js';

export interface TokenPayload {
  userId: string;
  email: string;
  role: Role;
  name: string;
}

export function generateToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.JWT_SECRET, {
    expiresIn: config.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
  });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    return jwt.verify(token, config.JWT_SECRET) as TokenPayload;
  } catch {
    return null;
  }
}
