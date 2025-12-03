import { z } from 'zod';

// Auth validators
export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  confirmPassword: z.string(),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.enum(['director', 'producer', 'editor', 'user']).optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

// Project validators
export const createProjectSchema = z.object({
  title: z.string().min(1, 'Project title is required').max(100, 'Title is too long'),
  description: z.string().max(500, 'Description is too long').optional(),
  director: z.string().min(1, 'Director name is required'),
  producer: z.string().optional(),
  genre: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  budget: z.number().min(0, 'Budget cannot be negative').optional(),
}).refine((data) => {
  if (data.startDate && data.endDate) {
    return new Date(data.startDate) < new Date(data.endDate);
  }
  return true;
}, {
  message: 'End date must be after start date',
  path: ['endDate'],
});

// Scene validators
export const createSceneSchema = z.object({
  sceneNumber: z.number().min(1, 'Scene number must be positive'),
  title: z.string().min(1, 'Scene title is required').max(100, 'Title is too long'),
  description: z.string().max(1000, 'Description is too long'),
  location: z.string().max(100, 'Location is too long').optional(),
  timeOfDay: z.enum(['dawn', 'morning', 'afternoon', 'evening', 'night']).optional(),
  interior: z.boolean().optional(),
  estimatedDuration: z.number().min(0, 'Duration cannot be negative').optional(),
});

// Panel validators
export const createPanelSchema = z.object({
  panelNumber: z.number().min(1, 'Panel number must be positive'),
  description: z.string().min(1, 'Panel description is required').max(500, 'Description is too long'),
  dialogue: z.string().max(1000, 'Dialogue is too long').optional(),
  cameraAngle: z.enum(['wide', 'medium', 'close-up', 'extreme-close-up', 'overhead', 'low-angle', 'high-angle']).optional(),
  shotType: z.enum(['establishing', 'master', 'two-shot', 'over-shoulder', 'insert', 'cutaway']).optional(),
  duration: z.number().min(0, 'Duration cannot be negative').optional(),
  notes: z.string().max(500, 'Notes are too long').optional(),
});

// Budget validators
export const createBudgetItemSchema = z.object({
  category: z.enum(['cast', 'crew', 'equipment', 'location', 'post-production', 'miscellaneous']),
  item: z.string().min(1, 'Item name is required').max(100, 'Item name is too long'),
  estimatedCost: z.number().min(0, 'Cost cannot be negative'),
  actualCost: z.number().min(0, 'Cost cannot be negative').optional(),
  notes: z.string().max(500, 'Notes are too long').optional(),
});

// Location validators
export const createLocationSchema = z.object({
  name: z.string().min(1, 'Location name is required').max(100, 'Name is too long'),
  address: z.string().min(1, 'Address is required').max(200, 'Address is too long'),
  coordinates: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }).optional(),
  type: z.enum(['studio', 'outdoor', 'indoor', 'green-screen']),
  description: z.string().max(1000, 'Description is too long').optional(),
  availability: z.array(z.string()).optional(),
  cost: z.number().min(0, 'Cost cannot be negative').optional(),
  contact: z.object({
    name: z.string().max(100, 'Name is too long'),
    phone: z.string().max(20, 'Phone number is too long'),
    email: z.string().email('Please enter a valid email').optional(),
  }).optional(),
});

// Schedule validators
export const createScheduleItemSchema = z.object({
  date: z.string().min(1, 'Date is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  sceneNumbers: z.array(z.number().min(1)).min(1, 'At least one scene is required'),
  location: z.string().min(1, 'Location is required').max(100, 'Location is too long'),
  cast: z.array(z.string()).default([]),
  crew: z.array(z.string()).default([]),
  equipment: z.array(z.string()).default([]),
  notes: z.string().max(1000, 'Notes are too long').optional(),
}).refine((data) => {
  const start = new Date(`2000-01-01 ${data.startTime}`);
  const end = new Date(`2000-01-01 ${data.endTime}`);
  return start < end;
}, {
  message: 'End time must be after start time',
  path: ['endTime'],
});

// Shot list validators
export const createShotSchema = z.object({
  shotNumber: z.string().min(1, 'Shot number is required'),
  sceneNumber: z.number().min(1, 'Scene number must be positive'),
  shotType: z.enum(['establishing', 'master', 'two-shot', 'over-shoulder', 'insert', 'cutaway', 'close-up', 'wide']),
  cameraMovement: z.enum(['static', 'pan', 'tilt', 'dolly', 'tracking', 'handheld', 'steadicam']),
  lens: z.string().max(50, 'Lens description is too long').optional(),
  frameRate: z.number().min(1).max(120).optional(),
  duration: z.number().min(0, 'Duration cannot be negative').optional(),
  description: z.string().min(1, 'Description is required').max(500, 'Description is too long'),
  notes: z.string().max(500, 'Notes are too long').optional(),
  equipment: z.array(z.string()).default([]),
  cast: z.array(z.string()).default([]),
  crew: z.array(z.string()).default([]),
  location: z.string().max(100, 'Location is too long').optional(),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  tags: z.array(z.string()).default([]),
});

// Export validators
export const exportOptionsSchema = z.object({
  format: z.enum(['pdf', 'excel', 'csv']),
  includeImages: z.boolean().default(true),
  includeNotes: z.boolean().default(true),
  paperSize: z.enum(['a4', 'letter']).optional(),
});

// File upload validators
export const validateImageFile = (file: File) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const maxSize = 10 * 1024 * 1024; // 10MB

  if (!allowedTypes.includes(file.type)) {
    throw new Error('Only JPEG, PNG, WebP, and GIF images are allowed');
  }

  if (file.size > maxSize) {
    throw new Error('File size cannot exceed 10MB');
  }

  return true;
};

