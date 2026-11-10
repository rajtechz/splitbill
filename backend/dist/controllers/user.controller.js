"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateMe = exports.getMe = void 0;
const store_js_1 = require("../data/store.js");
const response_js_1 = require("../utils/response.js");
const getMe = async (req, res) => {
    const user = req.user;
    if (!user) {
        return (0, response_js_1.sendError)(res, 'User session not found', 404, 'NOT_FOUND');
    }
    const { passwordHash, ...safeUser } = user;
    return (0, response_js_1.sendSuccess)(res, safeUser);
};
exports.getMe = getMe;
const updateMe = async (req, res) => {
    const currentUserId = req.user?.id || 'usr_me';
    const { name, phoneNumber, upiId, avatarUrl, defaultCurrency } = req.body;
    const updated = store_js_1.store.updateUser(currentUserId, {
        ...(name ? { name } : {}),
        ...(phoneNumber !== undefined ? { phoneNumber } : {}),
        ...(upiId !== undefined ? { upiId } : {}),
        ...(avatarUrl !== undefined ? { avatarUrl } : {}),
        ...(defaultCurrency ? { defaultCurrency } : {}),
    });
    if (!updated) {
        return (0, response_js_1.sendError)(res, 'Failed to update user', 404, 'NOT_FOUND');
    }
    const { passwordHash, ...safeUser } = updated;
    return (0, response_js_1.sendSuccess)(res, safeUser, 'Profile updated successfully');
};
exports.updateMe = updateMe;
