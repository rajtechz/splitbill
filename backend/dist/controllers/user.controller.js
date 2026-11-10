"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getUserById = exports.updateLocationCurrency = exports.syncContacts = exports.uploadAvatar = exports.updateMe = exports.getMe = void 0;
const store_js_1 = require("../data/store.js");
const response_js_1 = require("../utils/response.js");
const index_js_1 = require("../services/providers/index.js");
const getMe = async (req, res) => {
    const currentUserId = req.user?.id || 'usr_me';
    const user = store_js_1.store.findUserById(currentUserId) || req.user;
    if (!user) {
        return (0, response_js_1.sendError)(res, 'User session not found', 404, 'NOT_FOUND');
    }
    const { passwordHash: _, mPin: __, ...safeUser } = user;
    return (0, response_js_1.sendSuccess)(res, safeUser);
};
exports.getMe = getMe;
const updateMe = async (req, res) => {
    const currentUserId = req.user?.id || 'usr_me';
    const { name, phoneNumber, upiId, avatarUrl, defaultCurrency, country } = req.body;
    const updated = store_js_1.store.updateUser(currentUserId, {
        ...(name ? { name } : {}),
        ...(phoneNumber !== undefined ? { phoneNumber } : {}),
        ...(upiId !== undefined ? { upiId } : {}),
        ...(avatarUrl !== undefined ? { avatarUrl } : {}),
        ...(defaultCurrency ? { defaultCurrency } : {}),
        ...(country ? { country } : {}),
    });
    if (!updated) {
        return (0, response_js_1.sendError)(res, 'Failed to update user', 404, 'NOT_FOUND');
    }
    const { passwordHash: _, mPin: __, ...safeUser } = updated;
    return (0, response_js_1.sendSuccess)(res, safeUser, 'Profile updated successfully');
};
exports.updateMe = updateMe;
const uploadAvatar = async (req, res) => {
    const currentUserId = req.user?.id || 'usr_me';
    const { base64, mimeType } = req.body;
    if (!base64) {
        return (0, response_js_1.sendError)(res, 'Base64 image data is required', 400, 'VALIDATION_ERROR');
    }
    const avatarUrl = await index_js_1.storageProvider.uploadBase64(base64, `avatar_${currentUserId}`, { mimeType });
    const updated = store_js_1.store.updateUser(currentUserId, { avatarUrl });
    return (0, response_js_1.sendSuccess)(res, { avatarUrl, user: updated }, 'Avatar uploaded successfully');
};
exports.uploadAvatar = uploadAvatar;
const syncContacts = async (req, res) => {
    const { contacts } = req.body;
    if (!Array.isArray(contacts)) {
        return (0, response_js_1.sendError)(res, 'Contacts array is required', 400, 'VALIDATION_ERROR');
    }
    const matches = store_js_1.store.matchContacts(contacts);
    const registeredCount = matches.filter(m => m.isRegistered).length;
    return (0, response_js_1.sendSuccess)(res, {
        contacts: matches,
        total: matches.length,
        registeredCount,
    }, `Synced ${matches.length} contacts (${registeredCount} registered on SplitMate)`);
};
exports.syncContacts = syncContacts;
const updateLocationCurrency = async (req, res) => {
    const currentUserId = req.user?.id || 'usr_me';
    const { countryCode } = req.body;
    if (!countryCode) {
        return (0, response_js_1.sendError)(res, 'Country code is required (e.g. IN, US, GB)', 400, 'VALIDATION_ERROR');
    }
    const currencyDetail = index_js_1.currencyService.getCurrencyForCountry(countryCode);
    const updated = store_js_1.store.updateUser(currentUserId, {
        country: countryCode.toUpperCase(),
        defaultCurrency: currencyDetail.code,
    });
    return (0, response_js_1.sendSuccess)(res, {
        country: countryCode.toUpperCase(),
        currency: currencyDetail,
        user: updated,
    }, `Default currency set to ${currencyDetail.code} (${currencyDetail.symbol}) based on location`);
};
exports.updateLocationCurrency = updateLocationCurrency;
const getUserById = async (req, res) => {
    const { id } = req.params;
    const user = store_js_1.store.findUserById(id);
    if (!user) {
        return (0, response_js_1.sendError)(res, 'User not found', 404, 'NOT_FOUND');
    }
    const { passwordHash: _, mPin: __, ...safeUser } = user;
    return (0, response_js_1.sendSuccess)(res, safeUser);
};
exports.getUserById = getUserById;
