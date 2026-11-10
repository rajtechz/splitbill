"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.markAsRead = exports.getNotifications = void 0;
const store_js_1 = require("../data/store.js");
const response_js_1 = require("../utils/response.js");
const getNotifications = async (_req, res) => {
    const notifications = store_js_1.store.getNotifications();
    return (0, response_js_1.sendSuccess)(res, notifications);
};
exports.getNotifications = getNotifications;
const markAsRead = async (req, res) => {
    const { id } = req.params;
    const success = store_js_1.store.markNotificationAsRead(id);
    if (!success) {
        return (0, response_js_1.sendError)(res, `Notification ${id} not found`, 404, 'NOT_FOUND');
    }
    return (0, response_js_1.sendSuccess)(res, { read: true }, 'Notification marked as read');
};
exports.markAsRead = markAsRead;
