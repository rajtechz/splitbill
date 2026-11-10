import { Response } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { store } from '../data/store.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const getMe = async (req: AuthenticatedRequest, res: Response) => {
  const user = req.user;
  if (!user) {
    return sendError(res, 'User session not found', 404, 'NOT_FOUND');
  }
  const { passwordHash, ...safeUser } = user;
  return sendSuccess(res, safeUser);
};

export const updateMe = async (req: AuthenticatedRequest, res: Response) => {
  const currentUserId = req.user?.id || 'usr_me';
  const { name, phoneNumber, upiId, avatarUrl, defaultCurrency } = req.body;

  const updated = store.updateUser(currentUserId, {
    ...(name ? { name } : {}),
    ...(phoneNumber !== undefined ? { phoneNumber } : {}),
    ...(upiId !== undefined ? { upiId } : {}),
    ...(avatarUrl !== undefined ? { avatarUrl } : {}),
    ...(defaultCurrency ? { defaultCurrency } : {}),
  });

  if (!updated) {
    return sendError(res, 'Failed to update user', 404, 'NOT_FOUND');
  }

  const { passwordHash, ...safeUser } = updated;
  return sendSuccess(res, safeUser, 'Profile updated successfully');
};

