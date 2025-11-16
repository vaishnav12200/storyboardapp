import apiClient from './client';
import { Budget, BudgetItem } from '@/types/api';
import { ApiResponse } from '@/types/api';

export interface CreateBudgetItemData {
  category: 'cast' | 'crew' | 'equipment' | 'location' | 'post-production' | 'miscellaneous';
  item: string;
  estimatedCost: number;
  actualCost?: number;
  notes?: string;
}

export interface UpdateBudgetItemData extends Partial<CreateBudgetItemData> {
  paid?: boolean;
}

export const budgetApi = {
  // Budget management
  getBudget: async (projectId: string): Promise<ApiResponse<Budget>> => {
    const response = await apiClient.get(`/budget/projects/${projectId}`);
    return response.data;
  },

  createBudget: async (projectId: string): Promise<ApiResponse<Budget>> => {
    const response = await apiClient.post(`/budget/projects/${projectId}`);
    return response.data;
  },

  updateBudget: async (
    projectId: string, 
    budgetData: Partial<Budget>
  ): Promise<ApiResponse<Budget>> => {
    const response = await apiClient.put(`/budget/projects/${projectId}`, budgetData);
    return response.data;
  },

  deleteBudget: async (projectId: string): Promise<ApiResponse> => {
    const response = await apiClient.delete(`/budget/projects/${projectId}`);
    return response.data;
  },

  // Budget items management
  createBudgetItem: async (
    projectId: string, 
    itemData: CreateBudgetItemData
  ): Promise<ApiResponse<BudgetItem>> => {
    const response = await apiClient.post(`/budget/projects/${projectId}/items`, itemData);
    return response.data;
  },

  updateBudgetItem: async (
    projectId: string, 
    itemId: string, 
    itemData: UpdateBudgetItemData
  ): Promise<ApiResponse<BudgetItem>> => {
    const response = await apiClient.put(`/budget/projects/${projectId}/items/${itemId}`, itemData);
    return response.data;
  },

  deleteBudgetItem: async (projectId: string, itemId: string): Promise<ApiResponse> => {
    const response = await apiClient.delete(`/budget/projects/${projectId}/items/${itemId}`);
    return response.data;
  },

  markItemAsPaid: async (projectId: string, itemId: string): Promise<ApiResponse<BudgetItem>> => {
    const response = await apiClient.put(`/budget/projects/${projectId}/items/${itemId}/paid`);
    return response.data;
  },

  // Bulk operations
  importBudgetItems: async (projectId: string, file: File): Promise<ApiResponse<BudgetItem[]>> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post(
      `/budget/projects/${projectId}/items/import`, 
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  duplicateBudgetItem: async (
    projectId: string, 
    itemId: string
  ): Promise<ApiResponse<BudgetItem>> => {
    const response = await apiClient.post(`/budget/projects/${projectId}/items/${itemId}/duplicate`);
    return response.data;
  },

  // Reports and analytics
  getBudgetSummary: async (projectId: string): Promise<ApiResponse<{
    totalEstimated: number;
    totalActual: number;
    totalPaid: number;
    remainingBudget: number;
    categoryBreakdown: Record<string, {
      estimated: number;
      actual: number;
      paid: number;
    }>;
    variance: number;
    variancePercentage: number;
  }>> => {
    const response = await apiClient.get(`/budget/projects/${projectId}/summary`);
    return response.data;
  },

  getBudgetReport: async (
    projectId: string, 
    options: {
      startDate?: string;
      endDate?: string;
      category?: string;
    } = {}
  ): Promise<ApiResponse<{
    items: BudgetItem[];
    totals: {
      estimated: number;
      actual: number;
      paid: number;
    };
    trends: Array<{
      date: string;
      cumulative: number;
    }>;
  }>> => {
    const queryParams = new URLSearchParams();
    if (options.startDate) queryParams.append('startDate', options.startDate);
    if (options.endDate) queryParams.append('endDate', options.endDate);
    if (options.category) queryParams.append('category', options.category);

    const response = await apiClient.get(
      `/budget/projects/${projectId}/report?${queryParams.toString()}`
    );
    return response.data;
  },

  // Budget templates
  getBudgetTemplates: async (): Promise<ApiResponse<Array<{
    _id: string;
    name: string;
    description: string;
    categories: Array<{
      category: string;
      items: Array<{
        item: string;
        estimatedCost: number;
      }>;
    }>;
  }>>> => {
    const response = await apiClient.get('/budget/templates');
    return response.data;
  },

  applyBudgetTemplate: async (
    projectId: string, 
    templateId: string
  ): Promise<ApiResponse<Budget>> => {
    const response = await apiClient.post(`/budget/projects/${projectId}/apply-template/${templateId}`);
    return response.data;
  },

  // Export
  exportBudget: async (
    projectId: string, 
    format: 'pdf' | 'excel' | 'csv'
  ): Promise<Blob> => {
    const response = await apiClient.get(`/budget/projects/${projectId}/export/${format}`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Cost tracking
  addExpense: async (
    projectId: string, 
    itemId: string, 
    expense: {
      amount: number;
      date: string;
      description: string;
      receipt?: File;
    }
  ): Promise<ApiResponse<BudgetItem>> => {
    const formData = new FormData();
    formData.append('amount', expense.amount.toString());
    formData.append('date', expense.date);
    formData.append('description', expense.description);
    if (expense.receipt) {
      formData.append('receipt', expense.receipt);
    }

    const response = await apiClient.post(
      `/budget/projects/${projectId}/items/${itemId}/expenses`, 
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