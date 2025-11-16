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

// Public routes
router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);
router.post('/logout', authController.logout);
router.post('/forgot-password', forgotPasswordValidation, authController.forgotPassword);
router.post('/reset-password', resetPasswordValidation, authController.resetPassword);
router.get('/verify-email/:token', verifyEmailValidation, authController.verifyEmail);
router.post('/resend-verification', resendVerificationValidation, authController.resendVerificationEmail);
router.post('/refresh-token', authController.refreshToken);

// Check authentication status (optional auth)
router.get('/check', optionalAuth, authController.checkAuth);

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