import apiClient from './client';
import { Scene, StoryboardPanel, CreateSceneData, CreatePanelData, GenerateImageRequest } from '@/types/storyboard';
import { ApiResponse } from '@/types/api';

export const storyboardApi = {
  // Scene management
  getScenes: async (projectId: string): Promise<ApiResponse<Scene[]>> => {
    const response = await apiClient.get(`/storyboard/projects/${projectId}/scenes`);
    return response.data;
  },

  getScene: async (projectId: string, sceneId: string): Promise<ApiResponse<Scene>> => {
    const response = await apiClient.get(`/storyboard/projects/${projectId}/scenes/${sceneId}`);
    return response.data;
  },

  createScene: async (projectId: string, sceneData: CreateSceneData): Promise<ApiResponse<Scene>> => {
    const response = await apiClient.post(`/storyboard/projects/${projectId}/scenes`, sceneData);
    return response.data;
  },

  updateScene: async (
    projectId: string, 
    sceneId: string, 
    sceneData: Partial<CreateSceneData>
  ): Promise<ApiResponse<Scene>> => {
    const response = await apiClient.put(`/storyboard/projects/${projectId}/scenes/${sceneId}`, sceneData);
    return response.data;
  },

  deleteScene: async (projectId: string, sceneId: string): Promise<ApiResponse> => {
    const response = await apiClient.delete(`/storyboard/projects/${projectId}/scenes/${sceneId}`);
    return response.data;
  },

  // Panel management
  createPanel: async (
    projectId: string, 
    sceneId: string, 
    panelData: CreatePanelData
  ): Promise<ApiResponse<StoryboardPanel>> => {
    const response = await apiClient.post(
      `/storyboard/scenes/${sceneId}/panels`, 
      panelData
    );
    return response.data;
  },

  updatePanel: async (
    projectId: string, 
    sceneId: string, 
    panelId: string, 
    panelData: Partial<CreatePanelData>
  ): Promise<ApiResponse<StoryboardPanel>> => {
    const response = await apiClient.put(
      `/storyboard/scenes/${sceneId}/panels/${panelId}`, 
      panelData
    );
    return response.data;
  },

  deletePanel: async (
    projectId: string, 
    sceneId: string, 
    panelId: string
  ): Promise<ApiResponse> => {
    const response = await apiClient.delete(
      `/storyboard/scenes/${sceneId}/panels/${panelId}`
    );
    return response.data;
  },

  // reorderPanels: async (
  //   projectId: string, 
  //   sceneId: string, 
  //   panelIds: string[]
  // ): Promise<ApiResponse<StoryboardPanel[]>> => {
  //   // Route not implemented in backend yet
  //   const response = await apiClient.put(
  //     `/storyboard/scenes/${sceneId}/panels/reorder`, 
  //     { panelIds }
  //   );
  //   return response.data;
  // },

  // AI Image generation
  generateImage: async (imageRequest: GenerateImageRequest): Promise<ApiResponse<{ imageUrl: string }>> => {
    const response = await apiClient.post(
      `/storyboard/scenes/${imageRequest.sceneId}/panels/${imageRequest.panelId}/generate-image`,
      {
        prompt: imageRequest.prompt,
        style: imageRequest.style || 'realistic'
      }
    );
    return response.data;
  },

  // Bulk operations
  duplicateScene: async (projectId: string, sceneId: string): Promise<ApiResponse<Scene>> => {
    const response = await apiClient.post(`/storyboard/projects/${projectId}/scenes/${sceneId}/duplicate`);
    return response.data;
  },

  importScenes: async (projectId: string, file: File): Promise<ApiResponse<Scene[]>> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post(
      `/storyboard/projects/${projectId}/scenes/import`, 
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },
};