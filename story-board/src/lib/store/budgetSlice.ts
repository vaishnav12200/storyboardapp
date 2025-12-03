import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ApiResponse } from '@/types/api';
import apiClient from '@/lib/api/client';

interface BudgetItem {
  _id?: string;
  id?: string;
  name: string;
  category: 'above-line' | 'below-line' | 'post-production' | 'contingency';
  subcategory?: string;
  description?: string;
  unitType: 'flat' | 'daily' | 'weekly' | 'hourly' | 'per-unit';
  quantity: number;
  unitCost: number;
  totalCost: number;
  vendor?: {
    name: string;
    contact?: string;
    email?: string;
    phone?: string;
  };
  paymentSchedule?: Array<{
    date: string;
    amount: number;
    status: 'pending' | 'paid' | 'overdue';
  }>;
  notes?: string;
  attachments?: Array<{
    name: string;
    url: string;
    type: string;
  }>;
  status: 'planned' | 'approved' | 'ordered' | 'received' | 'paid';
  createdAt?: string;
  updatedAt?: string;
}

interface Budget {
  _id: string;
  projectId: string;
  name: string;
  version: string;
  items: BudgetItem[];
  summary: {
    totalAboveLine: number;
    totalBelowLine: number;
    totalPostProduction: number;
    contingencyAmount: number;
    grandTotal: number;
    currency: string;
  };
  settings: {
    contingencyPercentage: number;
    taxRate: number;
    currency: string;
    showDetailed: boolean;
  };
  approval: {
    status: 'draft' | 'submitted' | 'approved' | 'rejected';
    approvedBy?: string;
    approvedDate?: string;
    notes?: string;
  };
  tracking: {
    spent: number;
    committed: number;
    remaining: number;
    variance: number;
    lastUpdated: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface BudgetState {
  budget: Budget | null;
  items: BudgetItem[];
  isLoading: boolean;
  error: string | null;
}

const initialState: BudgetState = {
  budget: null,
  items: [],
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchBudget = createAsyncThunk(
  'budget/fetchBudget',
  async (projectId: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/budget/projects/${projectId}`);
      return response.data as ApiResponse<Budget>;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch budget');
    }
  }
);

export const createBudgetItem = createAsyncThunk(
  'budget/createItem',
  async ({ 
    projectId, 
    itemData 
  }: { 
    projectId: string; 
    itemData: Omit<BudgetItem, '_id' | 'id' | 'createdAt' | 'updatedAt'>;
  }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(`/budget/projects/${projectId}/items`, itemData);
      return response.data as ApiResponse<BudgetItem>;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to create budget item');
    }
  }
);

export const updateBudgetItem = createAsyncThunk(
  'budget/updateItem',
  async ({ 
    projectId,
    itemId, 
    itemData 
  }: { 
    projectId: string;
    itemId: string;
    itemData: Partial<BudgetItem>;
  }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put(`/budget/projects/${projectId}/items/${itemId}`, itemData);
      return response.data as ApiResponse<BudgetItem>;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to update budget item');
    }
  }
);

export const deleteBudgetItem = createAsyncThunk(
  'budget/deleteItem',
  async ({ 
    projectId,
    itemId
  }: { 
    projectId: string;
    itemId: string;
  }, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/budget/projects/${projectId}/items/${itemId}`);
      return itemId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to delete budget item');
    }
  }
);

export const updateBudget = createAsyncThunk(
  'budget/updateBudget',
  async ({ 
    projectId, 
    budgetData 
  }: { 
    projectId: string; 
    budgetData: Partial<Budget>;
  }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put(`/budget/projects/${projectId}`, budgetData);
      return response.data as ApiResponse<Budget>;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to update budget');
    }
  }
);

const budgetSlice = createSlice({
  name: 'budget',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setBudget: (state, action: PayloadAction<Budget | null>) => {
      state.budget = action.payload;
      state.items = action.payload?.items || [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch budget
      .addCase(fetchBudget.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchBudget.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.data) {
          state.budget = action.payload.data;
          state.items = action.payload.data.items || [];
        }
      })
      .addCase(fetchBudget.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create budget item
      .addCase(createBudgetItem.fulfilled, (state, action) => {
        if (action.payload.data) {
          state.items.push(action.payload.data);
          if (state.budget) {
            state.budget.items.push(action.payload.data);
          }
        }
      })
      // Update budget item
      .addCase(updateBudgetItem.fulfilled, (state, action) => {
        if (action.payload.data) {
          const updatedItem = action.payload.data;
          const index = state.items.findIndex(item => item._id === updatedItem._id);
          if (index !== -1) {
            state.items[index] = updatedItem;
          }
          if (state.budget) {
            const budgetIndex = state.budget.items.findIndex(item => item._id === updatedItem._id);
            if (budgetIndex !== -1) {
              state.budget.items[budgetIndex] = updatedItem;
            }
          }
        }
      })
      // Delete budget item
      .addCase(deleteBudgetItem.fulfilled, (state, action) => {
        const itemId = action.payload;
        state.items = state.items.filter(item => item._id !== itemId);
        if (state.budget) {
          state.budget.items = state.budget.items.filter(item => item._id !== itemId);
        }
      })
      // Update budget
      .addCase(updateBudget.fulfilled, (state, action) => {
        if (action.payload.data) {
          state.budget = action.payload.data;
          state.items = action.payload.data.items || [];
        }
      });
  },
});

export const { clearError, setBudget } = budgetSlice.actions;
export default budgetSlice.reducer;