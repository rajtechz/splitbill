import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  AUTH_TOKEN: '@splitmate_auth_token',
  REFRESH_TOKEN: '@splitmate_refresh_token',
  USER_SESSION: '@splitmate_user_session',
  API_BASE_URL: '@splitmate_api_base_url',
  USE_MOCK_API: '@splitmate_use_mock_api',
  OFFLINE_MUTATION_QUEUE: '@splitmate_offline_queue',
  GROUPS_CACHE: '@splitmate_cache_groups',
  EXPENSES_CACHE: '@splitmate_cache_expenses',
  FRIENDS_CACHE: '@splitmate_cache_friends',
  ACTIVITIES_CACHE: '@splitmate_cache_activities',
  SETTLEMENTS_CACHE: '@splitmate_cache_settlements',
  PERMISSIONS_ONBOARDING_COMPLETED: '@splitmate_permissions_onboarding_completed',
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

  async getRefreshToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
    } catch {
      return null;
    }
  },

  async setRefreshToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
    } catch (e) {
      console.warn('Failed to set refresh token', e);
    }
  },

  async setTokens(tokens: { accessToken: string; refreshToken?: string }): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, tokens.accessToken);
      if (tokens.refreshToken) {
        await AsyncStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, tokens.refreshToken);
      }
      if (__DEV__) {
        console.log(`💾 [STORAGE] Stored access token (${tokens.accessToken.slice(0, 15)}...) and refresh token in AsyncStorage`);
      }
    } catch (e) {
      console.warn('Failed to set tokens', e);
    }
  },

  async clearAuth(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
      await AsyncStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      await AsyncStorage.removeItem(STORAGE_KEYS.USER_SESSION);
      if (__DEV__) {
        console.log('🗑️ [STORAGE] Cleared auth token, refresh token & user session from AsyncStorage');
      }
    } catch (e) {
      console.warn('Failed to clear auth', e);
    }
  },

  async getApiBaseUrl(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(STORAGE_KEYS.API_BASE_URL);
    } catch {
      return null;
    }
  },

  async setApiBaseUrl(url: string): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.API_BASE_URL, url);
    } catch (e) {
      console.warn('Failed to set API base URL', e);
    }
  },

  async getUseMockApi(): Promise<boolean | null> {
    try {
      const val = await AsyncStorage.getItem(STORAGE_KEYS.USE_MOCK_API);
      return val !== null ? JSON.parse(val) : false;
    } catch {
      return false;
    }
  },

  async setUseMockApi(useMock: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USE_MOCK_API, JSON.stringify(useMock));
    } catch (e) {
      console.warn('Failed to set useMockApi preference', e);
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
