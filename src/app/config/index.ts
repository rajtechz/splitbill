import { Platform } from 'react-native';

export interface AppConfig {
  appName: string;
  appVersion: string;
  apiBaseUrl: string;
  apiTimeoutMs: number;
  environment: 'development' | 'staging' | 'production';
  useMockApi: boolean;
}

/**
 * BACKEND ENVIRONMENT SWITCH
 * Set to true:  Points to live production cloud server (Render + MongoDB Atlas)
 * Set to false: Points to your local machine (localhost:3000 for iOS / 10.0.2.2:3000 for Android)
 */
export const USE_PRODUCTION_BACKEND = true;

export const DEFAULT_DEV_API_URLS = {
  androidEmulator: 'http://10.0.2.2:3000/api/v1',
  iosSimulator: 'http://localhost:3000/api/v1',
  production: 'https://splitbill-backend-o2on.onrender.com/api/v1',
};

export const getDefaultApiBaseUrl = (): string => {
  if (USE_PRODUCTION_BACKEND) {
    return DEFAULT_DEV_API_URLS.production;
  }
  return Platform.OS === 'android'
    ? DEFAULT_DEV_API_URLS.androidEmulator
    : DEFAULT_DEV_API_URLS.iosSimulator;
};

export const config: AppConfig = {
  appName: 'SplitMate',
  appVersion: '1.0.0',
  apiBaseUrl: getDefaultApiBaseUrl(),
  apiTimeoutMs: 30000, // 30s timeout for cloud servers (Render free tier spin-up & mobile networks)
  environment: __DEV__ ? 'development' : 'production',
  useMockApi: false, // Always use live backend connected to MongoDB
};

type ConfigListener = (newConfig: AppConfig) => void;
const listeners: Set<ConfigListener> = new Set();

export const updateConfig = (partial: Partial<AppConfig>) => {
  Object.assign(config, partial);
  listeners.forEach(cb => cb(config));
};

export const onConfigChange = (listener: ConfigListener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

