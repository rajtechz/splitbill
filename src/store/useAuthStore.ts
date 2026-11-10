import { create } from 'zustand';
import { User } from '../types';
import { CURRENT_USER } from '../services/api/mockData';
import { storage } from '../services/storage';
import { authService } from '../features/auth/services/authService';
import { repository } from '../services/api/repository';

interface AuthState {
  isAuthenticated: boolean;
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;
  isPro: boolean;

  initializeAuth: () => Promise<void>;
  login: (identifier: string, passOrOtp: string) => Promise<boolean>;
  register: (name: string, email: string, phone?: string, password?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (updated: Partial<User>) => void;
  setError: (err: string | null) => void;
  upgradeToPro: (plan?: 'monthly' | 'annual') => Promise<void>;
  downgradeToFree: () => Promise<void>;
  toggleProDev: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: true, // Default authenticated for frictionless developer experience
  currentUser: {
    ...CURRENT_USER,
    subscriptionTier: 'free', // Defaults to free tier so Pro features can be tested and upgraded!
  },
  isPro: false,
  isLoading: false,
  error: null,

  initializeAuth: async () => {
    try {
      const savedUser = await storage.getItem<User>(storage.STORAGE_KEYS.USER_SESSION);
      const token = await storage.getAuthToken();
      if (savedUser && token) {
        set({
          isAuthenticated: true,
          currentUser: savedUser,
          isPro: savedUser.subscriptionTier === 'pro',
        });
      } else {
        const defaultUser: User = { ...CURRENT_USER, subscriptionTier: 'free' };
        set({
          isAuthenticated: true,
          currentUser: defaultUser,
          isPro: false,
        });
      }
    } catch {
      const defaultUser: User = { ...CURRENT_USER, subscriptionTier: 'free' };
      set({ isAuthenticated: true, currentUser: defaultUser, isPro: false });
    }
  },

  login: async (identifier: string, passOrOtp: string) => {
    set({ isLoading: true, error: null });
    try {
      const isEmail = identifier.includes('@');
      const response = isEmail
        ? await authService.loginWithEmail({ email: identifier, password: passOrOtp })
        : await authService.loginWithPhoneOtp(identifier, passOrOtp);

      set({ isAuthenticated: true, currentUser: response.user, isLoading: false });
      return true;
    } catch (e: any) {
      const msg = e.message || 'Login failed. Please check your credentials.';
      set({ error: msg, isLoading: false });
      return false;
    }
  },

  register: async (name: string, email: string, phone?: string, password?: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authService.register({
        name,
        email,
        phoneNumber: phone,
        password,
        defaultCurrency: 'INR',
      });
      set({ isAuthenticated: true, currentUser: response.user, isLoading: false });
      return true;
    } catch (e: any) {
      const msg = e.message || 'Registration failed. Please try again.';
      set({ error: msg, isLoading: false });
      return false;
    }
  },

  logout: async () => {
    try {
      await authService.logout();
    } finally {
      set({ isAuthenticated: false, currentUser: null, error: null });
    }
  },

  updateUser: (updated: Partial<User>) => {
    const cur = get().currentUser;
    if (cur) {
      const next = { ...cur, ...updated };
      set({ currentUser: next });
      storage.setItem(storage.STORAGE_KEYS.USER_SESSION, next).catch(() => {});
      repository.updateUserProfile(updated).catch(() => {});
    }
  },

  setError: (err: string | null) => {
    set({ error: err });
  },

  upgradeToPro: async (plan = 'annual') => {
    const cur = get().currentUser;
    if (cur) {
      const expires = new Date();
      if (plan === 'annual') {
        expires.setFullYear(expires.getFullYear() + 1);
      } else {
        expires.setMonth(expires.getMonth() + 1);
      }
      const updated: User = {
        ...cur,
        subscriptionTier: 'pro',
        subscriptionExpiresAt: expires.toISOString(),
      };
      set({ currentUser: updated, isPro: true });
      await storage.setItem(storage.STORAGE_KEYS.USER_SESSION, updated);
    }
  },

  downgradeToFree: async () => {
    const cur = get().currentUser;
    if (cur) {
      const updated: User = {
        ...cur,
        subscriptionTier: 'free',
        subscriptionExpiresAt: undefined,
      };
      set({ currentUser: updated, isPro: false });
      await storage.setItem(storage.STORAGE_KEYS.USER_SESSION, updated);
    }
  },

  toggleProDev: () => {
    const isCurrentlyPro = get().isPro;
    if (isCurrentlyPro) {
      get().downgradeToFree();
    } else {
      get().upgradeToPro('annual');
    }
  },
}));
