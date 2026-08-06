import express from 'express';
import {
  register,
  login,
  getMe,
  updateProfile,
  updatePassword,
  forgotPassword,
  resetPassword,
  registerValidation,
  loginValidation
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// --- Public Routes ---
router.post('/register', registerValidation, register);
router.post('/login', loginValidation, login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);

// --- Protected Routes ---
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.put('/update-password', protect, updatePassword);

export default router;
