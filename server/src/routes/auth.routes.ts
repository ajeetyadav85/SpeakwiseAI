import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import {
  registerController,
  loginController,
  getMeController,
  googleLoginController,
  refreshTokenController,
  sendVerificationController,
  verifyEmailController,
  forgotPasswordController,
  verifyResetOtpController,
  resetPasswordController,
} from '../controllers/auth.controller.js';
import { authenticateJWT } from '../middlewares/auth.middleware.js';

const router = Router();

// Rate limiters for security against abuse & brute-force
const authAttemptLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per 15 min per IP
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts. Please try again after 15 minutes.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const otpRequestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 6, // 6 OTP requests per 15 min per IP
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many verification code requests. Please wait a few minutes before trying again.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const otpVerifyLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 15, // 15 verify attempts per 15 min per IP
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many verification attempts. Please wait a few minutes before trying again.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Standard Auth Routes
router.post('/register', authAttemptLimiter, registerController);
router.post('/login', authAttemptLimiter, loginController);
router.post('/google', googleLoginController);
router.post('/refresh', refreshTokenController);
router.get('/me', authenticateJWT, getMeController);

// Email Verification Routes
router.post('/send-verification', otpRequestLimiter, sendVerificationController);
router.post('/verify-email', otpVerifyLimiter, verifyEmailController);

// Forgot Password & Reset Routes
router.post('/forgot-password', otpRequestLimiter, forgotPasswordController);
router.post('/verify-reset-otp', otpVerifyLimiter, verifyResetOtpController);
router.post('/reset-password', otpVerifyLimiter, resetPasswordController);

export default router;
