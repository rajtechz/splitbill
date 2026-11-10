"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.forgotPassword = exports.refreshToken = exports.verifyOtp = exports.sendOtp = exports.register = exports.login = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const store_js_1 = require("../data/store.js");
const jwt_js_1 = require("../utils/jwt.js");
const response_js_1 = require("../utils/response.js");
const login = async (req, res) => {
    const { email, password } = req.body;
    if (!email) {
        return (0, response_js_1.sendError)(res, 'Email is required', 400, 'VALIDATION_ERROR');
    }
    const user = store_js_1.store.findUserByEmail(email);
    if (!user) {
        return (0, response_js_1.sendError)(res, 'Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }
    if (password && user.passwordHash) {
        const isMatch = bcryptjs_1.default.compareSync(password, user.passwordHash);
        if (!isMatch) {
            return (0, response_js_1.sendError)(res, 'Invalid email or password', 401, 'INVALID_CREDENTIALS');
        }
    }
    const tokens = (0, jwt_js_1.generateTokens)(user);
    const { passwordHash, ...safeUser } = user;
    return (0, response_js_1.sendSuccess)(res, {
        user: safeUser,
        tokens,
    }, 'Login successful');
};
exports.login = login;
const register = async (req, res) => {
    const { name, email, password, phoneNumber, defaultCurrency } = req.body;
    if (!name || !email) {
        return (0, response_js_1.sendError)(res, 'Name and email are required', 400, 'VALIDATION_ERROR');
    }
    const existing = store_js_1.store.findUserByEmail(email);
    if (existing) {
        return (0, response_js_1.sendError)(res, 'User with this email already exists', 409, 'USER_EXISTS');
    }
    const passwordHash = password ? bcryptjs_1.default.hashSync(password, 8) : undefined;
    const newUser = {
        id: `usr_${Date.now()}`,
        name,
        email: email.trim().toLowerCase(),
        passwordHash,
        phoneNumber,
        defaultCurrency: defaultCurrency || 'INR',
        createdAt: new Date().toISOString(),
    };
    store_js_1.store.createUser(newUser);
    const tokens = (0, jwt_js_1.generateTokens)(newUser);
    const { passwordHash: _, ...safeUser } = newUser;
    return (0, response_js_1.sendSuccess)(res, {
        user: safeUser,
        tokens,
    }, 'Registration successful', 201);
};
exports.register = register;
const sendOtp = async (req, res) => {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
        return (0, response_js_1.sendError)(res, 'Phone number is required', 400, 'VALIDATION_ERROR');
    }
    // In production, integrate SMS provider (Twilio / Firebase).
    // For dev, OTP 123456 is always accepted.
    return (0, response_js_1.sendSuccess)(res, {
        sent: true,
        phoneNumber,
    }, `OTP sent to ${phoneNumber}. (Dev code: 123456)`);
};
exports.sendOtp = sendOtp;
const verifyOtp = async (req, res) => {
    const { phoneNumber, otp } = req.body;
    if (!phoneNumber || !otp) {
        return (0, response_js_1.sendError)(res, 'Phone number and OTP code are required', 400, 'VALIDATION_ERROR');
    }
    // Find or create user by phone
    let user = store_js_1.store.findUserByPhone(phoneNumber);
    if (!user) {
        user = {
            id: `usr_${Date.now()}`,
            name: `User ${phoneNumber.slice(-4)}`,
            email: `${phoneNumber.replace(/[^0-9]/g, '')}@splitmate.app`,
            phoneNumber,
            defaultCurrency: 'INR',
            createdAt: new Date().toISOString(),
        };
        store_js_1.store.createUser(user);
    }
    const tokens = (0, jwt_js_1.generateTokens)(user);
    const { passwordHash, ...safeUser } = user;
    return (0, response_js_1.sendSuccess)(res, {
        user: safeUser,
        tokens,
    }, 'OTP verified successfully');
};
exports.verifyOtp = verifyOtp;
const refreshToken = async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
        return (0, response_js_1.sendError)(res, 'Refresh token is required', 400, 'VALIDATION_ERROR');
    }
    const decoded = (0, jwt_js_1.verifyRefreshToken)(refreshToken);
    if (!decoded || !decoded.id) {
        return (0, response_js_1.sendError)(res, 'Invalid or expired refresh token', 401, 'INVALID_REFRESH_TOKEN');
    }
    const user = store_js_1.store.findUserById(decoded.id);
    if (!user) {
        return (0, response_js_1.sendError)(res, 'User not found', 401, 'USER_NOT_FOUND');
    }
    const tokens = (0, jwt_js_1.generateTokens)(user);
    return (0, response_js_1.sendSuccess)(res, tokens, 'Tokens refreshed successfully');
};
exports.refreshToken = refreshToken;
const forgotPassword = async (req, res) => {
    const { email } = req.body;
    return (0, response_js_1.sendSuccess)(res, { email }, `Password reset link sent to ${email}`);
};
exports.forgotPassword = forgotPassword;
const logout = async (_req, res) => {
    return (0, response_js_1.sendSuccess)(res, null, 'Logged out successfully');
};
exports.logout = logout;
