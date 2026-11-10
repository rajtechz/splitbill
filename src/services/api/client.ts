import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { config, onConfigChange } from '../../app/config';
import { storage } from '../storage';

export interface ApiErrorResponse {
  message: string;
  statusCode?: number;
  code?: string;
  errors?: Record<string, string[]>;
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: config.apiBaseUrl,
  timeout: config.apiTimeoutMs,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-Client-App': 'SplitMate-Mobile',
    'X-Client-Version': config.appVersion,
  },
});

// Update baseURL dynamically when configuration changes
onConfigChange(newConfig => {
  apiClient.defaults.baseURL = newConfig.apiBaseUrl;
  apiClient.defaults.timeout = newConfig.apiTimeoutMs;
});

export const updateApiBaseUrl = (url: string) => {
  apiClient.defaults.baseURL = url;
};

// Request interceptor: Attach JWT token
apiClient.interceptors.request.use(
  async (requestConfig: InternalAxiosRequestConfig) => {
    const token = await storage.getAuthToken();
    if (token && requestConfig.headers) {
      requestConfig.headers.Authorization = `Bearer ${token}`;
    }
    return requestConfig;
  },
  error => Promise.reject(error)
);

// Token refresh queue state
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response interceptor: Handle 401 & Token Refresh
apiClient.interceptors.response.use(
  (response: AxiosResponse) => response,
  async error => {
    const originalRequest = error.config;

    // Avoid infinite loop if refresh endpoint itself returns 401
    const isRefreshEndpoint = originalRequest.url?.includes('/auth/refresh-token');

    if (error.response?.status === 401 && !originalRequest._retry && !isRefreshEndpoint) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(token => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch(err => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const refreshToken = await storage.getRefreshToken();
        if (!refreshToken) {
          throw new Error('No refresh token available');
        }

        // Call backend refresh endpoint
        const response = await axios.post(
          `${apiClient.defaults.baseURL}/auth/refresh-token`,
          { refreshToken },
          { headers: { 'Content-Type': 'application/json' } }
        );

        const { accessToken, refreshToken: newRefreshToken } = response.data.data || response.data;
        await storage.setTokens({ accessToken, refreshToken: newRefreshToken || refreshToken });

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        }
        processQueue(null, accessToken);
        return apiClient(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        await storage.clearAuth();
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(formatApiError(error));
  }
);

export const formatApiError = (error: any): ApiErrorResponse => {
  if (error.response?.data) {
    const data = error.response.data;
    return {
      message: data.message || error.message || 'An unexpected server error occurred',
      statusCode: error.response.status,
      code: data.code,
      errors: data.errors,
    };
  }
  if (
    error.code === 'ECONNABORTED' ||
    error.code === 'ERR_NETWORK' ||
    error.code === 'ETIMEDOUT' ||
    error.code === 'ECONNREFUSED' ||
    error.message?.includes('timeout') ||
    error.message?.includes('Network Error') ||
    error.message?.includes('network error') ||
    error.request
  ) {
    return {
      message: 'Network error. Please check your internet connection or server status.',
      code: 'NETWORK_ERROR',
    };
  }
  return {
    message: error.message || 'An unknown error occurred',
    code: 'UNKNOWN_ERROR',
  };
};
