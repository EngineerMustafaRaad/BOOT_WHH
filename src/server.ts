import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { config } from './config/index.js';
import { connectDatabase } from './database/prisma.js';
import { rulesCache } from './moderation/cache.js';
import { whatsappAdapter } from './whatsapp/factory.js';
import { MessageProcessor } from './moderation/message-processor.js';
import apiRoutes from './routes/index.js';
import { apiRateLimiter } from './middleware/rate-limit.middleware.js';
import { errorHandler } from './middleware/error.middleware.js';
import { logger } from './utils/logger.js';

const app = express();

app.get('/', (req, res) => {
  res.send('البوت شغال 100% 🚀');
});

// Security Middlewares
app.use(helmet());
app.use(
  cors({
    origin: [config.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check Endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date(),
    uptime: process.uptime(),
    adapter: whatsappAdapter.getStatus(),
    cacheReady: rulesCache.isReady(),
  });
});

// API Routes with Rate Limiter
app.use('/api', apiRateLimiter, apiRoutes);

// Global Error Handler
app.use(errorHandler);

async function startServer(): Promise<void> {
  try {
    logger.info('🚀 Starting WhatsApp Group Moderation Platform...');

    // 1. Connect to Database (with resilient fallback)
    await connectDatabase();

    // 2. Initialize in-memory Rules Cache for high-performance moderation (<1ms)
    await rulesCache.initialize();

    // 3. Connect WhatsApp Adapter and bind Message Processor
    whatsappAdapter.onMessage(async (message) => {
      try {
        await MessageProcessor.process(message);
      } catch (err) {
        logger.error('Error in message processing pipeline:', { err });
      }
    });

    await whatsappAdapter.connect();

    // 4. Start HTTP Server
    const server = app.listen(config.PORT, () => {
      logger.info(`✨ Server running and listening on port ${config.PORT} [${config.NODE_ENV}]`);
      logger.info(`🌐 API URL: ${config.APP_URL}/api`);
      logger.info(`🤖 Active WhatsApp Provider: ${whatsappAdapter.name}`);
    });

    // Graceful Shutdown
    const shutdown = async (signal: string) => {
      logger.info(`Received ${signal}. Shutting down gracefully...`);
      server.close(async () => {
        await whatsappAdapter.disconnect();
        logger.info('Server closed. Goodbye!');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  } catch (error) {
    logger.error('Fatal startup error:', { error });
    process.exit(1);
  }
}

startServer();
