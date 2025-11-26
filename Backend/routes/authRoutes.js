const express = require('express');
const authController = require('../controllers/authController');
const { protect, restrictTo, optionalAuth } = require('../middleware/authMiddleware');
const {
  registerValidation,
  loginValidation,
  updateProfileValidation,
  changePasswordValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  verifyEmailValidation,
  resendVerificationValidation,
  userIdValidation,
  deleteAccountValidation
} = require('../validators/authValidator');

const router = express.Router();

// Test route
router.post('/test', (req, res) => {
  res.json({ success: true, message: 'Server is working', body: req.body });
});

// Public routes
router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);

// Simple register without validation for testing
router.post('/register-simple', async (req, res) => {
  try {
    console.log('Simple registration request:', req.body);
    const { firstName, lastName, email, password, role = 'user' } = req.body;
    
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }
    
    const User = require('../models/User');
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }
    
    const user = new User({ firstName, lastName, email, password, role });
    await user.save();
    
    const jwt = require('jsonwebtoken');
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: { 
        user: user.toJSON(),
        token
      }
    });
  } catch (error) {
    console.error('Simple registration error:', error);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
});
router.post('/logout', authController.logout);
router.post('/forgot-password', forgotPasswordValidation, authController.forgotPassword);
router.post('/reset-password', resetPasswordValidation, authController.resetPassword);
router.get('/verify-email/:token', verifyEmailValidation, authController.verifyEmail);
router.post('/resend-verification', resendVerificationValidation, authController.resendVerificationEmail);
router.post('/refresh-token', authController.refreshToken);

// Check authentication status (optional auth)
router.get('/check', optionalAuth, authController.checkAuth);

// Verify token endpoint
router.get('/verify', protect, (req, res) => {
  res.status(200).json({
    success: true,
    authenticated: true,
    user: req.user
  });
});

// Removed admin endpoint - use MongoDB Atlas for admin tasks

// Protected routes - require authentication
router.use(protect);

// User profile routes
router.get('/profile', authController.getProfile);
router.patch('/profile', updateProfileValidation, authController.updateProfile);
router.patch('/change-password', changePasswordValidation, authController.changePassword);
router.delete('/delete-account', deleteAccountValidation, authController.deleteAccount);

// Admin only routes
router.use(restrictTo('admin'));
router.get('/users', authController.getAllUsers);
router.patch('/users/:userId/deactivate', userIdValidation, authController.deactivateUser);
router.patch('/users/:userId/reactivate', userIdValidation, authController.reactivateUser);

module.exports = router;