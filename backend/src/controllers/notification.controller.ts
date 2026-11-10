import { Response } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
import { store } from '../data/store.js';
import { sendSuccess, sendError } from '../utils/response.js';

export const getNotifications = async (_req: AuthenticatedRequest, res: Response) => {
  const notifications = store.getNotifications();
  return sendSuccess(res, notifications);
};

export const markAsRead = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const success = store.markNotificationAsRead(id);

  if (!success) {
    return sendError(res, `Notification ${id} not found`, 404, 'NOT_FOUND');
  }

  return sendSuccess(res, { read: true }, 'Notification marked as read');
};

