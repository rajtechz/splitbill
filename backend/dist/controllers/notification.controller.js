"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendTestNotification = exports.markAllAsRead = exports.markAsRead = exports.getNotifications = void 0;
const store_js_1 = require("../data/store.js");
const response_js_1 = require("../utils/response.js");
const index_js_1 = require("../services/providers/index.js");
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
const markAllAsRead = async (_req, res) => {
    store_js_1.store.markAllNotificationsAsRead();
    return (0, response_js_1.sendSuccess)(res, { readAll: true }, 'All notifications marked as read');
};
exports.markAllAsRead = markAllAsRead;
const sendTestNotification = async (req, res) => {
    const currentUserId = req.user?.id || 'usr_me';
    const { title, body } = req.body;
    const result = await index_js_1.notificationProvider.sendPush({
        userId: currentUserId,
        type: 'payment_reminder',
        title: title || 'SplitMate Balance Reminder',
        body: body || 'You have pending balances in your group expenses.',
    });
    return (0, response_js_1.sendSuccess)(res, result, 'Test notification dispatched');
};
exports.sendTestNotification = sendTestNotification;
