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
  budget?: number;
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
  budget?: number;
}

export interface UpdateProjectData extends Partial<CreateProjectData> {
  status?: 'development' | 'pre-production' | 'production' | 'post-production' | 'completed';
  collaborators?: string[];
}