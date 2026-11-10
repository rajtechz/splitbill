import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  AUTH_TOKEN: '@splitmate_auth_token',
  USER_SESSION: '@splitmate_user_session',
  OFFLINE_MUTATION_QUEUE: '@splitmate_offline_queue',
  GROUPS_CACHE: '@splitmate_cache_groups',
  EXPENSES_CACHE: '@splitmate_cache_expenses',
  FRIENDS_CACHE: '@splitmate_cache_friends',
  ACTIVITIES_CACHE: '@splitmate_cache_activities',
  SETTLEMENTS_CACHE: '@splitmate_cache_settlements',
};

export const storage = {
  async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    } catch {
      return null;
    }
  },

  async setAuthToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
    } catch (e) {
      console.warn('Failed to set auth token', e);
    }
  },

  async clearAuth(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_SESSION);
    } catch (e) {
      console.warn('Failed to clear auth', e);
    }
  },

  async getItem<T>(key: string): Promise<T | null> {
    try {
      const data = await AsyncStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch {
      return null;
    }
  },

  async setItem<T>(key: string, value: T): Promise<void> {
    try {
      await AsyncStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.warn(`Failed to set item for key ${key}`, e);
    }
  },

  async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch {}
  },

  STORAGE_KEYS,
};
