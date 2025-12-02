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
  title: string;
  description?: string;
  type: 'shooting' | 'pre-production' | 'post-production' | 'meeting' | 'other';
  date: string;
  timeSlot: {
    startTime: string;
    endTime: string;
    duration: number;
  };
  location?: {
    name: string;
    address?: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
    notes?: string;
  };
  scenes?: Array<{
    scene: string;
    estimatedDuration?: number;
    status?: 'not-started' | 'in-progress' | 'completed' | 'postponed' | 'cancelled';
    notes?: string;
    actualStartTime?: string;
    actualEndTime?: string;
  }>;
  crew?: Array<{
    member: string;
    role: string;
    callTime?: string;
    wrapTime?: string;
    status?: 'confirmed' | 'pending' | 'declined' | 'absent';
    notes?: string;
  }>;
  cast?: Array<{
    name: string;
    character?: string;
    contact?: string;
    callTime?: string;
    wrapTime?: string;
    costume?: string;
    makeup?: string;
    status?: 'confirmed' | 'pending' | 'declined' | 'absent';
    notes?: string;
  }>;
  equipment?: Array<{
    name: string;
    category?: 'camera' | 'lens' | 'lighting' | 'audio' | 'grip' | 'other';
    quantity?: number;
    supplier?: string;
    pickupTime?: string;
    returnTime?: string;
    status?: 'reserved' | 'confirmed' | 'picked-up' | 'returned' | 'cancelled';
    notes?: string;
  }>;
  status: 'draft' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'postponed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  notes?: string;
  contingencyPlan?: string;
  emergencyContacts?: Array<{
    name: string;
    role: string;
    phone: string;
    email: string;
  }>;
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
    uploadedAt: string;
  }>;
  weather?: {
    condition?: string;
    temperature?: number;
    humidity?: number;
    windSpeed?: number;
    notes?: string;
  };
  budget?: {
    estimated: number;
    actual?: number;
    breakdown?: Array<{
      item: string;
      category: string;
      amount: number;
      notes?: string;
    }>;
  };
  createdBy: string;
  lastModifiedBy?: string;
  createdAt: string;
  updatedAt: string;
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