export const validateDocumentFile = (file: File) => {
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ];
  const maxSize = 50 * 1024 * 1024; // 50MB

  if (!allowedTypes.includes(file.type)) {
    throw new Error('Only PDF, Word, Excel, and text files are allowed');
  }

  if (file.size > maxSize) {
    throw new Error('File size cannot exceed 50MB');
  }

  return true;
};

export const validateVideoFile = (file: File) => {
  const allowedTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv'];
  const maxSize = 500 * 1024 * 1024; // 500MB

  if (!allowedTypes.includes(file.type)) {
    throw new Error('Only MP4, AVI, MOV, and WMV videos are allowed');
  }

  if (file.size > maxSize) {
    throw new Error('Video file size cannot exceed 500MB');
  }

  return true;
};

// Form validation helpers
export const validateForm = <T>(schema: z.ZodSchema<T>, data: unknown): { 
  success: boolean; 
  data?: T; 
  errors?: Record<string, string> 
} => {
  try {
    const validData = schema.parse(data);
    return { success: true, data: validData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string> = {};
      error.issues.forEach((err) => {
        if (err.path.length > 0) {
          errors[err.path.join('.')] = err.message;
        }
      });
      return { success: false, errors };
    }
    return { success: false, errors: { general: 'Validation failed' } };
  }
};

// Custom validation functions
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): boolean => {
  // At least 8 characters, one uppercase, one lowercase, one number
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

export const validatePhoneNumber = (phone: string): boolean => {
  // Basic phone number validation (international format)
  const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
};

export const validateURL = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Date validation helpers
export const validateDateRange = (startDate: string, endDate: string): boolean => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return start < end;
};

export const validateFutureDate = (date: string): boolean => {
  const selectedDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return selectedDate >= today;
};

export const validateTimeRange = (startTime: string, endTime: string): boolean => {
  const start = new Date(`2000-01-01 ${startTime}`);
  const end = new Date(`2000-01-01 ${endTime}`);
  return start < end;
};

// Content validation
export const validateScriptContent = (content: string): {
  isValid: boolean;
  warnings: string[];
} => {
  const warnings: string[] = [];
  
  if (content.length < 100) {
    warnings.push('Script seems very short');
  }
  
  if (content.length > 100000) {
    warnings.push('Script is quite long, consider breaking it into parts');
  }
  
  if (!content.includes('FADE IN:') && !content.includes('INT.') && !content.includes('EXT.')) {
    warnings.push('Script might not follow standard screenplay format');
  }
  
  return {
    isValid: true,
    warnings,
  };
};

export const validateBudgetTotal = (items: Array<{ estimatedCost: number }>): {
  total: number;
  warnings: string[];
} => {
  const warnings: string[] = [];
  const total = items.reduce((sum, item) => sum + item.estimatedCost, 0);
  
  if (total === 0) {
    warnings.push('No budget items added');
  }
  
  if (total > 1000000) {
    warnings.push('Budget is quite high, please verify amounts');
  }
  
  return { total, warnings };
};

// Type exports for use in components
export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type CreateProjectFormData = z.infer<typeof createProjectSchema>;
export type CreateSceneFormData = z.infer<typeof createSceneSchema>;
export type CreatePanelFormData = z.infer<typeof createPanelSchema>;
export type CreateBudgetItemFormData = z.infer<typeof createBudgetItemSchema>;
export type CreateLocationFormData = z.infer<typeof createLocationSchema>;
export type CreateScheduleItemFormData = z.infer<typeof createScheduleItemSchema>;
export type CreateShotFormData = z.infer<typeof createShotSchema>;
export type ExportOptionsFormData = z.infer<typeof exportOptionsSchema>;