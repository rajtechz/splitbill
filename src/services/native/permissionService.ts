import { Platform, PermissionsAndroid, NativeModules } from 'react-native';
import Contacts from 'react-native-contacts';
import { storage } from '../storage';

export type PermissionType = 'location' | 'camera' | 'contacts' | 'notifications';

export interface PermissionItemInfo {
  type: PermissionType;
  title: string;
  subtitle: string;
  icon: string;
  badge: string;
  reason: string;
}

export const PERMISSION_CONFIG: Record<PermissionType, PermissionItemInfo> = {
  location: {
    type: 'location',
    title: 'Location Access',
    subtitle: 'Auto-detect your local currency and country',
    icon: 'location',
    badge: 'Currency',
    reason: 'SplitMate uses your location to automatically configure your primary local currency (₹, $, €, £) and regional expense formatting.',
  },
  camera: {
    type: 'camera',
    title: 'Camera Access',
    subtitle: 'Scan receipts, bills & capture profile photos',
    icon: 'camera',
    badge: 'Receipts',
    reason: 'Allows you to photograph paper receipts, attach bills to group expenses, and customize your profile photo.',
  },
  contacts: {
    type: 'contacts',
    title: 'Contacts Access',
    subtitle: 'Find friends & split expenses with phonebook',
    icon: 'phone',
    badge: 'Friends',
    reason: 'Quickly select friends from your device contacts without typing long phone numbers, email addresses, or account IDs manually.',
  },
  notifications: {
    type: 'notifications',
    title: 'Push Notifications',
    subtitle: 'Get alerts for new expenses & settlements',
    icon: 'bell',
    badge: 'Alerts',
    reason: 'Instant updates whenever friends add expenses, record settlements, or request debt payments in your shared groups.',
  },
};

const { PermissionManager } = NativeModules;

/**
 * Safety utility to prevent unresolved native promises from hanging the UI
 */
const withTimeout = <T>(promise: Promise<T>, timeoutMs = 2500, fallback: T): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>(resolve => setTimeout(() => resolve(fallback), timeoutMs)),
  ]);
};

class PermissionService {
  /**
   * Request an individual permission by type
   */
  async requestPermission(type: PermissionType): Promise<boolean> {
    try {
      switch (type) {
        case 'location':
          return await this.requestLocation();
        case 'camera':
          return await this.requestCamera();
        case 'contacts':
          return await this.requestContacts();
        case 'notifications':
          return await this.requestNotifications();
        default:
          return false;
      }
    } catch (err) {
      console.warn(`[PermissionService] Error requesting ${type}:`, err);
      return false;
    }
  }

