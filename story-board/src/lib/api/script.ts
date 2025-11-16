import apiClient from './client';
import { ApiResponse } from '@/types/api';

export interface Script {
  _id: string;
  projectId: string;
  title: string;
  content: string;
  scenes: ScriptScene[];
  characters: Character[];
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface ScriptScene {
  _id: string;
  sceneNumber: number;
  heading: string;
  location: string;
  timeOfDay: string;
  description: string;
  dialogue: DialogueLine[];
  action: string[];
}

export interface DialogueLine {
  character: string;
  dialogue: string;
  parenthetical?: string;
}

export interface Character {
  _id: string;
  name: string;
  description?: string;
  age?: number;
  gender?: string;
  role: 'lead' | 'supporting' | 'background';
}

export interface CreateScriptData {
  title: string;
  content?: string;
}

export interface UpdateScriptData {
  title?: string;
  content?: string;
  scenes?: ScriptScene[];
  characters?: Character[];
}

export const scriptApi = {
  // Script management
  getScript: async (projectId: string): Promise<ApiResponse<Script>> => {
    const response = await apiClient.get(`/script/projects/${projectId}`);
    return response.data;
  },

  createScript: async (projectId: string, scriptData: CreateScriptData): Promise<ApiResponse<Script>> => {
    const response = await apiClient.post(`/script/projects/${projectId}`, scriptData);
    return response.data;
  },

  updateScript: async (
    projectId: string, 
    scriptData: UpdateScriptData
  ): Promise<ApiResponse<Script>> => {
    const response = await apiClient.put(`/script/projects/${projectId}`, scriptData);
    return response.data;
  },

  deleteScript: async (projectId: string): Promise<ApiResponse> => {
    const response = await apiClient.delete(`/script/projects/${projectId}`);
    return response.data;
  },

  // Scene management
  createScene: async (
    projectId: string, 
    sceneData: Omit<ScriptScene, '_id'>
  ): Promise<ApiResponse<ScriptScene>> => {
    const response = await apiClient.post(`/script/projects/${projectId}/scenes`, sceneData);
    return response.data;
  },

  updateScene: async (
    projectId: string, 
    sceneId: string, 
    sceneData: Partial<ScriptScene>
  ): Promise<ApiResponse<ScriptScene>> => {
    const response = await apiClient.put(`/script/projects/${projectId}/scenes/${sceneId}`, sceneData);
    return response.data;
  },

  deleteScene: async (projectId: string, sceneId: string): Promise<ApiResponse> => {
    const response = await apiClient.delete(`/script/projects/${projectId}/scenes/${sceneId}`);
    return response.data;
  },

  reorderScenes: async (projectId: string, sceneIds: string[]): Promise<ApiResponse<ScriptScene[]>> => {
    const response = await apiClient.put(`/script/projects/${projectId}/scenes/reorder`, { sceneIds });
    return response.data;
  },

  // Character management
  createCharacter: async (
    projectId: string, 
    characterData: Omit<Character, '_id'>
  ): Promise<ApiResponse<Character>> => {
    const response = await apiClient.post(`/script/projects/${projectId}/characters`, characterData);
    return response.data;
  },

  updateCharacter: async (
    projectId: string, 
    characterId: string, 
    characterData: Partial<Character>
  ): Promise<ApiResponse<Character>> => {
    const response = await apiClient.put(`/script/projects/${projectId}/characters/${characterId}`, characterData);
    return response.data;
  },

  deleteCharacter: async (projectId: string, characterId: string): Promise<ApiResponse> => {
    const response = await apiClient.delete(`/script/projects/${projectId}/characters/${characterId}`);
    return response.data;
  },

  // Export and import
  exportScript: async (projectId: string, format: 'pdf' | 'fdx' | 'fountain'): Promise<Blob> => {
    const response = await apiClient.get(`/script/projects/${projectId}/export/${format}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  importScript: async (projectId: string, file: File): Promise<ApiResponse<Script>> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post(
      `/script/projects/${projectId}/import`, 
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  // AI assistance
  generateDialogue: async (
    projectId: string, 
    sceneId: string, 
    context: string
  ): Promise<ApiResponse<{ dialogue: DialogueLine[] }>> => {
    const response = await apiClient.post(`/script/projects/${projectId}/scenes/${sceneId}/generate-dialogue`, {
      context
    });
    return response.data;
  },

  improveDialogue: async (
    projectId: string, 
    dialogue: DialogueLine[], 
    instructions: string
  ): Promise<ApiResponse<{ dialogue: DialogueLine[] }>> => {
    const response = await apiClient.post(`/script/projects/${projectId}/improve-dialogue`, {
      dialogue,
      instructions
    });
    return response.data;
  },
};