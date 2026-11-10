import express, { Request, Response } from 'express';
import cors from 'cors';
import { config } from './config/index.js';
import apiRouter from './routes/index.js';
import { errorHandler } from './middleware/error.middleware.js';
import { sendSuccess } from './utils/response.js';

export const createApp = () => {
  const app = express();

  // Middleware
  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request logger
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      console.log(`[API] ${req.method} ${req.originalUrl} - ${res.statusCode} (${duration}ms)`);
    });
    next();
  });

  // Health check endpoints (supports both /health and /api/v1/health)
  const healthCheck = (_req: Request, res: Response) => {
    return sendSuccess(res, {
      status: 'ok',
      service: 'SplitMate REST API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      environment: config.nodeEnv,
      uptimeSeconds: Math.floor(process.uptime()),
    }, 'SplitMate server is healthy');
  };

  app.get('/health', healthCheck);
  app.get('/api/v1/health', healthCheck);

  // Root welcome
  app.get('/', (_req: Request, res: Response) => {
    return res.json({
      name: 'SplitMate API Server',
      version: '1.0.0',
      description: 'Production-grade expense sharing REST API',
      endpoints: {
        health: '/health',
        apiV1: '/api/v1',
        docs: 'See BACKEND_API_SPEC.md',
      },
    });
  });

  // Mount API Router under /api/v1
  app.use('/api/v1', apiRouter);

  // 404 handler
  app.use((req: Request, res: Response) => {
    return res.status(404).json({
      success: false,
      message: `Cannot ${req.method} ${req.originalUrl}`,
      statusCode: 404,
      code: 'ROUTE_NOT_FOUND',
    });
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
};

