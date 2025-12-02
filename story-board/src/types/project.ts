export interface Project {
  _id: string;
  title: string;
  description?: string;
  type?: string;
  director?: string;
  producer?: string;
  genre?: string;
  status: 'planning' | 'pre-production' | 'production' | 'post-production' | 'completed' | 'cancelled';
  priority?: string;
  startDate?: string;
  endDate?: string;
  budget?: {
    total: number;
    currency: string;
  };
  owner?: any;
  createdBy?: string;
  collaborators?: any[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectData {
  title: string;
  description?: string;
  type?: string;
  director?: string;
  producer?: string;
  genre?: string;
  startDate?: string;
  endDate?: string;
  budget?: number; // This will be converted to budget.total on the backend
}

export interface UpdateProjectData extends Partial<CreateProjectData> {
  status?: 'planning' | 'pre-production' | 'production' | 'post-production' | 'completed' | 'cancelled';
  collaborators?: string[];
}