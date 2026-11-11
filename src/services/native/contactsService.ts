import Contacts, { Contact } from 'react-native-contacts';
import { Platform, PermissionsAndroid, NativeModules } from 'react-native';
import { storage } from '../storage';

const CUSTOM_CONTACTS_KEY = '@splitmate_custom_user_contacts';

const withTimeout = <T>(promise: Promise<T>, timeoutMs = 2500, fallback: T): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>(resolve => setTimeout(() => resolve(fallback), timeoutMs)),
  ]);
};

export interface PhoneContact {
  id: string;
  name: string;
  phoneNumber?: string;
  email?: string;
  avatarUrl?: string;
  isRecentlyAdded?: boolean;
}

export class ContactsService {
  /**
   * Request native Contacts permission on Android & iOS
   */
  async requestPermission(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_CONTACTS,
          {
            title: 'Contacts Permission',
            message: 'SplitMate needs access to your contacts to quickly add friends and split expenses with them.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch {
        return false;
      }
    }

    if (Platform.OS === 'ios') {
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
            console.warn('[ContactsService] iOS permission check error:', e);
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
   * Fetch real contacts directly from the device address book
   */
  async getContacts(): Promise<PhoneContact[]> {
    const hasPermission = await this.requestPermission();
    if (!hasPermission) {
      return [];
    }

    let deviceContacts: PhoneContact[] = [];
    try {
      if (NativeModules.Contacts && typeof Contacts?.getAll === 'function') {
        const raw = await withTimeout(Contacts.getAll(), 3000, []);
        if (raw && Array.isArray(raw)) {
          deviceContacts = raw
            .map((c: Contact) => {
              const nameParts = [c.givenName, c.middleName, c.familyName].filter(Boolean).join(' ').trim();
              const displayName = nameParts || c.displayName || c.company || 'Unnamed Contact';
              const phone = c.phoneNumbers?.[0]?.number || '';
              const email = c.emailAddresses?.[0]?.email || '';

              return {
                id: c.recordID,
                name: displayName,
                phoneNumber: phone,
                email: email,
                avatarUrl: c.hasThumbnail ? c.thumbnailPath : undefined,
              };
            })
            .filter(c => c.name.trim().length > 0 || Boolean(c.phoneNumber));
        }
      }
    } catch (err) {
      console.warn('⚠️ [CONTACTS] Failed to fetch device contacts:', err);
    }

    // Load any user custom numbers added in app and merge with real device contacts
    try {
      const customList = (await storage.getItem<PhoneContact[]>(CUSTOM_CONTACTS_KEY)) || [];
      const seen = new Set<string>();
      const combined: PhoneContact[] = [];

      for (const c of customList) {
        const key = (c.phoneNumber || c.name).toLowerCase().replace(/[^a-z0-9]/g, '');
        if (key && !seen.has(key)) {
          seen.add(key);
          combined.push(c);
        }
      }

      for (const c of deviceContacts) {
        const key = (c.phoneNumber || c.name).toLowerCase().replace(/[^a-z0-9]/g, '');
        if (key && !seen.has(key)) {
          seen.add(key);
          combined.push(c);
        } else if (!key) {
          combined.push(c);
        }
      }

      return combined;
    } catch {
      return deviceContacts;
    }
  }

  /**
   * Add a newly added phone number or contact directly
   */
  async addContact(name: string, phoneNumber: string, email?: string): Promise<PhoneContact> {
    const existing = (await storage.getItem<PhoneContact[]>(CUSTOM_CONTACTS_KEY)) || [];
    const newContact: PhoneContact = {
      id: `custom_ct_${Date.now()}`,
      name: name.trim(),
      phoneNumber: phoneNumber.trim(),
      email: email?.trim(),
      isRecentlyAdded: true,
    };
    const updated = [newContact, ...existing.filter(c => c.phoneNumber !== newContact.phoneNumber)];
    await storage.setItem(CUSTOM_CONTACTS_KEY, updated);
    return newContact;
  }

  /**
   * Search contacts by query
   */
  async searchContacts(query: string): Promise<PhoneContact[]> {
    const contacts = await this.getContacts();
    if (!query.trim()) return contacts;
    const q = query.toLowerCase();
    return contacts.filter(
      c =>
        c.name.toLowerCase().includes(q) ||
        (c.phoneNumber && c.phoneNumber.includes(q)) ||
        (c.email && c.email.toLowerCase().includes(q))
    );
  }
}

export const contactsService = new ContactsService();
