export interface AppConfig {
  appName: string;
  appVersion: string;
  apiBaseUrl: string;
  apiTimeoutMs: number;
  environment: 'development' | 'staging' | 'production';
  useMockApi: boolean;
}

export const config: AppConfig = {
  appName: 'SplitMate',
  appVersion: '1.0.0',
  apiBaseUrl: 'https://api.splitmate.app/v1',
  apiTimeoutMs: 15000,
  environment: 'development',
  useMockApi: true, // Seamless development adapter with real architecture
};

