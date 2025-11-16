import { useEffect, useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/lib/store';
import { 
  fetchProjects, 
  fetchProjectById, 
  createProject, 
  updateProject, 
  deleteProject,
  setCurrentProject
} from '@/lib/store/projectsSlice';
import { CreateProjectData, UpdateProjectData } from '@/types/project';
import toast from 'react-hot-toast';

export const useProjects = () => {
  const dispatch = useAppDispatch();
  const { projects, currentProject, isLoading, error, pagination } = useAppSelector(
    (state) => state.projects
  );

  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<{
    status?: string;
    genre?: string;
    dateRange?: { start: string; end: string };
  }>({});

  // Fetch all projects
  const loadProjects = async (params: { 
    page?: number; 
    limit?: number; 
    search?: string;
    status?: string;
    genre?: string;
  } = {}) => {
    try {
      await dispatch(fetchProjects(params)).unwrap();
    } catch (error: any) {
      toast.error(error || 'Failed to load projects');
    }
  };

  // Fetch single project
  const loadProject = async (projectId: string) => {
    try {
      const project = await dispatch(fetchProjectById(projectId)).unwrap();
      return project.data;
    } catch (error: any) {
      toast.error(error || 'Failed to load project');
      throw error;
    }
  };

  // Create new project
  const createNewProject = async (projectData: CreateProjectData) => {
    try {
      const project = await dispatch(createProject(projectData)).unwrap();
      toast.success('Project created successfully!');
      return project.data;
    } catch (error: any) {
      toast.error(error || 'Failed to create project');
      throw error;
    }
  };

  // Update existing project
  const updateExistingProject = async (id: string, data: UpdateProjectData) => {
    try {
      const project = await dispatch(updateProject({ id, data })).unwrap();
      toast.success('Project updated successfully!');
      return project.data;
    } catch (error: any) {
      toast.error(error || 'Failed to update project');
      throw error;
    }
  };

  // Delete project
  const deleteExistingProject = async (projectId: string) => {
    try {
      await dispatch(deleteProject(projectId)).unwrap();
      toast.success('Project deleted successfully!');
    } catch (error: any) {
      toast.error(error || 'Failed to delete project');
      throw error;
    }
  };

  // Filter projects locally
  const filteredProjects = projects.filter(project => {
    const matchesSearch = searchTerm === '' || 
      project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      project.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !filters.status || project.status === filters.status;
    const matchesGenre = !filters.genre || project.genre === filters.genre;
    
    return matchesSearch && matchesStatus && matchesGenre;
  });

  // Set current project
  const selectProject = (projectId: string) => {
    const project = projects.find(p => p._id === projectId);
    if (project) {
      dispatch(setCurrentProject(project));
    }
  };

  // Clear current project
  const clearCurrentProject = () => {
    dispatch(setCurrentProject(null));
  };

  // Project statistics
  const getProjectStats = () => {
    const total = projects.length;
    const byStatus = projects.reduce((acc, project) => {
      acc[project.status] = (acc[project.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const totalBudget = projects.reduce((sum, project) => sum + (project.budget || 0), 0);
    
    return {
      total,
      byStatus,
      totalBudget,
      active: byStatus['production'] || 0 + byStatus['pre-production'] || 0,
      completed: byStatus['completed'] || 0,
    };
  };

  return {
    // State
    projects: filteredProjects,
    currentProject,
    isLoading,
    error,
    pagination,
    searchTerm,
    filters,
    
    // Actions
    loadProjects,
    loadProject,
    createNewProject,
    updateExistingProject,
    deleteExistingProject,
    selectProject,
    clearCurrentProject,
    
    // Filters
    setSearchTerm,
    setFilters,
    
    // Utils
    getProjectStats,
  };
};

export const useCurrentProject = (projectId?: string) => {
  const dispatch = useAppDispatch();
  const { currentProject, isLoading } = useAppSelector((state) => state.projects);

  useEffect(() => {
    if (projectId && (!currentProject || currentProject._id !== projectId)) {
      dispatch(fetchProjectById(projectId));
    }
  }, [dispatch, projectId, currentProject]);

  return {
    project: currentProject,
    isLoading,
  };
};