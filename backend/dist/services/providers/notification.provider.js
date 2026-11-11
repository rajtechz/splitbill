"use strict";
/**
 * SplitMate Flexible Notification Service Provider
 * Supports:
 *  - Mock In-App & Terminal Push Provider (Default - fast, zero external cost, saves to db)
 *  - Firebase Cloud Messaging (FCM) Stub (Plug & play for native push tokens)
 *  - Expo Push Stub (Plug & play for mobile notifications)
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationProvider = exports.getNotificationProvider = exports.FcmNotificationProvider = exports.MockNotificationProvider = void 0;
const store_js_1 = require("../../data/store.js");
const app_1 = require("firebase-admin/app");
const messaging_1 = require("firebase-admin/messaging");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
let firebaseInitialized = false;
function initFirebaseAdmin() {
    if (firebaseInitialized)
        return true;
    try {
        const serviceAccountPath = path_1.default.resolve(process.cwd(), 'service-account.json');
        if (fs_1.default.existsSync(serviceAccountPath)) {
            const sa = JSON.parse(fs_1.default.readFileSync(serviceAccountPath, 'utf8'));
            if ((0, app_1.getApps)().length === 0) {
                (0, app_1.initializeApp)({
                    credential: (0, app_1.cert)(sa),
                    projectId: sa.project_id || process.env.FIREBASE_PROJECT_ID,
                });
            }
            firebaseInitialized = true;
            console.log(`🔥 [FIREBASE ADMIN] Connected successfully to project: ${sa.project_id}`);
            return true;
        }
    }
    catch (err) {
        console.warn('⚠️ [FIREBASE ADMIN INIT WARN]', err.message);
    }
    return false;
}
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
 * FCM Push Notification Provider with Firebase Admin SDK
 */
class FcmNotificationProvider {
    fallback = new MockNotificationProvider();
    constructor() {
        initFirebaseAdmin();
    }
    async sendPush(payload) {
        // 1. Save notification in database for the in-app notification center
        const result = await this.fallback.sendPush(payload);
        // 2. If Firebase Admin is initialized, send native push notification
        if (initFirebaseAdmin()) {
            try {
                const topic = `user_${payload.userId.replace(/[^a-zA-Z0-9_-]/g, '_')}`;
                await (0, messaging_1.getMessaging)().send({
                    topic,
                    notification: {
                        title: payload.title,
                        body: payload.body,
                    },
                    data: payload.actionData || {},
                });
                console.log(`🚀 [FCM PUSH DISPATCHED] Sent to topic: ${topic}`);
            }
            catch (err) {
                console.warn('ℹ️ [FCM PUSH NOTICE]', err.message);
            }
        }
        return result;
    }
    async sendBatchPush(payloads) {
        for (const p of payloads) {
            await this.sendPush(p);
        }
        return { success: true, count: payloads.length };
    }
    async sendSms(phone, message) {
        return this.fallback.sendSms(phone, message);
    }
}
exports.FcmNotificationProvider = FcmNotificationProvider;
const getNotificationProvider = () => {
    const provider = (process.env.PUSH_PROVIDER || 'fcm').toLowerCase();
    switch (provider) {
        case 'mock':
            return new MockNotificationProvider();
        case 'fcm':
        default:
            return new FcmNotificationProvider();
    }
};
exports.getNotificationProvider = getNotificationProvider;
exports.notificationProvider = (0, exports.getNotificationProvider)();
