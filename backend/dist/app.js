"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const index_js_1 = require("./config/index.js");
const index_js_2 = __importDefault(require("./routes/index.js"));
const error_middleware_js_1 = require("./middleware/error.middleware.js");
const response_js_1 = require("./utils/response.js");
const createApp = () => {
    const app = (0, express_1.default)();
    // Middleware
    app.use((0, cors_1.default)({ origin: index_js_1.config.corsOrigin }));
    app.use(express_1.default.json({ limit: '10mb' }));
    app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
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
    const healthCheck = (_req, res) => {
        return (0, response_js_1.sendSuccess)(res, {
            status: 'ok',
            service: 'SplitMate REST API',
            version: '1.0.0',
            timestamp: new Date().toISOString(),
            environment: index_js_1.config.nodeEnv,
            uptimeSeconds: Math.floor(process.uptime()),
        }, 'SplitMate server is healthy');
    };
    app.get('/health', healthCheck);
    app.get('/api/v1/health', healthCheck);
    // Root welcome
    app.get('/', (_req, res) => {
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
    app.use('/api/v1', index_js_2.default);
    // 404 handler
    app.use((req, res) => {
        return res.status(404).json({
            success: false,
            message: `Cannot ${req.method} ${req.originalUrl}`,
            statusCode: 404,
            code: 'ROUTE_NOT_FOUND',
        });
    });
    // Global Error Handler
    app.use(error_middleware_js_1.errorHandler);
    return app;
};
exports.createApp = createApp;
