import { Platform, PermissionsAndroid, Alert } from 'react-native';
import { storage } from '../storage';

const NOTIFICATIONS_PREF_KEY = '@splitmate_notifications_enabled';

export class NotificationService {
  /**
   * Request native notification permission on Android and iOS
   */
  async requestPermission(): Promise<boolean> {
    if (Platform.OS === 'android') {
      // Android 13+ (API level 33+) requires runtime POST_NOTIFICATIONS permission
      if (Platform.Version >= 33) {
        try {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
            {
              title: 'Notification Permission',
              message: 'SplitMate needs permission to notify you about newly added expenses, group balances, and settlements.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'Allow',
            }
          );
          const isAllowed = granted === PermissionsAndroid.RESULTS.GRANTED;
          await this.savePreference(isAllowed);
          return isAllowed;
        } catch {
          return false;
        }
      }
      await this.savePreference(true);
      return true;
    }

    // On iOS, system manages push & user notifications with authorization alert
    await this.savePreference(true);
    return true;
  }

  /**
   * Check whether notifications are enabled
   */
  async isEnabled(): Promise<boolean> {
    const saved = await storage.getItem(NOTIFICATIONS_PREF_KEY);
    if (saved === null) return true; // Default enabled
    return saved === 'true';
  }

  /**
   * Save user preference
   */
  async savePreference(enabled: boolean): Promise<void> {
    await storage.setItem(NOTIFICATIONS_PREF_KEY, enabled ? 'true' : 'false');
  }

  /**
   * Simulate dispatching a local push notification
   */
  async triggerLocalAlert(title: string, body: string): Promise<void> {
    const enabled = await this.isEnabled();
    if (!enabled) return;
    // In dev / production UI, alert user
    Alert.alert(title, body);
  }
}

export const notificationService = new NotificationService();

