import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { ApiResponse } from '@/types/api';
import apiClient from '@/lib/api/client';

export interface Location {
  _id: string;
  projectId: string;
  name: string;
  address: string;
  type: 'studio' | 'outdoor' | 'indoor' | 'public' | 'private' | 'green-screen' | 'practical';
  description?: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  contact?: {
    name: string;
    phone?: string;
    email?: string;
  };
  availability?: {
    startDate: string;
    endDate: string;
    timeSlots: Array<{
      day: string;
      startTime: string;
      endTime: string;
    }>;
  };
  cost?: {
    daily: number;
    hourly?: number;
    currency: string;
    additionalFees?: Array<{
      name: string;
      amount: number;
      description?: string;
    }>;
  };
  equipment?: {
    available: string[];
    power: {
      outlets: number;
      voltage: string;
      amperage?: string;
    };
    parking: {
      available: boolean;
      spaces?: number;
      cost?: number;
    };
    restrooms: boolean;
    catering: boolean;
  };
  restrictions?: {
    noise: string;
    lighting: string;
    crew: {
      maxSize: number;
      restrictions: string[];
    };
    equipment: string[];
    other: string[];
  };
  images?: Array<{
    url: string;
    caption?: string;
    type: 'main' | 'detail' | 'floor_plan';
  }>;
  notes?: string;
  status: 'scouting' | 'approved' | 'booked' | 'confirmed' | 'completed' | 'cancelled' | 'unavailable';
  createdAt: string;
  updatedAt: string;
}

interface LocationState {
  locations: Location[];
  currentLocation: Location | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: LocationState = {
  locations: [],
  currentLocation: null,
  isLoading: false,
  error: null,
};

// Async thunks
export const fetchLocations = createAsyncThunk(
  'locations/fetchLocations',
  async (projectId: string, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/location/projects/${projectId}`);
      const apiResponse = response.data as ApiResponse<{ locations: Location[] }>;
      return apiResponse.data?.locations || [];
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch locations');
    }
  }
);

export const createLocation = createAsyncThunk(
  'locations/createLocation',
  async ({ 
    projectId, 
    locationData 
  }: { 
    projectId: string; 
    locationData: Omit<Location, '_id' | 'projectId' | 'createdAt' | 'updatedAt'>;
  }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post(`/location/projects/${projectId}`, locationData);
      return response.data as ApiResponse<Location>;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to create location');
    }
  }
);

export const updateLocation = createAsyncThunk(
  'locations/updateLocation',
  async ({ 
    locationId, 
    locationData 
  }: { 
    locationId: string;
    locationData: Partial<Location>;
  }, { rejectWithValue }) => {
    try {
      const response = await apiClient.put(`/location/locations/${locationId}`, locationData);
      return response.data as ApiResponse<Location>;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to update location');
    }
  }
);

export const deleteLocation = createAsyncThunk(
  'locations/deleteLocation',
  async (locationId: string, { rejectWithValue }) => {
    try {
      await apiClient.delete(`/location/locations/${locationId}`);
      return locationId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || error.message || 'Failed to delete location');
    }
  }
);

const locationSlice = createSlice({
  name: 'locations',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setCurrentLocation: (state, action: PayloadAction<Location | null>) => {
      state.currentLocation = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch locations
      .addCase(fetchLocations.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchLocations.fulfilled, (state, action) => {
        state.isLoading = false;
        state.locations = action.payload;
      })
      .addCase(fetchLocations.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Create location
      .addCase(createLocation.fulfilled, (state, action) => {
        if (action.payload.data) {
          state.locations.push(action.payload.data);
        }
      })
      // Update location
      .addCase(updateLocation.fulfilled, (state, action) => {
        if (action.payload.data) {
          const updatedLocation = action.payload.data;
          const index = state.locations.findIndex(location => location._id === updatedLocation._id);
          if (index !== -1) {
            state.locations[index] = updatedLocation;
          }
        }
      })
      // Delete location
      .addCase(deleteLocation.fulfilled, (state, action) => {
        const locationId = action.payload;
        state.locations = state.locations.filter(location => location._id !== locationId);
      });
  },
});

export const { clearError, setCurrentLocation } = locationSlice.actions;
export default locationSlice.reducer;