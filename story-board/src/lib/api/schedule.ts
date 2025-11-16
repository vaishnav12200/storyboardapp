import apiClient from './client';
import { Schedule, ScheduleItem } from '@/types/api';
import { ApiResponse } from '@/types/api';

export interface CreateScheduleItemData {
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

export interface UpdateScheduleItemData extends Partial<CreateScheduleItemData> {}

export const scheduleApi = {
  // Schedule management
  getSchedule: async (projectId: string): Promise<ApiResponse<Schedule>> => {
    const response = await apiClient.get(`/schedule/projects/${projectId}`);
    return response.data;
  },

  createSchedule: async (projectId: string): Promise<ApiResponse<Schedule>> => {
    const response = await apiClient.post(`/schedule/projects/${projectId}`);
    return response.data;
  },

  updateSchedule: async (
    projectId: string, 
    scheduleData: Partial<Schedule>
  ): Promise<ApiResponse<Schedule>> => {
    const response = await apiClient.put(`/schedule/projects/${projectId}`, scheduleData);
    return response.data;
  },

  deleteSchedule: async (projectId: string): Promise<ApiResponse> => {
    const response = await apiClient.delete(`/schedule/projects/${projectId}`);
    return response.data;
  },

  // Schedule items management
  createScheduleItem: async (
    projectId: string, 
    itemData: CreateScheduleItemData
  ): Promise<ApiResponse<ScheduleItem>> => {
    const response = await apiClient.post(`/schedule/projects/${projectId}/items`, itemData);
    return response.data;
  },

  updateScheduleItem: async (
    projectId: string, 
    itemId: string, 
    itemData: UpdateScheduleItemData
  ): Promise<ApiResponse<ScheduleItem>> => {
    const response = await apiClient.put(`/schedule/projects/${projectId}/items/${itemId}`, itemData);
    return response.data;
  },

  deleteScheduleItem: async (projectId: string, itemId: string): Promise<ApiResponse> => {
    const response = await apiClient.delete(`/schedule/projects/${projectId}/items/${itemId}`);
    return response.data;
  },

  reorderScheduleItems: async (
    projectId: string, 
    itemIds: string[]
  ): Promise<ApiResponse<ScheduleItem[]>> => {
    const response = await apiClient.put(`/schedule/projects/${projectId}/items/reorder`, { itemIds });
    return response.data;
  },

  // Bulk operations
  duplicateScheduleItem: async (
    projectId: string, 
    itemId: string
  ): Promise<ApiResponse<ScheduleItem>> => {
    const response = await apiClient.post(`/schedule/projects/${projectId}/items/${itemId}/duplicate`);
    return response.data;
  },

  // Conflict detection
  checkConflicts: async (
    projectId: string, 
    itemData: CreateScheduleItemData
  ): Promise<ApiResponse<{ conflicts: any[] }>> => {
    const response = await apiClient.post(`/schedule/projects/${projectId}/check-conflicts`, itemData);
    return response.data;
  },

  // Auto-scheduling
  generateSchedule: async (
    projectId: string, 
    preferences: {
      startDate: string;
      endDate: string;
      workingDays: string[];
      hoursPerDay: number;
      bufferTime: number;
    }
  ): Promise<ApiResponse<Schedule>> => {
    const response = await apiClient.post(`/schedule/projects/${projectId}/generate`, preferences);
    return response.data;
  },

  // Calendar integration
  getCalendarEvents: async (
    projectId: string, 
    startDate: string, 
    endDate: string
  ): Promise<ApiResponse<any[]>> => {
    const response = await apiClient.get(
      `/schedule/projects/${projectId}/calendar?start=${startDate}&end=${endDate}`
    );
    return response.data;
  },

  // Export
  exportSchedule: async (
    projectId: string, 
    format: 'pdf' | 'excel' | 'ical'
  ): Promise<Blob> => {
    const response = await apiClient.get(`/schedule/projects/${projectId}/export/${format}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Reports
  getScheduleReport: async (projectId: string): Promise<ApiResponse<{
    totalDays: number;
    totalScenes: number;
    locationBreakdown: Record<string, number>;
    castUtilization: Record<string, number>;
    crewUtilization: Record<string, number>;
  }>> => {
    const response = await apiClient.get(`/schedule/projects/${projectId}/report`);
    return response.data;
  },
};