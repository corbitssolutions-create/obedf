import express from 'express';
import {
  login,
  logout,
  getMe,
  changePassword,
  forgotPassword,
  resetPassword,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';
import {
  validateLogin,
  validateChangePassword,
  validateForgotPassword,
  validateResetPassword,
} from '../validations/auth.validation.js';

const router = express.Router();

// Public routes
router.post('/login', validateLogin, login);
router.post('/forgot-password', validateForgotPassword, forgotPassword);
router.post('/reset-password', validateResetPassword, resetPassword);

// Protected routes (require JWT verification)
router.post('/logout', protect, logout);
router.get('/me', protect, getMe);
router.post('/change-password', protect, validateChangePassword, changePassword);

export default router;
