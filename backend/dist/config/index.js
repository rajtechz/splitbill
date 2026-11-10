"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    jwtSecret: process.env.JWT_SECRET || 'splitmate_jwt_secret_dev_key_2026',
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1h',
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'splitmate_refresh_jwt_dev_key_2026',
    jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    corsOrigin: process.env.CORS_ORIGIN || '*',
    mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/splitmate',
};