  /**
   * Check status of a single permission
   */
  async checkPermission(type: PermissionType): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        switch (type) {
          case 'location':
            return await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
          case 'camera':
            return await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.CAMERA);
          case 'contacts':
            return await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_CONTACTS);
          case 'notifications':
            if (Platform.Version >= 33) {
              return await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
            }
            return true;
        }
      } else if (Platform.OS === 'ios') {
        if (type === 'contacts') {
          return await withTimeout(
            (async () => {
              if (NativeModules.Contacts && typeof Contacts?.checkPermission === 'function') {
                const status = await Contacts.checkPermission();
                return status === 'authorized' || status === 'limited';
              }
              if (PermissionManager?.checkContactsPermission) {
                return await PermissionManager.checkContactsPermission();
              }
              return true;
            })(),
            1500,
            true
          );
        }
        if (PermissionManager) {
          switch (type) {
            case 'location':
              return await withTimeout(PermissionManager.checkLocationPermission(), 1500, true);
            case 'camera':
              return await withTimeout(PermissionManager.checkCameraPermission(), 1500, true);
            case 'notifications':
              return await withTimeout(PermissionManager.checkNotificationPermission(), 1500, true);
          }
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  /**
   * Request Location permission
   */
  private async requestLocation(): Promise<boolean> {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        {
          title: 'Location Permission',
          message: PERMISSION_CONFIG.location.reason,
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Deny',
          buttonPositive: 'Allow',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } else if (Platform.OS === 'ios') {
      if (PermissionManager?.requestLocationPermission) {
        return await withTimeout(PermissionManager.requestLocationPermission(), 2500, true);
      }
      return true;
    }
    return true;
  }

  /**
   * Request Camera permission
   */
  private async requestCamera(): Promise<boolean> {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.CAMERA,
        {
          title: 'Camera Permission',
          message: PERMISSION_CONFIG.camera.reason,
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Deny',
          buttonPositive: 'Allow',
        }
      );
      return granted === PermissionsAndroid.RESULTS.GRANTED;
    } else if (Platform.OS === 'ios') {
      if (PermissionManager?.requestCameraPermission) {
        return await withTimeout(PermissionManager.requestCameraPermission(), 2500, true);
      }
      return true;
    }
    return true;
  }

  /**
   * Request Contacts permission with reliable timeout and graceful fallbacks
   */
  private async requestContacts(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
          {
            title: 'Contacts Permission',
            message: PERMISSION_CONFIG.contacts.reason,
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Deny',
            buttonPositive: 'Allow',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch {
        return false;
      }
    } else if (Platform.OS === 'ios') {
      return await withTimeout(
        (async () => {
          try {
            if (NativeModules.Contacts && typeof Contacts?.checkPermission === 'function') {
              const status = await Contacts.checkPermission();
              if (status === 'undefined') {
                if (typeof Contacts?.requestPermission === 'function') {
                  const req = await Contacts.requestPermission();
                  return req === 'authorized' || req === 'limited';
                }
              }
              return status === 'authorized' || status === 'limited';
            }
          } catch (e) {
            console.warn('[PermissionService] Contacts checkPermission error:', e);
          }

          if (PermissionManager?.requestContactsPermission) {
            try {
              return await PermissionManager.requestContactsPermission();
            } catch {}
          }
          return true;
        })(),
        2500,
        true
      );
    }
    return true;
  }

  /**
   * Request Notifications permission
   */
  private async requestNotifications(): Promise<boolean> {
    if (Platform.OS === 'android') {
      if (Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
          {
            title: 'Notification Permission',
            message: PERMISSION_CONFIG.notifications.reason,
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Deny',
            buttonPositive: 'Allow',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
      return true;
    } else if (Platform.OS === 'ios') {
      if (PermissionManager?.requestNotificationPermission) {
        return await withTimeout(PermissionManager.requestNotificationPermission(), 2500, true);
      }
      return true;
    }
    return true;
  }

  /**
   * Request all 4 permissions in sequence
   */
  async requestAllPermissions(): Promise<Record<PermissionType, boolean>> {
    const results: Record<PermissionType, boolean> = {
      location: false,
      camera: false,
      contacts: false,
      notifications: false,
    };

    results.location = await this.requestLocation();
    results.camera = await this.requestCamera();
    results.contacts = await this.requestContacts();
    results.notifications = await this.requestNotifications();

    return results;
  }

  /**
   * Get statuses of all 4 permissions
   */
  async getAllPermissionsStatus(): Promise<Record<PermissionType, boolean>> {
    const [location, camera, contacts, notifications] = await Promise.all([
      this.checkPermission('location'),
      this.checkPermission('camera'),
      this.checkPermission('contacts'),
      this.checkPermission('notifications'),
    ]);

    return { location, camera, contacts, notifications };
  }

  /**
   * Has user completed the initial first-install permission prompt?
   */
  async hasCompletedPermissionsOnboarding(): Promise<boolean> {
    try {
      const val = await storage.getItem<boolean>(storage.STORAGE_KEYS.PERMISSIONS_ONBOARDING_COMPLETED);
      return val === true;
    } catch {
      return false;
    }
  }

  /**
   * Mark first-install permissions onboarding as completed
   */
  async setPermissionsOnboardingCompleted(completed = true): Promise<void> {
    try {
      await storage.setItem<boolean>(
        storage.STORAGE_KEYS.PERMISSIONS_ONBOARDING_COMPLETED,
        completed
      );
    } catch (e) {
      console.warn('Failed to save permissions onboarding status', e);
    }
  }

  /**
   * Reset first-install permissions onboarding (for testing)
   */
  async resetPermissionsOnboarding(): Promise<void> {
    try {
      await storage.removeItem(storage.STORAGE_KEYS.PERMISSIONS_ONBOARDING_COMPLETED);
    } catch {}
  }
}

export const permissionService = new PermissionService();
