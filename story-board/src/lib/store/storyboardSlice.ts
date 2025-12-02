import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Scene, StoryboardPanel, CreateSceneData, CreatePanelData, GenerateImageRequest } from '@/types/storyboard';
import { ApiResponse } from '@/types/api';
import apiClient from '@/lib/api/client';

interface StoryboardState {
  scenes: Scene[];
  currentScene: Scene | null;
  currentPanel: StoryboardPanel | null;
  isLoading: boolean;
  isGeneratingImage: boolean;
  error: string | null;
}

const initialState: StoryboardState = {
  scenes: [],
  currentScene: null,
  currentPanel: null,
  isLoading: false,
  isGeneratingImage: false,
  error: null,
};

// Async thunks
export const fetchScenes = createAsyncThunk(
  'storyboard/fetchScenes',
  async (projectId: string, { rejectWithValue }) => {
    try {
      console.log('Fetching storyboard scenes for project:', projectId);
      const response = await apiClient.get(`/storyboard/projects/${projectId}/scenes`);
      console.log('Storyboard scenes fetch response:', response.data);
      return response.data as ApiResponse<Scene[]>;
    } catch (error: any) {
      console.error('Storyboard scenes fetch error:', {
        error: error.response?.data || error.message,
        status: error.response?.status,
        projectId
      });
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch scenes');
    }
  }
);

