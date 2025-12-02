import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ApiResponse } from '@/types/api';
import apiClient from '@/lib/api/client';

export interface Shot {
  _id?: string;
  id?: string;
  shotNumber: string;
  sceneId?: string;
  description: string;
  shotType: 'wide' | 'medium' | 'close-up' | 'extreme-close-up' | 'insert' | 'cutaway' | 'establishing' | 'master';
  cameraAngle: 'eye-level' | 'high' | 'low' | 'dutch' | 'overhead' | 'worm-eye';
  movement?: 'static' | 'pan' | 'tilt' | 'zoom' | 'dolly' | 'track' | 'handheld' | 'steadicam';
  lens?: string;
  equipment?: string[];
  lighting?: {
    setup: string;
    mood: string;
    notes?: string;
  };
  audio?: {
    type: 'sync' | 'wild' | 'voiceover' | 'sfx';
    notes?: string;
  };
  duration?: number; // estimated duration in seconds
  location?: string;
  timeOfDay?: 'dawn' | 'morning' | 'afternoon' | 'evening' | 'night';
  weather?: 'sunny' | 'cloudy' | 'rainy' | 'stormy' | 'snowy';
  cast?: Array<{
    character: string;
    actor?: string;
    action: string;
  }>;
  props?: string[];
  wardrobe?: string[];
  makeup?: string[];
  vfx?: Array<{
    type: string;
    description: string;
    complexity: 'low' | 'medium' | 'high';
  }>;
  status: 'planned' | 'ready' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  notes?: string;
  tags?: string[];
  createdAt?: string;
  updatedAt?: string;
}

interface ShotList {
  _id: string;
  projectId: string;
  name: string;
  description?: string;
  shots: Shot[];
  metadata: {
    totalShots: number;
    estimatedDuration: number; // total estimated duration in minutes
    locations: string[];
    equipment: string[];
  };
  createdAt: string;
  updatedAt: string;
}

interface ShotListState {
  shotLists: ShotList[];
  currentShotList: ShotList | null;
  shots: Shot[];
  isLoading: boolean;
  error: string | null;
}

