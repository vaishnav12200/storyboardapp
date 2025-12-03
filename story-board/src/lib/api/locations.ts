import apiClient from './client';
import { Location } from '@/types/api';
import { ApiResponse, PaginatedResponse } from '@/types/api';

export interface CreateLocationData {
  name: string;
  address: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  type: 'studio' | 'outdoor' | 'indoor' | 'green-screen';
  description?: string;
  availability?: string[];
  cost?: number;
  contact?: {
    name: string;
    phone: string;
    email: string;
  };
}

export interface UpdateLocationData extends Partial<CreateLocationData> {}

export interface LocationSearchFilters {
  type?: string;
  maxCost?: number;
  availability?: string;
  radius?: number;
  centerLat?: number;
  centerLng?: number;
}

export const locationsApi = {
  // Location management
  getLocations: async (
    projectId: string, 
    filters: LocationSearchFilters & { page?: number; limit?: number } = {}
  ): Promise<PaginatedResponse<Location>> => {
    const queryParams = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    });

    const response = await apiClient.get(
      `/location/projects/${projectId}?${queryParams.toString()}`
    );
    return response.data;
  },

  getLocation: async (projectId: string, locationId: string): Promise<ApiResponse<Location>> => {
    const response = await apiClient.get(`/location/projects/${projectId}/locations/${locationId}`);
    return response.data;
  },

  createLocation: async (
    projectId: string, 
    locationData: CreateLocationData
  ): Promise<ApiResponse<Location>> => {
    const response = await apiClient.post(`/location/projects/${projectId}`, locationData);
    return response.data;
  },

  updateLocation: async (
    projectId: string, 
    locationId: string, 
    locationData: UpdateLocationData
  ): Promise<ApiResponse<Location>> => {
    const response = await apiClient.put(
      `/location/projects/${projectId}/locations/${locationId}`, 
      locationData
    );
    return response.data;
  },

  deleteLocation: async (projectId: string, locationId: string): Promise<ApiResponse> => {
    const response = await apiClient.delete(`/location/projects/${projectId}/locations/${locationId}`);
    return response.data;
  },

  // Image management
  uploadLocationImages: async (
    projectId: string, 
    locationId: string, 
    images: File[]
  ): Promise<ApiResponse<{ imageUrls: string[] }>> => {
    const formData = new FormData();
    images.forEach((image, index) => {
      formData.append(`images`, image);
    });

    const response = await apiClient.post(
      `/location/projects/${projectId}/locations/${locationId}/images`, 
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  deleteLocationImage: async (
    projectId: string, 
    locationId: string, 
    imageUrl: string
  ): Promise<ApiResponse> => {
    const response = await apiClient.delete(
      `/location/projects/${projectId}/locations/${locationId}/images`,
      { data: { imageUrl } }
    );
    return response.data;
  },

  // Search and discovery
  searchNearbyLocations: async (
    projectId: string,
    coordinates: { lat: number; lng: number },
    radius: number = 50
  ): Promise<ApiResponse<Location[]>> => {
    const response = await apiClient.get(
      `/location/projects/${projectId}/search/nearby?lat=${coordinates.lat}&lng=${coordinates.lng}&radius=${radius}`
    );
    return response.data;
  },

  searchLocationsByAddress: async (
    projectId: string,
    address: string
  ): Promise<ApiResponse<Location[]>> => {
    const response = await apiClient.get(
      `/location/projects/${projectId}/search/address?q=${encodeURIComponent(address)}`
    );
    return response.data;
  },

  // Availability management
  updateLocationAvailability: async (
    projectId: string, 
    locationId: string, 
    availability: string[]
  ): Promise<ApiResponse<Location>> => {
    const response = await apiClient.put(
      `/location/projects/${projectId}/locations/${locationId}/availability`, 
      { availability }
    );
    return response.data;
  },

  checkLocationAvailability: async (
    projectId: string, 
    locationId: string, 
    dates: string[]
  ): Promise<ApiResponse<{ available: boolean; conflicts: string[] }>> => {
    const response = await apiClient.post(
      `/location/projects/${projectId}/locations/${locationId}/check-availability`, 
      { dates }
    );
    return response.data;
  },

  // Geocoding and mapping
  geocodeAddress: async (address: string): Promise<ApiResponse<{
    coordinates: { lat: number; lng: number };
    formattedAddress: string;
  }>> => {
    const response = await apiClient.post('/location/geocode', { address });
    return response.data;
  },

  reverseGeocode: async (
    lat: number, 
    lng: number
  ): Promise<ApiResponse<{ address: string }>> => {
    const response = await apiClient.post('/location/reverse-geocode', { lat, lng });
    return response.data;
  },

  // Location scouting
  createScoutingReport: async (
    projectId: string, 
    locationId: string, 
    report: {
      visitDate: string;
      scouts: string[];
      notes: string;
      pros: string[];
      cons: string[];
      rating: number;
      photos?: File[];
    }
  ): Promise<ApiResponse<any>> => {
    const formData = new FormData();
    
    Object.entries(report).forEach(([key, value]) => {
      if (key === 'photos' && Array.isArray(value)) {
        value.forEach((photo) => {
          formData.append('photos', photo);
        });
      } else if (Array.isArray(value)) {
        formData.append(key, JSON.stringify(value));
      } else {
        formData.append(key, value.toString());
      }
    });

    const response = await apiClient.post(
      `/location/projects/${projectId}/locations/${locationId}/scouting-report`, 
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  // Permits and permissions
  addLocationPermit: async (
    projectId: string, 
    locationId: string, 
    permit: {
      type: string;
      issuer: string;
      permitNumber: string;
      issueDate: string;
      expiryDate: string;
      cost: number;
      document?: File;
    }
  ): Promise<ApiResponse<Location>> => {
    const formData = new FormData();
    
    Object.entries(permit).forEach(([key, value]) => {
      if (key === 'document' && value) {
        formData.append('document', value as File);
      } else if (value !== null && value !== undefined) {
        formData.append(key, value.toString());
      }
    });

    const response = await apiClient.post(
      `/location/projects/${projectId}/locations/${locationId}/permits`, 
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      }
    );
    return response.data;
  },

  // Weather information
  getLocationWeather: async (
    projectId: string, 
    locationId: string, 
    date: string
  ): Promise<ApiResponse<{
    temperature: { min: number; max: number };
    conditions: string;
    precipitation: number;
    wind: { speed: number; direction: string };
    humidity: number;
  }>> => {
    const response = await apiClient.get(
      `/location/projects/${projectId}/locations/${locationId}/weather?date=${date}`
    );
    return response.data;
  },

  // Export and import
  exportLocations: async (
    projectId: string, 
    format: 'pdf' | 'excel' | 'csv'
  ): Promise<Blob> => {
    const response = await apiClient.get(
      `/location/projects/${projectId}/export/${format}`, 
      {
        responseType: 'blob',
      }
    );
    return response.data;
  },

  importLocations: async (projectId: string, file: File): Promise<ApiResponse<Location[]>> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await apiClient.post(
      `/location/projects/${projectId}/import`, 
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