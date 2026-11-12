import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { ThemeProvider, useTheme } from '../../theme';
import { storage } from '../../services/storage';
import { updateConfig, DEFAULT_DEV_API_URLS, USE_PRODUCTION_BACKEND, getDefaultApiBaseUrl } from '../config';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const ThemedStatusBar: React.FC = () => {
  const { isDark } = useTheme();
  return <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />;
};

export const AppProviders: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    const loadPersistedConfig = async () => {
      try {
        const [savedUrl, savedUseMock] = await Promise.all([
          storage.getApiBaseUrl(),
          storage.getUseMockApi(),
        ]);
        if (USE_PRODUCTION_BACKEND) {
          updateConfig({ apiBaseUrl: DEFAULT_DEV_API_URLS.production });
          await storage.setApiBaseUrl(DEFAULT_DEV_API_URLS.production);
        } else if (savedUrl) {
          updateConfig({ apiBaseUrl: savedUrl });
        } else {
          const defaultUrl = getDefaultApiBaseUrl();
          updateConfig({ apiBaseUrl: defaultUrl });
          await storage.setApiBaseUrl(defaultUrl);
        }
        // Always use live REST backend API & MongoDB (do not use mock data)
        updateConfig({ useMockApi: false });
        await storage.setUseMockApi(false);
      } catch (e) {
        console.warn('Failed to load persisted backend config', e);
      }
    };
    loadPersistedConfig();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider>
        <ThemeProvider>
          <ThemedStatusBar />
          <NavigationContainer>{children}</NavigationContainer>
        </ThemeProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );
};
