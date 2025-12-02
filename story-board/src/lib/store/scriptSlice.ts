import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ApiResponse } from '@/types/api';
import apiClient from '@/lib/api/client';

interface ScriptElement {
  _id?: string;
  id?: string;
  type: 'action' | 'character' | 'dialogue' | 'parenthetical' | 'transition' | 'shot' | 'scene-heading';
  content: string;
  character?: string;
  order: number;
  notes?: string;
  revision?: string;
}

interface Script {
  _id: string;
  projectId: string;
  title: string;
  elements: ScriptElement[];
  settings: {
    format: 'feature' | 'tv' | 'short';
    pageSize: 'a4' | 'letter';
    fontFamily: string;
    fontSize: number;
  };
  metadata: {
    author: string;
    contact?: string;
    copyright?: string;
    draft: string;
    source?: string;
  };
  statistics: {
    pages: number;
    scenes: number;
    words: number;
    characters: number;
  };
  createdAt: string;
  updatedAt: string;
}

interface ScriptState {
  script: Script | null;
  elements: ScriptElement[];
  isLoading: boolean;
  error: string | null;
}

const initialState: ScriptState = {
  script: null,
  elements: [],
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchScript = createAsyncThunk(
  'script/fetchScript',
  async (projectId: string, { rejectWithValue }) => {
    try {
      console.log('Fetching script for project:', projectId);
      const response = await apiClient.get(`/script/projects/${projectId}`);
      console.log('Script fetch response:', response.data);
      return response.data as ApiResponse<Script>;
    } catch (error: any) {
      console.error('Script fetch error:', {
        error: error.response?.data || error.message,
        status: error.response?.status,
        projectId
      });
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch script');
    }
  }
);

export const createScriptElement = createAsyncThunk(
  'script/createElement',
  async ({ 
    projectId, 
    elementData 
  }: { 
    projectId: string; 
    elementData: Omit<ScriptElement, '_id' | 'id'>;
  }, { rejectWithValue }) => {
    try {
      console.log('Creating script element:', { projectId, elementData });
      const response = await apiClient.post(`/script/projects/${projectId}/elements`, elementData);
      console.log('Script element creation response:', response.data);
      return response.data as ApiResponse<ScriptElement>;
    } catch (error: any) {
      console.error('Script element creation error:', {
        error: error.response?.data || error.message,
        status: error.response?.status,
        projectId,
        elementData
      });
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to create script element');
    }
  }
);

export const updateScriptElement = createAsyncThunk(
  'script/updateElement',
  async ({ 
    projectId,
    elementId, 
    elementData 
  }: { 
    projectId: string;
    elementId: string;
    elementData: Partial<ScriptElement>;
  }, { rejectWithValue }) => {
    try {
      console.log('Updating script element:', { projectId, elementId, elementData });
      const response = await apiClient.put(`/script/projects/${projectId}/elements/${elementId}`, elementData);
      console.log('Script element update response:', response.data);
      return response.data as ApiResponse<ScriptElement>;
    } catch (error: any) {
      console.error('Script element update error:', {
        error: error.response?.data || error.message,
        status: error.response?.status,
        projectId,
        elementId,
        elementData
      });
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to update script element');
    }
  }
);

export const deleteScriptElement = createAsyncThunk(
  'script/deleteElement',
  async ({ 
    projectId,
    elementId
  }: { 
    projectId: string;
    elementId: string;
  }, { rejectWithValue }) => {
    try {
      console.log('Deleting script element:', { projectId, elementId });
      await apiClient.delete(`/script/projects/${projectId}/elements/${elementId}`);
      console.log('Script element deleted successfully');
      return elementId;
    } catch (error: any) {
      console.error('Script element deletion error:', {
        error: error.response?.data || error.message,
        status: error.response?.status,
        projectId,
        elementId
      });
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to delete script element');
    }
  }
);

export const updateScript = createAsyncThunk(
  'script/updateScript',
  async ({ 
    projectId, 
    scriptData 
  }: { 
    projectId: string; 
    scriptData: {
      content?: string;
      scenes?: any[];
      characters?: any[];
    };
  }, { rejectWithValue }) => {
    try {
      console.log('Updating script:', { projectId, scriptData });
      const response = await apiClient.put(`/script/projects/${projectId}`, scriptData);
      console.log('Script update response:', response.data);
      return response.data as ApiResponse<any>;
    } catch (error: any) {
      console.error('Script update error:', {
        error: error.response?.data || error.message,
        status: error.response?.status,
        projectId,
        scriptData
      });
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to update script');
    }
  }
);

const scriptSlice = createSlice({
  name: 'script',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentScript: (state, action: PayloadAction<Script | null>) => {
      state.script = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch script
      .addCase(fetchScript.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchScript.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload.data) {
          state.script = action.payload.data;
          state.elements = action.payload.data.elements || [];
        }
      })
      .addCase(fetchScript.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create script element
      .addCase(createScriptElement.fulfilled, (state, action) => {
        if (action.payload.data) {
          state.elements.push(action.payload.data);
        }
      })
      // Update script element
      .addCase(updateScriptElement.fulfilled, (state, action) => {
        if (action.payload.data) {
          const updatedElement = action.payload.data;
          const index = state.elements.findIndex(element => element._id === updatedElement._id);
          if (index !== -1) {
            state.elements[index] = updatedElement;
          }
        }
      })
      // Delete script element
      .addCase(deleteScriptElement.fulfilled, (state, action) => {
        const elementId = action.payload;
        state.elements = state.elements.filter(element => element._id !== elementId);
      })
      // Update script
      .addCase(updateScript.fulfilled, (state, action) => {
        if (action.payload.data) {
          state.script = action.payload.data;
        }
      });
  },
});

export const { clearError, setCurrentScript } = scriptSlice.actions;
export default scriptSlice.reducer;