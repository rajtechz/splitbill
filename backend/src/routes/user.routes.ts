import { Router } from 'express';
import { getMe, updateMe } from '../controllers/user.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';

const router = Router();

router.use(requireAuth);
router.get('/me', getMe);
router.patch('/me', updateMe);

export default router;

