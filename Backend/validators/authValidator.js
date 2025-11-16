const { body, param } = require('express-validator');

// Validation rules for user registration
const registerValidation = [
  body('firstName')
    .notEmpty()
    .withMessage('First name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters and spaces')
    .trim(),

  body('lastName')
    .notEmpty()
    .withMessage('Last name is required')
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters and spaces')
    .trim(),

  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
    .isLength({ max: 100 })
    .withMessage('Email cannot be more than 100 characters'),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6, max: 128 })
    .withMessage('Password must be between 6 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),

  body('role')
    .optional()
    .isIn(['user', 'director', 'producer', 'admin'])
    .withMessage('Invalid role specified')
];

// Validation rules for user login
const loginValidation = [
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),

  body('password')
    .notEmpty()
    .withMessage('Password is required'),

  body('rememberMe')
    .optional()
    .isBoolean()
    .withMessage('Remember me must be a boolean value')
];

// Validation rules for profile update
const updateProfileValidation = [
  body('firstName')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('First name can only contain letters and spaces')
    .trim(),

  body('lastName')
    .optional()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Last name can only contain letters and spaces')
    .trim(),

  body('bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Bio cannot be more than 500 characters')
    .trim(),

  body('company')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Company name cannot be more than 100 characters')
    .trim(),

  body('phone')
    .optional()
    .matches(/^\+?[1-9]\d{1,14}$/)
    .withMessage('Please provide a valid phone number'),

  body('profileImage')
    .optional()
    .isURL()
    .withMessage('Profile image must be a valid URL'),

  body('preferences.theme')
    .optional()
    .isIn(['light', 'dark'])
    .withMessage('Theme must be either light or dark'),

  body('preferences.language')
    .optional()
    .isLength({ min: 2, max: 5 })
    .withMessage('Language code must be between 2 and 5 characters'),

  body('preferences.notifications.email')
    .optional()
    .isBoolean()
    .withMessage('Email notifications preference must be a boolean'),

  body('preferences.notifications.push')
    .optional()
    .isBoolean()
    .withMessage('Push notifications preference must be a boolean')
];

// Validation rules for password change
const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),

  body('newPassword')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 6, max: 128 })
    .withMessage('New password must be between 6 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, and one number'),

  body('confirmPassword')
    .notEmpty()
    .withMessage('Password confirmation is required')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('Password confirmation does not match new password');
      }
      return true;
    })
];

// Validation rules for forgot password
const forgotPasswordValidation = [
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
];

// Validation rules for reset password
const resetPasswordValidation = [
  body('token')
    .notEmpty()
    .withMessage('Reset token is required')
    .isLength({ min: 64, max: 64 })
    .withMessage('Invalid reset token format'),

  body('password')
    .notEmpty()
    .withMessage('New password is required')
    .isLength({ min: 6, max: 128 })
    .withMessage('Password must be between 6 and 128 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),

  body('confirmPassword')
    .notEmpty()
    .withMessage('Password confirmation is required')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Password confirmation does not match password');
      }
      return true;
    })
];

// Validation rules for email verification
const verifyEmailValidation = [
  param('token')
    .notEmpty()
    .withMessage('Verification token is required')
    .isLength({ min: 64, max: 64 })
    .withMessage('Invalid verification token format')
];

// Validation rules for resending verification email
const resendVerificationValidation = [
  body('email')
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail()
];

// Validation rules for user ID parameter
const userIdValidation = [
  param('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isMongoId()
    .withMessage('Invalid user ID format')
];

// Validation rules for admin user search
const userSearchValidation = [
  body('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),

  body('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),

  body('search')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Search term cannot be more than 100 characters')
    .trim(),

  body('role')
    .optional()
    .isIn(['user', 'director', 'producer', 'admin'])
    .withMessage('Invalid role filter')
];

// Validation rules for account deletion
const deleteAccountValidation = [
  body('password')
    .notEmpty()
    .withMessage('Password is required to delete account'),

  body('confirmation')
    .notEmpty()
    .withMessage('Confirmation is required')
    .equals('DELETE')
    .withMessage('Please type DELETE to confirm account deletion')
];

// Custom validation middleware for file uploads
const profileImageValidation = [
  body('profileImage')
    .optional()
    .custom((value, { req }) => {
      if (req.file) {
        // Check file type
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(req.file.mimetype)) {
          throw new Error('Only JPEG, PNG, GIF, and WebP images are allowed');
        }

        // Check file size (5MB max)
        const maxSize = 5 * 1024 * 1024; // 5MB in bytes
        if (req.file.size > maxSize) {
          throw new Error('Image size cannot exceed 5MB');
        }
      }
      return true;
    })
];

// Validation for API key
const apiKeyValidation = [
  body('name')
    .notEmpty()
    .withMessage('API key name is required')
    .isLength({ min: 3, max: 50 })
    .withMessage('API key name must be between 3 and 50 characters')
    .trim(),

  body('permissions')
    .isArray()
    .withMessage('Permissions must be an array')
    .notEmpty()
    .withMessage('At least one permission is required'),

  body('permissions.*')
    .isIn(['read', 'write', 'delete'])
    .withMessage('Invalid permission specified'),

  body('expiresIn')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Expiry must be between 1 and 365 days')
];

// Validation for two-factor authentication setup
const twoFactorSetupValidation = [
  body('secret')
    .notEmpty()
    .withMessage('2FA secret is required')
    .isBase32()
    .withMessage('Invalid 2FA secret format'),

  body('token')
    .notEmpty()
    .withMessage('2FA token is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('2FA token must be 6 digits')
    .isNumeric()
    .withMessage('2FA token must contain only numbers')
];

// Validation for two-factor authentication verification
const twoFactorVerifyValidation = [
  body('token')
    .notEmpty()
    .withMessage('2FA token is required')
    .isLength({ min: 6, max: 6 })
    .withMessage('2FA token must be 6 digits')
    .isNumeric()
    .withMessage('2FA token must contain only numbers')
];

module.exports = {
  registerValidation,
  loginValidation,
  updateProfileValidation,
  changePasswordValidation,
  forgotPasswordValidation,
  resetPasswordValidation,
  verifyEmailValidation,
  resendVerificationValidation,
  userIdValidation,
  userSearchValidation,
  deleteAccountValidation,
  profileImageValidation,
  apiKeyValidation,
  twoFactorSetupValidation,
  twoFactorVerifyValidation
};