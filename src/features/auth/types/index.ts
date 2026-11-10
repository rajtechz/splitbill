import { User } from '../../../types';

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export interface LoginEmailDto {
  email: string;
  password?: string;
}

export interface RegisterDto {
  name: string;
  email: string;
  password?: string;
  phoneNumber?: string;
  defaultCurrency?: string;
}

export interface SendOtpDto {
  phoneNumber: string;
}

export interface VerifyOtpDto {
  phoneNumber: string;
  otp: string;
}

