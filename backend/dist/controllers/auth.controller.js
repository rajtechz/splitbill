"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSecuritySettings = exports.toggleBiometrics = exports.verifyMpin = exports.setupMpin = exports.logout = exports.forgotPassword = exports.refreshToken = exports.verifyOtp = exports.sendOtp = exports.register = exports.login = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const store_js_1 = require("../data/store.js");
const jwt_js_1 = require("../utils/jwt.js");
const response_js_1 = require("../utils/response.js");
const index_js_1 = require("../services/providers/index.js");
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
    const { passwordHash: _, mPin: __, ...safeUser } = user;
    return (0, response_js_1.sendSuccess)(res, {
        user: safeUser,
        tokens,
    }, 'Login successful');
};
exports.login = login;
const register = async (req, res) => {
    const { name, email, password, phoneNumber, defaultCurrency, country } = req.body;
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
        country: country || 'IN',
        isPinEnabled: true,
        isBiometricsEnabled: true,
        mPin: '1234',
        createdAt: new Date().toISOString(),
    };
    store_js_1.store.createUser(newUser);
    const tokens = (0, jwt_js_1.generateTokens)(newUser);
    const { passwordHash: _, mPin: __, ...safeUser } = newUser;
    return (0, response_js_1.sendSuccess)(res, {
        user: safeUser,
        tokens,
    }, 'Registration successful', 201);
};
exports.register = register;
const sendOtp = async (req, res) => {
    const { phoneNumber, email } = req.body;
    if (!phoneNumber && !email) {
        return (0, response_js_1.sendError)(res, 'Phone number or email is required', 400, 'VALIDATION_ERROR');
    }
    // Uses flexible OtpProvider (Mock/Twilio/Firebase)
    const result = await index_js_1.otpProvider.sendOtp({ phone: phoneNumber, email });
    return (0, response_js_1.sendSuccess)(res, {
        sent: result.success,
        phoneNumber,
        email,
        trackingId: result.trackingId,
        devOtp: result.devOtp,
    }, result.message);
};
exports.sendOtp = sendOtp;
const verifyOtp = async (req, res) => {
    const { phoneNumber, email, otp } = req.body;
    if ((!phoneNumber && !email) || !otp) {
        return (0, response_js_1.sendError)(res, 'Phone number/email and OTP code are required', 400, 'VALIDATION_ERROR');
    }
    const isValid = await index_js_1.otpProvider.verifyOtp({ phone: phoneNumber, email }, otp);
    if (!isValid) {
        return (0, response_js_1.sendError)(res, 'Invalid or expired OTP code (Test code: 123456)', 400, 'INVALID_OTP');
    }
    // Find or create user dynamically
    let user = phoneNumber ? store_js_1.store.findUserByPhone(phoneNumber) : (email ? store_js_1.store.findUserByEmail(email) : undefined);
    if (!user) {
        const identifier = phoneNumber || email || 'user';
        user = {
            id: `usr_${Date.now()}`,
            name: phoneNumber ? `User ${phoneNumber.slice(-4)}` : identifier.split('@')[0],
            email: email || `${(phoneNumber || '').replace(/[^0-9]/g, '')}@splitmate.app`,
            phoneNumber,
            defaultCurrency: 'INR',
            country: 'IN',
            isPinEnabled: true,
            isBiometricsEnabled: true,
            mPin: '1234',
            createdAt: new Date().toISOString(),
        };
        store_js_1.store.createUser(user);
    }
    const tokens = (0, jwt_js_1.generateTokens)(user);
    const { passwordHash: _, mPin: __, ...safeUser } = user;
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
// --- 4-Digit mPIN & Biometrics Management ---
const setupMpin = async (req, res) => {
    const userId = req.user?.id || req.body.userId || 'usr_me';
    const { pin } = req.body;
    if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
        return (0, response_js_1.sendError)(res, 'PIN must be exactly 4 digits', 400, 'INVALID_PIN_FORMAT');
    }
    const ok = store_js_1.store.setMpin(userId, pin);
    if (!ok) {
        return (0, response_js_1.sendError)(res, 'User not found', 404, 'USER_NOT_FOUND');
    }
    return (0, response_js_1.sendSuccess)(res, { isPinEnabled: true, hasPinSet: true }, '4-digit mPIN set successfully');
};
exports.setupMpin = setupMpin;
const verifyMpin = async (req, res) => {
    const userId = req.user?.id || req.body.userId || 'usr_me';
    const { pin } = req.body;
    if (!pin) {
        return (0, response_js_1.sendError)(res, 'mPIN is required', 400, 'VALIDATION_ERROR');
    }
    const isMatch = store_js_1.store.verifyMpin(userId, pin);
    if (isMatch) {
        return (0, response_js_1.sendSuccess)(res, { verified: true }, 'mPIN verified successfully');
    }
    else {
        return (0, response_js_1.sendError)(res, 'Incorrect mPIN code', 401, 'INVALID_PIN');
    }
};
exports.verifyMpin = verifyMpin;
const toggleBiometrics = async (req, res) => {
    const userId = req.user?.id || req.body.userId || 'usr_me';
    const { enabled } = req.body;
    const current = store_js_1.store.toggleBiometrics(userId, enabled);
    return (0, response_js_1.sendSuccess)(res, { isBiometricsEnabled: current }, `Biometric unlock ${current ? 'enabled' : 'disabled'}`);
};
exports.toggleBiometrics = toggleBiometrics;
const getSecuritySettings = async (req, res) => {
    const userId = req.user?.id || 'usr_me';
    const user = store_js_1.store.findUserById(userId);
    return (0, response_js_1.sendSuccess)(res, {
        isPinEnabled: user?.isPinEnabled ?? true,
        hasPinSet: Boolean(user?.mPin),
        isBiometricsEnabled: user?.isBiometricsEnabled ?? true,
    }, 'Security settings fetched');
};
exports.getSecuritySettings = getSecuritySettings;
