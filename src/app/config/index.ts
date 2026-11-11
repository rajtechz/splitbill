import { Platform } from 'react-native';

export interface AppConfig {
  appName: string;
  appVersion: string;
  apiBaseUrl: string;
  apiTimeoutMs: number;
  environment: 'development' | 'staging' | 'production';
  useMockApi: boolean;
}

export const DEFAULT_DEV_API_URLS = {
  androidEmulator: 'http://10.0.2.2:3000/api/v1',
  iosSimulator: 'http://localhost:3000/api/v1',
  production: 'https://api.splitmate.app/v1',
};

export const getDefaultApiBaseUrl = (): string => {
  if (__DEV__) {
    return Platform.OS === 'android'
      ? DEFAULT_DEV_API_URLS.androidEmulator
      : DEFAULT_DEV_API_URLS.iosSimulator;
  }
  return DEFAULT_DEV_API_URLS.production;
};

export const config: AppConfig = {
  appName: 'SplitMate',
  appVersion: '1.0.0',
  apiBaseUrl: getDefaultApiBaseUrl(),
  apiTimeoutMs: 5000,
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

