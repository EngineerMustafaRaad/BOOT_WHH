import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.string().default('4000').transform((v) => parseInt(v, 10)),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  APP_URL: z.string().default('http://localhost:4000'),
  FRONTEND_URL: z.string().default('http://localhost:5173'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  JWT_SECRET: z.string().min(16, 'JWT_SECRET must be at least 16 characters').default('super-secret-jwt-key-min-32-chars-long-moderator'),
  JWT_EXPIRES_IN: z.string().default('7d'),

  ADMIN_DEFAULT_EMAIL: z.string().email().default('admin@moderator.local'),
  ADMIN_DEFAULT_PASSWORD: z.string().min(8).default('AdminSecurePassword123!'),

  WHATSAPP_PROVIDER: z.enum(['simulator', 'cloud_api', 'baileys']).default('simulator'),

  WHATSAPP_ACCESS_TOKEN: z.string().optional().default(''),
  WHATSAPP_PHONE_NUMBER_ID: z.string().optional().default(''),
  WHATSAPP_BUSINESS_ACCOUNT_ID: z.string().optional().default(''),
  WHATSAPP_WEBHOOK_VERIFY_TOKEN: z.string().optional().default('custom_webhook_verify_token'),

  ADMIN_WHATSAPP_NUMBER: z.string().optional().default(''),

  AI_MODERATION_ENABLED: z.string().default('false').transform((v) => v === 'true'),
  AI_PROVIDER: z.enum(['openai', 'gemini']).default('openai'),
  AI_API_KEY: z.string().optional().default(''),
  AI_MODEL: z.string().default('gpt-4o-mini'),

  NOTIFICATION_CHANNELS: z.string().default('whatsapp,telegram').transform((v) => v.split(',').map((s) => s.trim())),

  TELEGRAM_BOT_TOKEN: z.string().optional().default(''),
  TELEGRAM_CHAT_ID: z.string().optional().default(''),

  SMTP_HOST: z.string().optional().default(''),
  SMTP_PORT: z.string().optional().default('587').transform((v) => parseInt(v, 10)),
  SMTP_USER: z.string().optional().default(''),
  SMTP_PASS: z.string().optional().default(''),
  SMTP_FROM: z.string().optional().default('moderator@system.local'),
  ALERT_EMAIL_RECIPIENT: z.string().optional().default(''),

  WEBHOOK_ALERT_URL: z.string().optional().default(''),

  RATE_LIMIT_WINDOW_MS: z.string().default('900000').transform((v) => parseInt(v, 10)),
  RATE_LIMIT_MAX_REQUESTS: z.string().default('100').transform((v) => parseInt(v, 10)),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables configuration:', parsedEnv.error.format());
  process.exit(1);
}

export const config = parsedEnv.data;
