import User from '../models/User.js';
import { body, validationResult } from 'express-validator';
import nodemailer from 'nodemailer';
import bcrypt from 'bcryptjs';
import { analyzeProfile } from '../utils/aiService.js';


// Lazy transporter factory — created at call time so process.env is already loaded
// (In ESM, module-level code runs before dotenv.config(), so env vars would be undefined)
const getTransporter = () => nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});


// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
export const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { name, email, password, role, phone, company } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create user object
    const userData = {
      name,
      email,
      password,
      role: role || 'candidate',
      phone
    };

    // Add company info if recruiter
    if (role === 'recruiter' && company) {
      userData.company = company;
    }

    // Create user
    const user = await User.create(userData);

    // Generate token
    const token = user.generateToken();

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
        ...(role === 'recruiter' && { company: user.company })
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering user',
      error: error.message
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isPasswordMatch = await user.comparePassword(password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = user.generateToken();

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
        ...(user.role === 'recruiter' && { company: user.company }),
        ...(user.role === 'candidate' && { profile: user.profile })
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: error.message
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
        ...(user.role === 'recruiter' && { company: user.company }),
        ...(user.role === 'candidate' && { profile: user.profile }),
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching user data',
      error: error.message
    });
  }
};

// @desc    Update user profile
// @route   PUT /api/auth/profile
// @access  Private
export const updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const { name, phone, avatar, profile, company } = req.body;

    // Update common fields
    if (name) user.name = name;
    if (phone) user.phone = phone;
    if (avatar) user.avatar = avatar;

    // Update role-specific fields
    if (user.role === 'candidate' && profile) {
      // Validate resume size (if provided as base64)
      if (profile.resume && profile.resume.startsWith('data:')) {
        if (profile.resume.length > 7.5 * 1024 * 1024) {
          return res.status(400).json({
            success: false,
            message: 'Resume file is too large. Maximum size allowed is 5MB.'
          });
        }
      }

      // Initialize profile object if it doesn't exist
      if (!user.profile) {
        user.profile = {};
      }

      // Merge profile fields explicitly - this ensures Mongoose detects the nested changes
      Object.keys(profile).forEach(key => {
        user.profile[key] = profile[key];
      });

      user.markModified('profile');

      // (AI Extraction Enhancement) 
      // Perform background profile/resume analysis for future skill matching
      try {
        const extracted = await analyzeProfile(user.profile);

        user.profile.aiAnalysis = {
          extractedSkills: extracted.extractedSkills || [],
          summary: extracted.summary || user.profile.bio,
          isProcessed: true,
          lastProcessed: new Date()
        };

      } catch (aiErr) {
        // AI extraction is an enhancement, we don't block profile updates on its failure
      }
    }

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
        ...(user.role === 'recruiter' && { company: user.company }),
        ...(user.role === 'candidate' && { profile: user.profile })
      }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};

// @desc    Update password
// @route   PUT /api/auth/update-password
// @access  Private
export const updatePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Find user by ID and include password field for comparison
    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    // Update password (pre-save hook in User model will handle hashing)
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating password',
      error: error.message
    });
  }
};

// Validation middleware
export const registerValidation = [
  body('name').trim().notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('role').isIn(['candidate', 'recruiter']).withMessage('Role must be either candidate or recruiter')
];

export const loginValidation = [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
];

// @desc    Forgot Password - Send OTP
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ success: false, message: 'No account found with that email address.' });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpires = Date.now() + 10 * 60 * 1000; // 10 minutes

    // Use updateOne to avoid triggering the pre-save password hash hook
    await User.updateOne({ email }, { otp, otpExpires });

    const transporter = getTransporter();
    await transporter.sendMail({
      from: `"TalentBridge Security" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: 'Your TalentBridge Password Reset Code',
      html: `
        <div style="font-family: 'Inter', sans-serif; background: #f8fafc; padding: 40px; border: 1px solid #e2e8f0; border-radius: 2rem; max-width: 500px; margin: auto;">
          <h1 style="color: #0f172a; font-weight: 900; letter-spacing: -2px; margin: 0 0 8px;">Talent<span style="color: #2563eb">Bridge</span></h1>
          <p style="color: #64748b;">A password reset was requested for: <strong>${email}</strong></p>
          <div style="background: #0f172a; color: white; padding: 32px; border-radius: 1.5rem; text-align: center; margin: 32px 0;">
            <p style="letter-spacing: 4px; font-size: 10px; text-transform: uppercase; opacity: 0.6; margin: 0 0 12px;">Your One-Time Passcode</p>
            <h2 style="font-size: 40px; letter-spacing: 12px; margin: 0; font-weight: 900;">${otp}</h2>
          </div>
          <p style="color: #94a3b8; font-size: 12px;">This code expires in 10 minutes. If you didn't request this, please ignore this email.</p>
        </div>
      `
    });

    res.json({ success: true, message: 'Password reset code sent to your email.' });
  } catch (error) {
    console.error('[Forgot Password Error]', error.message);
    console.error('[Full Error]', error);
    res.status(500).json({ success: false, message: 'Failed to send reset email. Please try again.', debug: error.message });
  }
};

// @desc    Reset Password - Verify OTP & Set New Password
// @route   POST /api/auth/reset-password
// @access  Public
export const resetPassword = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  try {
    const user = await User.findOne({
      email,
      otp,
      otpExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset code.' });
    }

    // Hash the new password manually then use updateOne to avoid double-hashing
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    await User.updateOne(
      { email },
      { password: hashedPassword, otp: undefined, otpExpires: undefined }
    );

    res.json({ success: true, message: 'Password updated successfully. Please sign in.' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'Failed to reset password. Please try again.' });
  }
};
