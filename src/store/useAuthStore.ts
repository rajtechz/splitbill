import { create } from 'zustand';
import { User } from '../types';
import { CURRENT_USER } from '../services/api/mockData';
import { storage } from '../services/storage';
import { authService } from '../features/auth/services/authService';

interface AuthState {
  isAuthenticated: boolean;
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;

  initializeAuth: () => Promise<void>;
  login: (identifier: string, passOrOtp: string) => Promise<boolean>;
  register: (name: string, email: string, phone?: string, password?: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUser: (updated: Partial<User>) => void;
  setError: (err: string | null) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: true, // Default authenticated for frictionless developer experience
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
        set({ isAuthenticated: true, currentUser: CURRENT_USER });
      }
    } catch {
      set({ isAuthenticated: true, currentUser: CURRENT_USER });
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
    }
  },

  setError: (err: string | null) => {
    set({ error: err });
  },
}));
