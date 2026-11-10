import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { store } from '../data/store.js';
import { generateTokens, verifyRefreshToken } from '../utils/jwt.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { User, AuthenticatedRequest } from '../types/index.js';
import { otpProvider } from '../services/providers/index.js';

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
  const { passwordHash: _, mPin: __, ...safeUser } = user;

  return sendSuccess(res, {
    user: safeUser,
    tokens,
  }, 'Login successful');
};

export const register = async (req: Request, res: Response) => {
  const { name, email, password, phoneNumber, defaultCurrency, country } = req.body;

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
    country: country || 'IN',
    isPinEnabled: true,
    isBiometricsEnabled: true,
    mPin: '1234',
    createdAt: new Date().toISOString(),
  };

  store.createUser(newUser);
  const tokens = generateTokens(newUser);
  const { passwordHash: _, mPin: __, ...safeUser } = newUser;

  return sendSuccess(res, {
    user: safeUser,
    tokens,
  }, 'Registration successful', 201);
};

export const sendOtp = async (req: Request, res: Response) => {
  const { phoneNumber, email } = req.body;
  if (!phoneNumber && !email) {
    return sendError(res, 'Phone number or email is required', 400, 'VALIDATION_ERROR');
  }

  // Uses flexible OtpProvider (Mock/Twilio/Firebase)
  const result = await otpProvider.sendOtp({ phone: phoneNumber, email });

  return sendSuccess(res, {
    sent: result.success,
    phoneNumber,
    email,
    trackingId: result.trackingId,
    devOtp: result.devOtp,
  }, result.message);
};

export const verifyOtp = async (req: Request, res: Response) => {
  const { phoneNumber, email, otp } = req.body;

  if ((!phoneNumber && !email) || !otp) {
    return sendError(res, 'Phone number/email and OTP code are required', 400, 'VALIDATION_ERROR');
  }

  const isValid = await otpProvider.verifyOtp({ phone: phoneNumber, email }, otp);
  if (!isValid) {
    return sendError(res, 'Invalid or expired OTP code (Test code: 123456)', 400, 'INVALID_OTP');
  }

  // Find or create user dynamically
  let user = phoneNumber ? store.findUserByPhone(phoneNumber) : (email ? store.findUserByEmail(email) : undefined);
  if (!user) {
    const identifier = phoneNumber || email || 'user';
    user = {
      id: `usr_${Date.now()}`,
      name: phoneNumber ? `User ${phoneNumber.slice(-4)}` : identifier.split('@')[0],
      email: email || `${(phoneNumber || '').replace(/[^0-9]/g, '')}@splitmate.app`,
      phoneNumber,
      defaultCurrency: 'INR',
      country: 'IN',
      isPinEnabled: true,
      isBiometricsEnabled: true,
      mPin: '1234',
      createdAt: new Date().toISOString(),
    };
    store.createUser(user);
  }

  const tokens = generateTokens(user);
  const { passwordHash: _, mPin: __, ...safeUser } = user;

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

// --- 4-Digit mPIN & Biometrics Management ---

export const setupMpin = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id || req.body.userId || 'usr_me';
  const { pin } = req.body;

  if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
    return sendError(res, 'PIN must be exactly 4 digits', 400, 'INVALID_PIN_FORMAT');
  }

  const ok = store.setMpin(userId, pin);
  if (!ok) {
    return sendError(res, 'User not found', 404, 'USER_NOT_FOUND');
  }

  return sendSuccess(res, { isPinEnabled: true, hasPinSet: true }, '4-digit mPIN set successfully');
};

export const verifyMpin = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id || req.body.userId || 'usr_me';
  const { pin } = req.body;

  if (!pin) {
    return sendError(res, 'mPIN is required', 400, 'VALIDATION_ERROR');
  }

  const isMatch = store.verifyMpin(userId, pin);
  if (isMatch) {
    return sendSuccess(res, { verified: true }, 'mPIN verified successfully');
  } else {
    return sendError(res, 'Incorrect mPIN code', 401, 'INVALID_PIN');
  }
};

export const toggleBiometrics = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id || req.body.userId || 'usr_me';
  const { enabled } = req.body;

  const current = store.toggleBiometrics(userId, enabled);
  return sendSuccess(res, { isBiometricsEnabled: current }, `Biometric unlock ${current ? 'enabled' : 'disabled'}`);
};

export const getSecuritySettings = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user?.id || 'usr_me';
  const user = store.findUserById(userId);

  return sendSuccess(res, {
    isPinEnabled: user?.isPinEnabled ?? true,
    hasPinSet: Boolean(user?.mPin),
    isBiometricsEnabled: user?.isBiometricsEnabled ?? true,
  }, 'Security settings fetched');
};
