"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeFriend = exports.addFriend = exports.getFriends = void 0;
const store_js_1 = require("../data/store.js");
const response_js_1 = require("../utils/response.js");
const balance_service_js_1 = require("../services/balance.service.js");
const getFriends = async (req, res) => {
    (0, balance_service_js_1.recalculateBalances)(req.user?.id || 'usr_me');
    const friends = store_js_1.store.getFriends();
    return (0, response_js_1.sendSuccess)(res, friends);
};
exports.getFriends = getFriends;
const addFriend = async (req, res) => {
    const { name, email, phoneNumber, upiId, avatarUrl } = req.body;
    if (!name || (!email && !phoneNumber)) {
        return (0, response_js_1.sendError)(res, 'Name and either email or phone are required', 400, 'VALIDATION_ERROR');
    }
    const newFriend = {
        id: `f_${Date.now()}`,
        userId: `usr_${Date.now()}`,
        name: name.trim(),
        email: (email || `${Date.now()}@splitmate.app`).trim().toLowerCase(),
        phoneNumber,
        upiId,
        avatarUrl,
        netBalance: 0,
        createdAt: new Date().toISOString(),
    };
    store_js_1.store.createFriend(newFriend);
    return (0, response_js_1.sendSuccess)(res, newFriend, 'Friend added successfully', 201);
};
exports.addFriend = addFriend;
const removeFriend = async (req, res) => {
    const { id } = req.params;
    const success = store_js_1.store.deleteFriend(id);
    if (!success) {
        return (0, response_js_1.sendError)(res, `Friend ${id} not found`, 404, 'FRIEND_NOT_FOUND');
    }
    return (0, response_js_1.sendSuccess)(res, { deleted: true }, 'Friend removed successfully');
};
exports.removeFriend = removeFriend;
