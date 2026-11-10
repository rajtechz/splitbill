"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyRefreshToken = exports.verifyAccessToken = exports.generateTokens = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const index_js_1 = require("../config/index.js");
const generateTokens = (user) => {
    const payload = {
        id: user.id,
        email: user.email,
        name: user.name,
    };
    const accessOptions = {
        expiresIn: index_js_1.config.jwtExpiresIn,
    };
    const refreshOptions = {
        expiresIn: index_js_1.config.jwtRefreshExpiresIn,
    };
    const accessToken = jsonwebtoken_1.default.sign(payload, index_js_1.config.jwtSecret, accessOptions);
    const refreshToken = jsonwebtoken_1.default.sign(payload, index_js_1.config.jwtRefreshSecret, refreshOptions);
    return {
        accessToken,
        refreshToken,
        expiresIn: 3600,
    };
};
exports.generateTokens = generateTokens;
const verifyAccessToken = (token) => {
    try {
        return jsonwebtoken_1.default.verify(token, index_js_1.config.jwtSecret);
    }
    catch {
        return null;
    }
};
exports.verifyAccessToken = verifyAccessToken;
const verifyRefreshToken = (token) => {
    try {
        return jsonwebtoken_1.default.verify(token, index_js_1.config.jwtRefreshSecret);
    }
    catch {
        return null;
    }
};
exports.verifyRefreshToken = verifyRefreshToken;