const initialState: ShotListState = {
  shotLists: [],
  currentShotList: null,
  shots: [],
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchShotLists = createAsyncThunk(
  'shotlist/fetchShotLists',
  async (projectId: string, { rejectWithValue }) => {
    try {
      console.log('Fetching shot lists for project:', projectId);
      const response = await apiClient.get(`/shotlist/projects/${projectId}`);
      console.log('Shot lists fetch response:', response.data);
      const apiResponse = response.data as ApiResponse<{ shotLists: ShotList[] }>;
      return apiResponse.data?.shotLists || [];
    } catch (error: any) {
      console.error('Shot lists fetch error:', {
        error: error.response?.data || error.message,
        status: error.response?.status,
        projectId
      });
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch shot lists');
    }
  }
);

export const createShot = createAsyncThunk(
  'shotlist/createShot',
  async ({ 
    projectId,
    shotListId,
    shotData 
  }: { 
    projectId: string;
    shotListId?: string;
    shotData: Omit<Shot, '_id' | 'id' | 'createdAt' | 'updatedAt'>;
  }, { rejectWithValue }) => {
    try {
      console.log('Creating shot:', { projectId, shotListId, shotData });
      const endpoint = shotListId 
        ? `/shotlist/projects/${projectId}/shotlists/${shotListId}/shots`
        : `/shotlist/projects/${projectId}/shots`;
      const response = await apiClient.post(endpoint, shotData);
      console.log('Shot creation response:', response.data);
      return response.data as ApiResponse<Shot>;
    } catch (error: any) {
      console.error('Shot creation error:', {
        error: error.response?.data || error.message,
        status: error.response?.status,
        projectId,
        shotListId,
        shotData
      });
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to create shot');
    }
  }
);

export const updateShot = createAsyncThunk(
  'shotlist/updateShot',
  async ({ 
    projectId,
    shotId, 
    shotData 
  }: { 
    projectId: string;
    shotId: string;
    shotData: Partial<Shot>;
  }, { rejectWithValue }) => {
    try {
      console.log('Updating shot:', { projectId, shotId, shotData });
      const response = await apiClient.put(`/shotlist/projects/${projectId}/shots/${shotId}`, shotData);
      console.log('Shot update response:', response.data);
      return response.data as ApiResponse<Shot>;
    } catch (error: any) {
      console.error('Shot update error:', {
        error: error.response?.data || error.message,
        status: error.response?.status,
        projectId,
        shotId,
        shotData
      });
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to update shot');
    }
  }
);

export const deleteShot = createAsyncThunk(
  'shotlist/deleteShot',
  async ({ 
    projectId,
    shotId
  }: { 
    projectId: string;
    shotId: string;
  }, { rejectWithValue }) => {
    try {
      console.log('Deleting shot:', { projectId, shotId });
      await apiClient.delete(`/shotlist/projects/${projectId}/shots/${shotId}`);
      console.log('Shot deleted successfully');
      return shotId;
    } catch (error: any) {
      console.error('Shot deletion error:', {
        error: error.response?.data || error.message,
        status: error.response?.status,
        projectId,
        shotId
      });
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to delete shot');
    }
  }
);

export const createShotList = createAsyncThunk(
  'shotlist/createShotList',
  async ({ 
    projectId, 
    shotListData 
  }: { 
    projectId: string; 
    shotListData: Omit<ShotList, '_id' | 'projectId' | 'createdAt' | 'updatedAt'>;
  }, { rejectWithValue }) => {
    try {
      console.log('Creating shot list:', { projectId, shotListData });
      const response = await apiClient.post(`/shotlist/projects/${projectId}/shotlists`, shotListData);
      console.log('Shot list creation response:', response.data);
      return response.data as ApiResponse<ShotList>;
    } catch (error: any) {
      console.error('Shot list creation error:', {
        error: error.response?.data || error.message,
        status: error.response?.status,
        projectId,
        shotListData
      });
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to create shot list');
    }
  }
);

const shotListSlice = createSlice({
  name: 'shotlist',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentShotList: (state, action: PayloadAction<ShotList | null>) => {
      state.currentShotList = action.payload;
      state.shots = action.payload?.shots || [];
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch shot lists
      .addCase(fetchShotLists.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchShotLists.fulfilled, (state, action) => {
        state.isLoading = false;
        state.shotLists = action.payload;
      })
      .addCase(fetchShotLists.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create shot
      .addCase(createShot.fulfilled, (state, action) => {
        if (action.payload.data) {
          state.shots.push(action.payload.data);
          if (state.currentShotList) {
            state.currentShotList.shots.push(action.payload.data);
            state.currentShotList.metadata.totalShots = state.currentShotList.shots.length;
          }
        }
      })
      // Update shot
      .addCase(updateShot.fulfilled, (state, action) => {
        if (action.payload.data) {
          const updatedShot = action.payload.data;
          const index = state.shots.findIndex(shot => shot._id === updatedShot._id);
          if (index !== -1) {
            state.shots[index] = updatedShot;
          }
          if (state.currentShotList) {
            const listIndex = state.currentShotList.shots.findIndex(shot => shot._id === updatedShot._id);
            if (listIndex !== -1) {
              state.currentShotList.shots[listIndex] = updatedShot;
            }
          }
        }
      })
      // Delete shot
      .addCase(deleteShot.fulfilled, (state, action) => {
        const shotId = action.payload;
        state.shots = state.shots.filter(shot => shot._id !== shotId);
        if (state.currentShotList) {
          state.currentShotList.shots = state.currentShotList.shots.filter(shot => shot._id !== shotId);
          state.currentShotList.metadata.totalShots = state.currentShotList.shots.length;
        }
      })
      // Create shot list
      .addCase(createShotList.fulfilled, (state, action) => {
        if (action.payload.data) {
          state.shotLists.push(action.payload.data);
        }
      });
  },
});

export const { clearError, setCurrentShotList } = shotListSlice.actions;
export default shotListSlice.reducer;