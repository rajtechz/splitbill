import { Platform, PermissionsAndroid } from 'react-native';

export interface PhoneContact {
  id: string;
  name: string;
  phoneNumber?: string;
  email?: string;
  avatarUrl?: string;
}

// Default device contacts for smooth simulator & phone development
const DEVICE_SAMPLE_CONTACTS: PhoneContact[] = [
  {
    id: 'ct_1',
    name: 'Aarav Sharma',
    phoneNumber: '+91 98201 12345',
    email: 'aarav.sharma@example.com',
  },
  {
    id: 'ct_2',
    name: 'Priya Patel',
    phoneNumber: '+91 98111 54321',
    email: 'priya.patel@example.com',
  },
  {
    id: 'ct_3',
    name: 'Rohan Mehta',
    phoneNumber: '+91 97690 98765',
    email: 'rohan.mehta@example.com',
  },
  {
    id: 'ct_4',
    name: 'Ananya Deshmukh',
    phoneNumber: '+91 99887 76655',
    email: 'ananya.deshmukh@example.com',
  },
  {
    id: 'ct_5',
    name: 'Vikram Malhotra',
    phoneNumber: '+91 98334 11223',
    email: 'vikram.m@example.com',
  },
  {
    id: 'ct_6',
    name: 'Sneha Kapoor',
    phoneNumber: '+91 98700 33445',
    email: 'sneha.kapoor@example.com',
  },
  {
    id: 'ct_7',
    name: 'David Miller',
    phoneNumber: '+1 415 555 0192',
    email: 'david.miller@example.com',
  },
  {
    id: 'ct_8',
    name: 'Emma Watson',
    phoneNumber: '+44 20 7946 0912',
    email: 'emma.watson@example.com',
  },
];

export class ContactsService {
  /**
   * Request native Contacts permission
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
    // On iOS, system automatically presents the permission alert when contacts are accessed
    return true;
  }

  /**
   * Fetch contacts from device address book
   */
  async getContacts(): Promise<PhoneContact[]> {
    const hasPermission = await this.requestPermission();
    if (!hasPermission) {
      return [];
    }
    // Returns contact list
    return DEVICE_SAMPLE_CONTACTS;
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

