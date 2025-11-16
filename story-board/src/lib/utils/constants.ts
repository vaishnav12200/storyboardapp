export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const APP_NAME = 'CineCore';
export const APP_DESCRIPTION = 'Professional Film Production Management Platform';

export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  PROJECTS: '/projects',
  PROJECT: (id: string) => `/projects/${id}`,
  STORYBOARD: (id: string) => `/projects/${id}/storyboard`,
  SCRIPT: (id: string) => `/projects/${id}/script`,
  SCHEDULE: (id: string) => `/projects/${id}/schedule`,
  BUDGET: (id: string) => `/projects/${id}/budget`,
  LOCATIONS: (id: string) => `/projects/${id}/locations`,
  SHOTLIST: (id: string) => `/projects/${id}/shotlist`,
  EXPORTS: (id: string) => `/projects/${id}/exports`,
} as const;

export const PROJECT_STATUS = {
  DEVELOPMENT: 'development',
  PRE_PRODUCTION: 'pre-production',
  PRODUCTION: 'production',
  POST_PRODUCTION: 'post-production',
  COMPLETED: 'completed',
} as const;

export const USER_ROLES = {
  ADMIN: 'admin',
  DIRECTOR: 'director',
  PRODUCER: 'producer',
  EDITOR: 'editor',
  USER: 'user',
} as const;

export const CAMERA_ANGLES = [
  'wide',
  'medium',
  'close-up',
  'extreme-close-up',
  'overhead',
  'low-angle',
  'high-angle',
] as const;

export const SHOT_TYPES = [
  'establishing',
  'master',
  'two-shot',
  'over-shoulder',
  'insert',
  'cutaway',
] as const;

export const TIME_OF_DAY = [
  'dawn',
  'morning',
  'afternoon',
  'evening',
  'night',
] as const;

export const BUDGET_CATEGORIES = [
  'cast',
  'crew',
  'equipment',
  'location',
  'post-production',
  'miscellaneous',
] as const;

export const LOCATION_TYPES = [
  'studio',
  'outdoor',
  'indoor',
  'green-screen',
] as const;