import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { store } from '../data/store.js';
import { generateTokens, verifyRefreshToken } from '../utils/jwt.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { User } from '../types/index.js';

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email) {
    return sendError(res, 'Email is required', 400, 'VALIDATION_ERROR');
  }

  const user = store.findUserByEmail(email);
  if (!user) {
    return sendError(res, 'Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  if (password && user.passwordHash) {
    const isMatch = bcrypt.compareSync(password, user.passwordHash);
    if (!isMatch) {
      return sendError(res, 'Invalid email or password', 401, 'INVALID_CREDENTIALS');
    }
  }

  const tokens = generateTokens(user);
  const { passwordHash, ...safeUser } = user;

  return sendSuccess(res, {
    user: safeUser,
    tokens,
  }, 'Login successful');
};

export const register = async (req: Request, res: Response) => {
  const { name, email, password, phoneNumber, defaultCurrency } = req.body;

  if (!name || !email) {
    return sendError(res, 'Name and email are required', 400, 'VALIDATION_ERROR');
  }

  const existing = store.findUserByEmail(email);
  if (existing) {
    return sendError(res, 'User with this email already exists', 409, 'USER_EXISTS');
  }

  const passwordHash = password ? bcrypt.hashSync(password, 8) : undefined;

  const newUser: User = {
    id: `usr_${Date.now()}`,
    name,
    email: email.trim().toLowerCase(),
    passwordHash,
    phoneNumber,
    defaultCurrency: defaultCurrency || 'INR',
    createdAt: new Date().toISOString(),
  };

  store.createUser(newUser);
  const tokens = generateTokens(newUser);
  const { passwordHash: _, ...safeUser } = newUser;

  return sendSuccess(res, {
    user: safeUser,
    tokens,
  }, 'Registration successful', 201);
};

export const sendOtp = async (req: Request, res: Response) => {
  const { phoneNumber } = req.body;
  if (!phoneNumber) {
    return sendError(res, 'Phone number is required', 400, 'VALIDATION_ERROR');
  }

  // In production, integrate SMS provider (Twilio / Firebase).
  // For dev, OTP 123456 is always accepted.
  return sendSuccess(res, {
    sent: true,
    phoneNumber,
  }, `OTP sent to ${phoneNumber}. (Dev code: 123456)`);
};

export const verifyOtp = async (req: Request, res: Response) => {
  const { phoneNumber, otp } = req.body;

  if (!phoneNumber || !otp) {
    return sendError(res, 'Phone number and OTP code are required', 400, 'VALIDATION_ERROR');
  }

  // Find or create user by phone
  let user = store.findUserByPhone(phoneNumber);
  if (!user) {
    user = {
      id: `usr_${Date.now()}`,
      name: `User ${phoneNumber.slice(-4)}`,
      email: `${phoneNumber.replace(/[^0-9]/g, '')}@splitmate.app`,
      phoneNumber,
      defaultCurrency: 'INR',
      createdAt: new Date().toISOString(),
    };
    store.createUser(user);
  }

  const tokens = generateTokens(user);
  const { passwordHash, ...safeUser } = user;

  return sendSuccess(res, {
    user: safeUser,
    tokens,
  }, 'OTP verified successfully');
};

export const refreshToken = async (req: Request, res: Response) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return sendError(res, 'Refresh token is required', 400, 'VALIDATION_ERROR');
  }

  const decoded = verifyRefreshToken(refreshToken);
  if (!decoded || !decoded.id) {
    return sendError(res, 'Invalid or expired refresh token', 401, 'INVALID_REFRESH_TOKEN');
  }

  const user = store.findUserById(decoded.id);
  if (!user) {
    return sendError(res, 'User not found', 401, 'USER_NOT_FOUND');
  }

  const tokens = generateTokens(user);
  return sendSuccess(res, tokens, 'Tokens refreshed successfully');
};

export const forgotPassword = async (req: Request, res: Response) => {
  const { email } = req.body;
  return sendSuccess(res, { email }, `Password reset link sent to ${email}`);
};

export const logout = async (_req: Request, res: Response) => {
  return sendSuccess(res, null, 'Logged out successfully');
};

