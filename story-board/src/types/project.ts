export interface Project {
  _id: string;
  title: string;
  description?: string;
  director: string;
  producer?: string;
  genre?: string;
  status: 'development' | 'pre-production' | 'production' | 'post-production' | 'completed';
  startDate?: string;
  endDate?: string;
  budget?: {
    total: number;
    currency: string;
  };
  createdBy: string;
  collaborators: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectData {
  title: string;
  description?: string;
  director: string;
  producer?: string;
  genre?: string;
  startDate?: string;
  endDate?: string;
  budget?: number; // This will be converted to budget.total on the backend
}

export interface UpdateProjectData extends Partial<CreateProjectData> {
  status?: 'development' | 'pre-production' | 'production' | 'post-production' | 'completed';
  collaborators?: string[];
}