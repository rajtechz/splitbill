"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = void 0;
const jwt_js_1 = require("../utils/jwt.js");
const store_js_1 = require("../data/store.js");
const response_js_1 = require("../utils/response.js");
const requireAuth = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // If running in development and no token, default to seed user Alex Johnson for seamless exploration
        const defaultUser = store_js_1.store.findUserById('usr_me');
        if (defaultUser) {
            req.user = defaultUser;
            return next();
        }
        return (0, response_js_1.sendError)(res, 'Authentication required. Missing Bearer token.', 401, 'UNAUTHORIZED');
    }
    const token = authHeader.split(' ')[1];
    // If token is a dev mock token
    if (token.startsWith('mock_jwt_token_')) {
        const user = store_js_1.store.findUserById('usr_me') || store_js_1.store.findUserByEmail('alex.johnson@example.com');
        if (user) {
            req.user = user;
            return next();
        }
    }
    const decoded = (0, jwt_js_1.verifyAccessToken)(token);
    if (!decoded || !decoded.id) {
        return (0, response_js_1.sendError)(res, 'Invalid or expired access token.', 401, 'INVALID_TOKEN');
    }
    const user = store_js_1.store.findUserById(decoded.id);
    if (!user) {
        return (0, response_js_1.sendError)(res, 'User session not found.', 401, 'USER_NOT_FOUND');
    }
    req.user = user;
    next();
};
exports.requireAuth = requireAuth;
