import winston from 'winston';

const { combine, timestamp, printf, colorize, json } = winston.format;

// Mask sensitive keys from log outputs
function maskSensitiveData(obj: unknown): unknown {
  if (!obj || typeof obj !== 'object') return obj;

  const SENSITIVE_KEYS = [
    'password',
    'passwordhash',
    'token',
    'jwt',
    'secret',
    'accesstoken',
    'authorization',
    'apikey',
    'ai_api_key',
  ];

  if (Array.isArray(obj)) {
    return obj.map(maskSensitiveData);
  }

  const masked: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.some((k) => key.toLowerCase().includes(k))) {
      masked[key] = '***MASKED***';
    } else if (typeof value === 'object' && value !== null) {
      masked[key] = maskSensitiveData(value);
    } else {
      masked[key] = value;
    }
  }
  return masked;
}

const consoleFormat = printf(({ level, message, timestamp, ...meta }) => {
  const cleanMeta = Object.keys(meta).length ? JSON.stringify(maskSensitiveData(meta)) : '';
  return `[${timestamp}] ${level}: ${message} ${cleanMeta}`;
});

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format((info) => {
      info = maskSensitiveData(info) as winston.Logform.TransformableInfo;
      return info;
    })()
  ),
  transports: [
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        consoleFormat
      ),
    }),
  ],
});
