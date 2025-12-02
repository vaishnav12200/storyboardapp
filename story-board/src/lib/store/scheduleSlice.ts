import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Schedule, ScheduleItem } from '@/types/api';
import { ApiResponse } from '@/types/api';
import apiClient from '@/lib/api/client';

interface ScheduleState {
  schedule: Schedule | null;
  items: ScheduleItem[];
  isLoading: boolean;
  error: string | null;
}

const initialState: ScheduleState = {
  schedule: null,
  items: [],
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchSchedule = createAsyncThunk(
  'schedule/fetchSchedule',
  async (projectId: string, { rejectWithValue }) => {
    try {
      console.log('Fetching schedule for project:', projectId);
      const response = await apiClient.get(`/schedule/projects/${projectId}/schedules`);
      console.log('Schedule fetch response:', response.data);
      const apiResponse = response.data as ApiResponse<{ schedules: any[] }>;
      return apiResponse.data?.schedules || [];
    } catch (error: any) {
      console.error('Schedule fetch error:', {
        error: error.response?.data || error.message,
        status: error.response?.status,
        projectId
      });
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch schedule');
    }
  }
);

export const createScheduleItem = createAsyncThunk(
  'schedule/createItem',
  async ({ 
    projectId, 
    itemData 
  }: { 
    projectId: string; 
    itemData: {
      title: string;
      type: string;
      date: string;
      startTime: string;
      endTime: string;
      duration: number;
      location: string;
    }
  }, { rejectWithValue }) => {
    try {
      // Transform the data to match backend Schedule model
      const scheduleData = {
        title: itemData.title,
        type: itemData.type === 'scene' ? 'shooting' : 'other',
        date: itemData.date,
        timeSlot: {
          startTime: itemData.startTime,
          endTime: itemData.endTime,
          duration: itemData.duration
        },
        location: {
          name: itemData.location
        },
        description: `${itemData.type} event`,
        status: 'draft',
        priority: 'medium'
      };
      
      console.log('Creating schedule item:', {
        projectId,
        scheduleData,
        endpoint: `/schedule/projects/${projectId}/schedules`
      });
      
      const response = await apiClient.post(`/schedule/projects/${projectId}/schedules`, scheduleData);
      console.log('Schedule creation response:', response.data);
      return response.data as ApiResponse<ScheduleItem>;
    } catch (error: any) {
      console.error('Schedule creation error:', {
        error: error.response?.data || error.message,
        status: error.response?.status,
        projectId,
        itemData
      });
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to create schedule item');
    }
  }
);

export const updateScheduleItem = createAsyncThunk(
  'schedule/updateItem',
  async ({ 
    id, 
    itemData 
  }: { 
    id: string; 
    itemData: any;
  }, { rejectWithValue }) => {
    try {
      // Transform the data to match backend Schedule model
      const updateData: any = {};
      
      if (itemData.title) updateData.title = itemData.title;
      if (itemData.type) updateData.type = itemData.type === 'scene' ? 'shooting' : 'other';
      if (itemData.date) updateData.date = itemData.date;
      if (itemData.location) updateData.location = { name: itemData.location };
      
      if (itemData.startTime || itemData.endTime || itemData.duration) {
        updateData.timeSlot = {
          ...(itemData.startTime && { startTime: itemData.startTime }),
          ...(itemData.endTime && { endTime: itemData.endTime }),
          ...(itemData.duration && { duration: itemData.duration })
        };
      }
      
      const response = await apiClient.put(`/schedule/schedules/${id}`, updateData);
      return response.data as ApiResponse<ScheduleItem>;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to update schedule item');
    }
  }
);

export const deleteScheduleItem = createAsyncThunk(
  'schedule/deleteItem',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.delete(`/schedule/schedules/${id}`);
      return id; // Return the ID to remove from state
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to delete schedule item');
    }
  }
);

const scheduleSlice = createSlice({
  name: 'schedule',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setSchedule: (state, action: PayloadAction<Schedule | null>) => {
      state.schedule = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch schedule
      .addCase(fetchSchedule.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchSchedule.fulfilled, (state, action) => {
        state.isLoading = false;
        state.items = action.payload; // action.payload is now the schedules array
      })
      .addCase(fetchSchedule.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create schedule item
      .addCase(createScheduleItem.fulfilled, (state, action) => {
        if (action.payload.data) {
          state.items.push(action.payload.data);
        }
      })
      // Update schedule item
      .addCase(updateScheduleItem.fulfilled, (state, action) => {
        if (action.payload.data) {
          const updatedItem = action.payload.data;
          const index = state.items.findIndex(item => item._id === updatedItem._id);
          if (index !== -1) {
            state.items[index] = updatedItem;
          }
        }
      })
      // Delete schedule item
      .addCase(deleteScheduleItem.fulfilled, (state, action) => {
        const itemId = action.payload; // action.payload is now just the ID string
        state.items = state.items.filter(item => item._id !== itemId);
      });
  },
});

export const { clearError, setSchedule } = scheduleSlice.actions;
export default scheduleSlice.reducer;