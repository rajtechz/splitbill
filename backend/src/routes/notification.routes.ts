import { Router } from 'express';
import { getNotifications, markAsRead } from '../controllers/notification.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();
router.use(requireAuth);
router.get('/', getNotifications);
router.patch('/:id/read', markAsRead);

export default router;

