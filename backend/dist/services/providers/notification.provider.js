"use strict";
/**
 * SplitMate Flexible Notification Service Provider
 * Supports:
 *  - Mock In-App & Terminal Push Provider (Default - fast, zero external cost, saves to db)
 *  - Firebase Cloud Messaging (FCM) Stub (Plug & play for native push tokens)
 *  - Expo Push Stub (Plug & play for mobile notifications)
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationProvider = exports.getNotificationProvider = exports.FcmNotificationProvider = exports.MockNotificationProvider = void 0;
const store_js_1 = require("../../data/store.js");
/**
 * Mock Push Notification Provider
 * Saves notification to persistent store and logs to terminal
 */
class MockNotificationProvider {
    async sendPush(payload) {
        const notif = {
            id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
            type: payload.type,
            recipientId: payload.userId,
            title: payload.title,
            body: payload.body,
            message: payload.body,
            timestamp: new Date().toISOString(),
            read: false,
            actionData: payload.actionData,
        };
        store_js_1.store.createNotification(notif);
        console.log('\n------------------------------------------------------');
        console.log(`🔔 [PUSH NOTIFICATION] Sent to User: ${payload.userId}`);
        console.log(`📌 Title: ${payload.title}`);
        console.log(`💬 Body:  ${payload.body}`);
        console.log('------------------------------------------------------\n');
        return { success: true, id: notif.id };
    }
    async sendBatchPush(payloads) {
        for (const p of payloads) {
            await this.sendPush(p);
        }
        return { success: true, count: payloads.length };
    }
    async sendSms(phone, message) {
        console.log(`📱 [SMS SERVICE - MOCK] Sent to ${phone}: "${message}"`);
        return true;
    }
}
exports.MockNotificationProvider = MockNotificationProvider;
/**
 * FCM Push Notification Provider Stub
 */
class FcmNotificationProvider {
    fallback = new MockNotificationProvider();
    async sendPush(payload) {
        // If FCM credentials are not configured, fallback gracefully to mock store
        if (!process.env.FIREBASE_PROJECT_ID) {
            return this.fallback.sendPush(payload);
        }
        // Future expansion: call admin.messaging().send(...)
        return this.fallback.sendPush(payload);
    }
    async sendBatchPush(payloads) {
        return this.fallback.sendBatchPush(payloads);
    }
    async sendSms(phone, message) {
        return this.fallback.sendSms(phone, message);
    }
}
exports.FcmNotificationProvider = FcmNotificationProvider;
const getNotificationProvider = () => {
    const provider = (process.env.PUSH_PROVIDER || 'mock').toLowerCase();
    switch (provider) {
        case 'fcm':
            return new FcmNotificationProvider();
        case 'mock':
        default:
            return new MockNotificationProvider();
    }
};
exports.getNotificationProvider = getNotificationProvider;
exports.notificationProvider = (0, exports.getNotificationProvider)();