export const fetchSceneById = createAsyncThunk(
  'storyboard/fetchSceneById',
  async ({ projectId, sceneId }: { projectId: string; sceneId: string }, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/storyboard/projects/${projectId}/scenes/${sceneId}`);
      return response.data as ApiResponse<Scene>;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to fetch scene');
    }
  }
);

export const createScene = createAsyncThunk(
  'storyboard/createScene',
  async ({ projectId, sceneData }: { projectId: string; sceneData: CreateSceneData }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(`/storyboard/projects/${projectId}/scenes`, sceneData);
      return response.data as ApiResponse<Scene>;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create scene');
    }
  }
);

export const updateScene = createAsyncThunk(
  'storyboard/updateScene',
  async ({ 
    projectId, 
    sceneId, 
    sceneData 
  }: { 
    projectId: string; 
    sceneId: string; 
    sceneData: Partial<CreateSceneData> 
  }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put(`/storyboard/projects/${projectId}/scenes/${sceneId}`, sceneData);
      return response.data as ApiResponse<Scene>;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update scene');
    }
  }
);

export const deleteScene = createAsyncThunk(
  'storyboard/deleteScene',
  async ({ projectId, sceneId }: { projectId: string; sceneId: string }, { rejectWithValue }) => {
    try {
      const response = await apiClient.delete(`/storyboard/projects/${projectId}/scenes/${sceneId}`);
      return { sceneId, response: response.data as ApiResponse };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete scene');
    }
  }
);

export const createPanel = createAsyncThunk(
  'storyboard/createPanel',
  async ({ 
    projectId, 
    sceneId, 
    panelData 
  }: { 
    projectId: string; 
    sceneId: string; 
    panelData: CreatePanelData 
  }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(`/storyboard/scenes/${sceneId}/panels`, panelData);
      return { sceneId, panel: response.data.data as StoryboardPanel };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to create panel');
    }
  }
);

export const updatePanel = createAsyncThunk(
  'storyboard/updatePanel',
  async ({ 
    projectId, 
    sceneId, 
    panelId, 
    panelData 
  }: { 
    projectId: string; 
    sceneId: string; 
    panelId: string; 
    panelData: Partial<CreatePanelData> 
  }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put(
        `/storyboard/scenes/${sceneId}/panels/${panelId}`, 
        panelData
      );
      return { sceneId, panel: response.data.data as StoryboardPanel };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to update panel');
    }
  }
);

export const deletePanel = createAsyncThunk(
  'storyboard/deletePanel',
  async ({ 
    projectId, 
    sceneId, 
    panelId 
  }: { 
    projectId: string; 
    sceneId: string; 
    panelId: string 
  }, { rejectWithValue }) => {
    try {
      const response = await apiClient.delete(
        `/storyboard/scenes/${sceneId}/panels/${panelId}`
      );
      return { sceneId, panelId, response: response.data as ApiResponse };
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to delete panel');
    }
  }
);

export const generatePanelImage = createAsyncThunk(
  'storyboard/generateImage',
  async (imageRequest: GenerateImageRequest, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(
        `/storyboard/scenes/${imageRequest.sceneId}/panels/${imageRequest.panelId}/generate-image`,
        {
          prompt: imageRequest.prompt,
          style: imageRequest.style || 'realistic'
        }
      );
      return response.data as ApiResponse<{ imageUrl: string }>;
    } catch (error: any) {
      return rejectWithValue(error.message || 'Failed to generate image');
    }
  }
);

const storyboardSlice = createSlice({
  name: 'storyboard',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentScene: (state, action: PayloadAction<Scene | null>) => {
      state.currentScene = action.payload;
    },
    setCurrentPanel: (state, action: PayloadAction<StoryboardPanel | null>) => {
      state.currentPanel = action.payload;
    },
    reorderPanels: (state, action: PayloadAction<{ sceneId: string; panels: StoryboardPanel[] }>) => {
      const { sceneId, panels } = action.payload;
      const scene = state.scenes.find(s => s._id === sceneId);
      if (scene) {
        scene.panels = panels;
      }
      if (state.currentScene && state.currentScene._id === sceneId) {
        state.currentScene.panels = panels;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch scenes
      .addCase(fetchScenes.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchScenes.fulfilled, (state, action) => {
        state.isLoading = false;
        // Backend returns { data: { scenes: [], pagination: {} } }
        // Extract the scenes array from the nested structure
        const data = action.payload.data;
        if (data && typeof data === 'object' && 'scenes' in data) {
          // Data has { scenes: [], pagination: {} } structure
          state.scenes = Array.isArray((data as any).scenes) ? (data as any).scenes : [];
        } else if (Array.isArray(data)) {
          // Data is already an array
          state.scenes = data;
        } else {
          // Fallback to empty array
          state.scenes = [];
        }
        console.log('Scenes loaded into state:', state.scenes.length, 'scenes');
      })
      .addCase(fetchScenes.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Fetch scene by ID
      .addCase(fetchSceneById.fulfilled, (state, action) => {
        state.currentScene = action.payload.data;
      })
      // Create scene
      .addCase(createScene.fulfilled, (state, action) => {
        state.scenes.push(action.payload.data);
        state.currentScene = action.payload.data;
      })
      // Update scene
      .addCase(updateScene.fulfilled, (state, action) => {
        const updatedScene = action.payload.data;
        const index = state.scenes.findIndex(s => s._id === updatedScene._id);
        if (index !== -1) {
          state.scenes[index] = updatedScene;
        }
        if (state.currentScene && state.currentScene._id === updatedScene._id) {
          state.currentScene = updatedScene;
        }
      })
      // Delete scene
      .addCase(deleteScene.fulfilled, (state, action) => {
        const sceneId = action.payload.sceneId;
        state.scenes = state.scenes.filter(s => s._id !== sceneId);
        if (state.currentScene && state.currentScene._id === sceneId) {
          state.currentScene = null;
        }
      })
      // Create panel
      .addCase(createPanel.fulfilled, (state, action) => {
        const { sceneId, panel } = action.payload;
        // Ensure scenes is an array
        if (!Array.isArray(state.scenes)) {
          state.scenes = [];
        }
        const scene = state.scenes.find(s => s._id === sceneId);
        if (scene) {
          if (!scene.panels) {
            scene.panels = [];
          }
          scene.panels.push(panel);
        }
        if (state.currentScene && state.currentScene._id === sceneId) {
          if (!state.currentScene.panels) {
            state.currentScene.panels = [];
          }
          state.currentScene.panels.push(panel);
        }
      })
      // Update panel
      .addCase(updatePanel.fulfilled, (state, action) => {
        const { sceneId, panel } = action.payload;
        // Ensure scenes is an array
        if (!Array.isArray(state.scenes)) {
          state.scenes = [];
        }
        const scene = state.scenes.find(s => s._id === sceneId);
        if (scene && scene.panels) {
          const panelIndex = scene.panels.findIndex(p => p._id === panel._id);
          if (panelIndex !== -1) {
            scene.panels[panelIndex] = panel;
          }
        }
        if (state.currentScene && state.currentScene._id === sceneId && state.currentScene.panels) {
          const panelIndex = state.currentScene.panels.findIndex(p => p._id === panel._id);
          if (panelIndex !== -1) {
            state.currentScene.panels[panelIndex] = panel;
          }
        }
        if (state.currentPanel && state.currentPanel._id === panel._id) {
          state.currentPanel = panel;
        }
      })
      // Delete panel
      .addCase(deletePanel.fulfilled, (state, action) => {
        const { sceneId, panelId } = action.payload;
        // Ensure scenes is an array
        if (!Array.isArray(state.scenes)) {
          state.scenes = [];
        }
        const scene = state.scenes.find(s => s._id === sceneId);
        if (scene && scene.panels) {
          scene.panels = scene.panels.filter(p => p._id !== panelId);
        }
        if (state.currentScene && state.currentScene._id === sceneId && state.currentScene.panels) {
          state.currentScene.panels = state.currentScene.panels.filter(p => p._id !== panelId);
        }
        if (state.currentPanel && state.currentPanel._id === panelId) {
          state.currentPanel = null;
        }
      })
      // Generate image
      .addCase(generatePanelImage.pending, (state) => {
        state.isGeneratingImage = true;
        state.error = null;
      })
      .addCase(generatePanelImage.fulfilled, (state, action) => {
        state.isGeneratingImage = false;
        // Image URL will be handled by the component that initiated the request
      })
      .addCase(generatePanelImage.rejected, (state, action) => {
        state.isGeneratingImage = false;
        state.error = action.payload as string;
      });
  },
});

export const { 
  clearError, 
  setCurrentScene, 
  setCurrentPanel, 
  reorderPanels 
} = storyboardSlice.actions;
export default storyboardSlice.reducer;