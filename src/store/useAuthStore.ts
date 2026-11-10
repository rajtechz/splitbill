import { create } from 'zustand';
import { User } from '../types';
import { CURRENT_USER } from '../services/api/mockData';
import { storage } from '../services/storage';

interface AuthState {
  isAuthenticated: boolean;
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;

  initializeAuth: () => Promise<void>;
  login: (identifier: string, passOrOtp: string) => Promise<boolean>;
  register: (name: string, email: string, phone?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (updated: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: true, // Default authenticated for frictionless developer / reviewer experience
  currentUser: CURRENT_USER,
  isLoading: false,
  error: null,

  initializeAuth: async () => {
    try {
      const savedUser = await storage.getItem<User>(storage.STORAGE_KEYS.USER_SESSION);
      const token = await storage.getAuthToken();
      if (savedUser && token) {
        set({ isAuthenticated: true, currentUser: savedUser });
      } else {
        // Fallback default dev session
        set({ isAuthenticated: true, currentUser: CURRENT_USER });
      }
    } catch {
      set({ isAuthenticated: true, currentUser: CURRENT_USER });
    }
  },

  login: async (identifier: string, _passOrOtp: string) => {
    set({ isLoading: true, error: null });
    try {
      // Simulate realistic API verification
      await new Promise(res => setTimeout(() => res(true), 500));
      const user: User = {
        ...CURRENT_USER,
        email: identifier.includes('@') ? identifier : CURRENT_USER.email,
        phoneNumber: !identifier.includes('@') ? identifier : CURRENT_USER.phoneNumber,
      };
      await storage.setAuthToken('mock_jwt_token_' + Date.now());
      await storage.setItem(storage.STORAGE_KEYS.USER_SESSION, user);
      set({ isAuthenticated: true, currentUser: user, isLoading: false });
      return true;
    } catch (e: any) {
      set({ error: e.message || 'Login failed', isLoading: false });
      return false;
    }
  },

  register: async (name: string, email: string, phone?: string) => {
    set({ isLoading: true, error: null });
    try {
      await new Promise(res => setTimeout(() => res(true), 500));
      const newUser: User = {
        id: `usr_${Date.now()}`,
        name,
        email,
        phoneNumber: phone,
        defaultCurrency: 'INR',
        createdAt: new Date().toISOString(),
      };
      await storage.setAuthToken('mock_jwt_token_' + Date.now());
      await storage.setItem(storage.STORAGE_KEYS.USER_SESSION, newUser);
      set({ isAuthenticated: true, currentUser: newUser, isLoading: false });
      return true;
    } catch (e: any) {
      set({ error: e.message || 'Registration failed', isLoading: false });
      return false;
    }
  },

  logout: async () => {
    await storage.clearAuth();
    set({ isAuthenticated: false, currentUser: null });
  },

  updateUser: (updated: Partial<User>) => {
    const cur = get().currentUser;
    if (cur) {
      const next = { ...cur, ...updated };
      set({ currentUser: next });
      storage.setItem(storage.STORAGE_KEYS.USER_SESSION, next).catch(() => {});
    }
  },
}));
