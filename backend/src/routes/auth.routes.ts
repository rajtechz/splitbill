import { Router } from 'express';
import {
  login,
  register,
  sendOtp,
  verifyOtp,
  refreshToken,
  forgotPassword,
  logout,
} from '../controllers/auth.controller.js';

const router = Router();

router.post('/login', login);
router.post('/register', register);
router.post('/otp/send', sendOtp);
router.post('/otp/verify', verifyOtp);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/logout', logout);

export default router;

