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
  errorCode: string | null;
  isPro: boolean;

  initializeAuth: () => Promise<void>;
  login: (identifier: string, passOrOtp: string) => Promise<boolean>;
  register: (name: string, email: string, phone?: string, password?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (updated: Partial<User>) => void;
  setError: (err: string | null, code?: string | null) => void;
  upgradeToPro: (plan?: 'monthly' | 'annual') => Promise<void>;
  downgradeToFree: () => Promise<void>;
  toggleProDev: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: false, // Default to unauthenticated: loads login screen unless valid token exists
  currentUser: null,
  isPro: false,
  isLoading: false,
  error: null,
  errorCode: null,

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
        if (__DEV__) {
          console.log(`🔑 [AUTH] Valid token found for ${savedUser.name} (${savedUser.email}). Session active.`);
        }
      } else {
        // No valid token or user session in storage -> stay on login screen
        await storage.clearAuth();
        set({
          isAuthenticated: false,
          currentUser: null,
          isPro: false,
        });
        if (__DEV__) {
          console.log('🔒 [AUTH] No active token found in storage. Redirected to Login.');
        }
      }
    } catch {
      await storage.clearAuth();
      set({ isAuthenticated: false, currentUser: null, isPro: false });
    }
  },

  login: async (identifier: string, passOrOtp: string) => {
    set({ isLoading: true, error: null, errorCode: null });
    try {
      const isEmail = identifier.includes('@');
      const response = isEmail
        ? await authService.loginWithEmail({ email: identifier, password: passOrOtp })
        : await authService.loginWithPhoneOtp(identifier, passOrOtp);

      // Store tokens and user session securely in local storage
      await storage.setTokens(response.tokens);
      await storage.setItem(storage.STORAGE_KEYS.USER_SESSION, response.user);

      set({
        isAuthenticated: true,
        currentUser: response.user,
        isPro: response.user.subscriptionTier === 'pro',
        isLoading: false,
        error: null,
        errorCode: null,
      });

      if (__DEV__) {
        console.log('\n======================================================');
        console.log(`🎉 [AUTH STORE - LOGIN SUCCESS]`);
        console.log(`👤 User:          ${response.user.name} (${response.user.email})`);
        console.log(`🎫 Stored Token:\n${response.tokens.accessToken}`);
        console.log('======================================================\n');
      }
      return true;
    } catch (e: any) {
      const msg = e.response?.data?.message || e.message || 'Login failed. Please check your credentials.';
      const code = e.code || e.response?.data?.code || (msg.toLowerCase().includes('no account') ? 'USER_NOT_FOUND' : null);
      set({ error: msg, errorCode: code, isLoading: false });
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

      // Store tokens and user session securely in local storage
      await storage.setTokens(response.tokens);
      await storage.setItem(storage.STORAGE_KEYS.USER_SESSION, response.user);

      set({
        isAuthenticated: true,
        currentUser: response.user,
        isPro: response.user.subscriptionTier === 'pro',
        isLoading: false,
      });

      if (__DEV__) {
        console.log('\n======================================================');
        console.log(`🎉 [AUTH STORE - REGISTER SUCCESS]`);
        console.log(`👤 User:          ${response.user.name} (${response.user.email})`);
        console.log(`🎫 Stored Token:\n${response.tokens.accessToken}`);
        console.log('======================================================\n');
      }
      return true;
    } catch (e: any) {
      const msg = e.response?.data?.message || e.message || 'Registration failed. Please try again.';
      console.warn('❌ [REGISTER ERROR]', msg);
      set({ error: msg, isLoading: false });
      return false;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await authService.logout();
    } catch (err) {
      console.warn('Backend logout warning:', err);
    } finally {
      // Clear token, refresh token, and user session from app storage
      await storage.clearAuth();
      try {
        const { useAppStore } = await import('./useAppStore');
        useAppStore.getState().resetData();
      } catch {}
      set({
        isAuthenticated: false,
        currentUser: null,
        isPro: false,
        isLoading: false,
        error: null,
      });
      if (__DEV__) {
        console.log('🔒 [AUTH] User logged out. All tokens and session data cleared from app storage.');
      }
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

  setError: (err: string | null, code: string | null = null) => {
    set({ error: err, errorCode: code });
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
