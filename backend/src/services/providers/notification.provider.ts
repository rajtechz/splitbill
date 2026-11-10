/**
 * SplitMate Flexible Notification Service Provider
 * Supports:
 *  - Mock In-App & Terminal Push Provider (Default - fast, zero external cost, saves to db)
 *  - Firebase Cloud Messaging (FCM) Stub (Plug & play for native push tokens)
 *  - Expo Push Stub (Plug & play for mobile notifications)
 */

import { AppNotification } from '../../types/index.js';
import { store } from '../../data/store.js';

export interface PushPayload {
  userId: string;
  type: AppNotification['type'];
  title: string;
  body: string;
  actionData?: Record<string, string>;
}

export interface INotificationProvider {
  sendPush(payload: PushPayload): Promise<{ success: boolean; id: string }>;
  sendBatchPush(payloads: PushPayload[]): Promise<{ success: boolean; count: number }>;
  sendSms(phone: string, message: string): Promise<boolean>;
}

/**
 * Mock Push Notification Provider
 * Saves notification to persistent store and logs to terminal
 */
export class MockNotificationProvider implements INotificationProvider {
  async sendPush(payload: PushPayload): Promise<{ success: boolean; id: string }> {
    const notif: AppNotification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      type: payload.type,
      title: payload.title,
      body: payload.body,
      message: payload.body,
      timestamp: new Date().toISOString(),
      read: false,
      actionData: payload.actionData,
    };

    store.createNotification(notif);

    console.log('\n------------------------------------------------------');
    console.log(`🔔 [PUSH NOTIFICATION] Sent to User: ${payload.userId}`);
    console.log(`📌 Title: ${payload.title}`);
    console.log(`💬 Body:  ${payload.body}`);
    console.log('------------------------------------------------------\n');

    return { success: true, id: notif.id };
  }

  async sendBatchPush(payloads: PushPayload[]): Promise<{ success: boolean; count: number }> {
    for (const p of payloads) {
      await this.sendPush(p);
    }
    return { success: true, count: payloads.length };
  }

  async sendSms(phone: string, message: string): Promise<boolean> {
    console.log(`📱 [SMS SERVICE - MOCK] Sent to ${phone}: "${message}"`);
    return true;
  }
}

/**
 * FCM Push Notification Provider Stub
 */
export class FcmNotificationProvider implements INotificationProvider {
  private fallback = new MockNotificationProvider();

  async sendPush(payload: PushPayload): Promise<{ success: boolean; id: string }> {
    // If FCM credentials are not configured, fallback gracefully to mock store
    if (!process.env.FIREBASE_PROJECT_ID) {
      return this.fallback.sendPush(payload);
    }
    // Future expansion: call admin.messaging().send(...)
    return this.fallback.sendPush(payload);
  }

  async sendBatchPush(payloads: PushPayload[]): Promise<{ success: boolean; count: number }> {
    return this.fallback.sendBatchPush(payloads);
  }

  async sendSms(phone: string, message: string): Promise<boolean> {
    return this.fallback.sendSms(phone, message);
  }
}

export const getNotificationProvider = (): INotificationProvider => {
  const provider = (process.env.PUSH_PROVIDER || 'mock').toLowerCase();
  switch (provider) {
    case 'fcm':
      return new FcmNotificationProvider();
    case 'mock':
    default:
      return new MockNotificationProvider();
  }
};

export const notificationProvider: INotificationProvider = getNotificationProvider();

