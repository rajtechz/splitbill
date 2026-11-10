import { apiClient } from '../../../services/api/client';
import { storage } from '../../../services/storage';
import { config } from '../../../app/config';
import { CURRENT_USER } from '../../../services/api/mockData';
import { User } from '../../../types';
import { AuthResponse, LoginEmailDto, RegisterDto } from '../types';

export const authService = {
  async loginWithEmail(data: LoginEmailDto): Promise<AuthResponse> {
    if (config.useMockApi) {
      await new Promise(resolve => setTimeout(() => resolve(undefined), 400));
      const user: User = {
        ...CURRENT_USER,
        email: data.email,
      };
      const tokens = {
        accessToken: `mock_jwt_token_${Date.now()}`,
        refreshToken: `mock_refresh_token_${Date.now()}`,
      };
      await storage.setTokens(tokens);
      await storage.setItem(storage.STORAGE_KEYS.USER_SESSION, user);
      return { user, tokens };
    }

    const res = await apiClient.post('/auth/login', data);
    const result: AuthResponse = res.data.data || res.data;

    console.log('\n======================================================');
    console.log(`🔑 [AUTH SERVICE - EMAIL LOGIN SUCCESS]`);
    console.log(`👤 User:          ${result.user.name} (${result.user.email})`);
    console.log(`🎫 Access Token:\n${result.tokens.accessToken}`);
    console.log(`🔄 Refresh Token:\n${result.tokens.refreshToken}`);
    console.log('======================================================\n');

    await storage.setTokens(result.tokens);
    await storage.setItem(storage.STORAGE_KEYS.USER_SESSION, result.user);
    return result;
  },

  async loginWithPhoneOtp(phoneNumber: string, otp: string): Promise<AuthResponse> {
    if (config.useMockApi) {
      await new Promise(resolve => setTimeout(() => resolve(undefined), 400));
      const user: User = {
        ...CURRENT_USER,
        phoneNumber,
      };
      const tokens = {
        accessToken: `mock_jwt_token_${Date.now()}`,
        refreshToken: `mock_refresh_token_${Date.now()}`,
      };
      await storage.setTokens(tokens);
      await storage.setItem(storage.STORAGE_KEYS.USER_SESSION, user);
      return { user, tokens };
    }

    const res = await apiClient.post('/auth/otp/verify', { phoneNumber, otp });
    const result: AuthResponse = res.data.data || res.data;

    console.log('\n======================================================');
    console.log(`🔑 [AUTH SERVICE - OTP LOGIN SUCCESS]`);
    console.log(`📱 Phone:         ${phoneNumber}`);
    console.log(`👤 User:          ${result.user.name} (${result.user.email})`);
    console.log(`🎫 Access Token:\n${result.tokens.accessToken}`);
    console.log(`🔄 Refresh Token:\n${result.tokens.refreshToken}`);
    console.log('======================================================\n');

    await storage.setTokens(result.tokens);
    await storage.setItem(storage.STORAGE_KEYS.USER_SESSION, result.user);
    return result;
  },

  async sendPhoneOtp(phoneNumber: string, isLogin: boolean = false): Promise<{ success: boolean; message?: string; otp?: string }> {
    if (config.useMockApi) {
      await new Promise(resolve => setTimeout(() => resolve(undefined), 300));
      const randomOtp = Math.floor(100000 + Math.random() * 900000).toString();
      console.log('\n======================================================');
      console.log(`🔑 [SPLITMATE DEV OTP] Generated Random OTP for ${phoneNumber}:`);
      console.log(`🔢 Code: ${randomOtp}`);
      console.log('======================================================\n');
      return { success: true, message: 'OTP sent to ' + phoneNumber, otp: randomOtp };
    }

    const res = await apiClient.post('/auth/otp/send', { phoneNumber, isLogin });
    const otp = res.data?.data?.otp || res.data?.data?.devOtp;
    console.log('\n======================================================');
    console.log(`🔑 [SPLITMATE BACKEND API] Received Random OTP for ${phoneNumber}:`);
    console.log(`🔢 Code: ${otp}`);
    console.log('======================================================\n');
    return { success: true, message: res.data?.message, otp };
  },

  async register(data: RegisterDto): Promise<AuthResponse> {
    if (config.useMockApi) {
      await new Promise(resolve => setTimeout(() => resolve(undefined), 400));
      const user: User = {
        id: `usr_${Date.now()}`,
        name: data.name,
        email: data.email,
        phoneNumber: data.phoneNumber,
        defaultCurrency: (data.defaultCurrency as any) || 'INR',
        createdAt: new Date().toISOString(),
      };
      const tokens = {
        accessToken: `mock_jwt_token_${Date.now()}`,
        refreshToken: `mock_refresh_token_${Date.now()}`,
      };
      await storage.setTokens(tokens);
      await storage.setItem(storage.STORAGE_KEYS.USER_SESSION, user);
      return { user, tokens };
    }

    console.log('\n======================================================');
    console.log(`📝 [AUTH SERVICE] Submitting Registration for: ${data.name} (${data.email})`);
    console.log('======================================================\n');

    const res = await apiClient.post('/auth/register', data);
    const result: AuthResponse = res.data.data || res.data;

    console.log('\n======================================================');
    console.log(`🎉 [AUTH SERVICE] Registration Response Success!`);
    console.log(`👤 User ID:       ${result.user.id}`);
    console.log(`📧 User Email:    ${result.user.email}`);
    console.log(`🎫 Access Token:\n${result.tokens.accessToken}`);
    console.log(`🔄 Refresh Token:\n${result.tokens.refreshToken}`);
    console.log('======================================================\n');

    await storage.setTokens(result.tokens);
    await storage.setItem(storage.STORAGE_KEYS.USER_SESSION, result.user);
    return result;
  },

  async forgotPassword(email: string): Promise<{ success: boolean; message: string }> {
    if (config.useMockApi) {
      await new Promise(resolve => setTimeout(() => resolve(undefined), 300));
      return { success: true, message: 'Reset link sent to ' + email };
    }
    const res = await apiClient.post('/auth/forgot-password', { email });
    return res.data;
  },

  async logout(): Promise<void> {
    try {
      if (!config.useMockApi) {
        await apiClient.post('/auth/logout').catch(() => {});
      }
    } finally {
      await storage.clearAuth();
    }
  },
};
