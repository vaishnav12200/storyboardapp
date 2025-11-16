export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message: string;
  error?: string;
}

export interface PaginatedResponse<T = any> {
  success: boolean;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
  message: string;
}

export interface ApiError {
  success: false;
  message: string;
  error: string;
  statusCode: number;
}

// Budget types
export interface BudgetItem {
  _id: string;
  category: 'cast' | 'crew' | 'equipment' | 'location' | 'post-production' | 'miscellaneous';
  item: string;
  estimatedCost: number;
  actualCost?: number;
  paid: boolean;
  notes?: string;
}

export interface Budget {
  _id: string;
  projectId: string;
  items: BudgetItem[];
  totalEstimated: number;
  totalActual: number;
  createdAt: string;
  updatedAt: string;
}

// Schedule types
export interface ScheduleItem {
  _id: string;
  date: string;
  startTime: string;
  endTime: string;
  sceneNumbers: number[];
  location: string;
  cast: string[];
  crew: string[];
  equipment: string[];
  notes?: string;
}

export interface Schedule {
  _id: string;
  projectId: string;
  items: ScheduleItem[];
  createdAt: string;
  updatedAt: string;
}

// Location types
export interface Location {
  _id: string;
  name: string;
  address: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  type: 'studio' | 'outdoor' | 'indoor' | 'green-screen';
  description?: string;
  availability: string[];
  cost?: number;
  contact?: {
    name: string;
    phone: string;
    email: string;
  };
  images?: string[];
  projectId: string;
}

// Export types
export interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv';
  includeImages: boolean;
  includeNotes: boolean;
  paperSize?: 'a4' | 'letter';
}