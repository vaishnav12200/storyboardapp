'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, ExternalLink, Navigation, Satellite, Layers } from 'lucide-react';

interface SatelliteMapLocation {
  id: string;
  name: string;
  type: string;
  category: string;
  address: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  description: string;
  status: string;
  pricing: {
    rate: number;
    unit: string;
  };
}

interface SatelliteMapViewProps {
  locations: SatelliteMapLocation[];
  selectedLocation?: SatelliteMapLocation | null;
  onLocationSelect?: (location: SatelliteMapLocation) => void;
  height?: string;
}

const SatelliteMapView: React.FC<SatelliteMapViewProps> = ({
  locations,
  selectedLocation,
  onLocationSelect,
  height = '600px'
}) => {
  const [mapView, setMapView] = useState<'satellite' | 'hybrid'>('satellite');
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);

  // Default map center (Los Angeles for film industry)
  const defaultCenter = { lat: 34.0522, lng: -118.2437 };
  const defaultZoom = 10;

  // Calculate map center based on locations
  const getMapCenter = () => {
    const locationsWithCoords = locations.filter(loc => loc.coordinates);
    
    if (locationsWithCoords.length === 0) {
      return { center: defaultCenter, zoom: defaultZoom };
    }
    
    if (locationsWithCoords.length === 1) {
      return {
        center: locationsWithCoords[0].coordinates!,
        zoom: 15
      };
    }

    // Calculate center point of all locations
    const lats = locationsWithCoords.map(loc => loc.coordinates!.lat);
    const lngs = locationsWithCoords.map(loc => loc.coordinates!.lng);
    
    const centerLat = (Math.min(...lats) + Math.max(...lats)) / 2;
    const centerLng = (Math.min(...lngs) + Math.max(...lngs)) / 2;
    
    return {
      center: { lat: centerLat, lng: centerLng },
      zoom: 12
    };
  };

  const { center, zoom } = getMapCenter();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'booked': return 'bg-green-500';
      case 'confirmed': return 'bg-blue-500';
      case 'scouting': return 'bg-yellow-500';
      case 'completed': return 'bg-purple-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusTextColor = (status: string) => {
    switch (status) {
      case 'booked': return 'text-green-600 bg-green-100 border-green-200';
      case 'confirmed': return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'scouting': return 'text-yellow-600 bg-yellow-100 border-yellow-200';
      case 'completed': return 'text-purple-600 bg-purple-100 border-purple-200';
      case 'cancelled': return 'text-red-600 bg-red-100 border-red-200';
      default: return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const openInGoogleMaps = (location: SatelliteMapLocation) => {
    if (location.coordinates) {
      const { lat, lng } = location.coordinates;
      const url = `https://www.google.com/maps/@${lat},${lng},15z`;
      window.open(url, '_blank');
    } else {
      const encodedAddress = encodeURIComponent(location.address);
      const url = `https://www.google.com/maps/search/?q=${encodedAddress}`;
      window.open(url, '_blank');
    }
  };

  const openInGoogleEarth = (location: SatelliteMapLocation) => {
    if (location.coordinates) {
      const { lat, lng } = location.coordinates;
      const url = `https://earth.google.com/web/@${lat},${lng},1000a,1000d,1y,0h,0t,0r`;
      window.open(url, '_blank');
    }
  };

  // Generate satellite map URL using different providers
  const generateMapUrl = () => {
    const lat = center.lat;
    const lng = center.lng;
    
    if (mapView === 'satellite') {
      // Use Google Maps satellite view with place query for better results
      const query = locations.length > 0 ? encodeURIComponent(locations[0].address) : `${lat},${lng}`;
      return `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3048.4037!2d${lng}!3d${lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zM${lat}!5e1!3m2!1sen!2sus!4v1699000000000!5m2!1sen!2sus`;
    } else {
      // Regular map view
      const query = locations.length > 0 ? encodeURIComponent(locations[0].address) : `${lat},${lng}`;
      return `https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3048.4037!2d${lng}!3d${lat}!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zM${lat}!5e0!3m2!1sen!2sus!4v1699000000000!5m2!1sen!2sus`;
    }
  };

  return (
    <div className="space-y-6" style={{ minHeight: height }}>
      {/* Map Header with Controls */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6 border border-blue-100">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Satellite className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-900">Satellite Map View</h3>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              View your filming locations on high-resolution satellite imagery. Switch between different map types for optimal planning.
            </p>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span className="text-gray-600">{locations.length} locations total</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                <span className="text-gray-600">{locations.filter(l => l.status === 'booked').length} booked</span>
              </div>
            </div>
          </div>
          
          {/* Map Type Selector */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-gray-600" />
              <span className="text-sm font-medium text-gray-700">Map Type:</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setMapView('satellite')}
                className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                  mapView === 'satellite' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Satellite
              </button>
              <button
                onClick={() => setMapView('hybrid')}
                className={`px-3 py-2 text-xs font-medium rounded-lg transition-colors ${
                  mapView === 'hybrid' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Hybrid
              </button>
            </div>
          </div>

          {/* Legend */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
            <div className="text-sm font-semibold mb-2 text-gray-700">Status Legend</div>
            <div className="grid grid-cols-2 gap-1 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-green-500"></div>
                <span>Booked</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                <span>Confirmed</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                <span>Scouting</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                <span>Completed</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {locations.length > 0 ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          {/* Interactive Map */}
          <div className="xl:col-span-2">
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
              <div className="aspect-video relative">
                <iframe
                  src={generateMapUrl()}
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Location Satellite Map"
                  className="rounded-t-lg"
                ></iframe>
                
                {/* Map overlay info */}
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-sm">
                  <div className="flex items-center gap-2 text-sm">
                    <div className={`w-3 h-3 rounded-full ${
                      mapView === 'satellite' ? 'bg-green-500' : 'bg-blue-500'
                    }`}></div>
                    <span className="font-medium">
                      {mapView === 'satellite' ? '🛰️ Satellite View' : '🗺️ Map View'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="p-4 bg-gray-50 border-t">
                <div className="flex items-center justify-between text-sm text-gray-600">
                  <span>� Showing {locations.length} location{locations.length !== 1 ? 's' : ''}</span>
                  <span>🌍 High-resolution satellite imagery</span>
                </div>
              </div>
            </div>
          </div>

          {/* Location List */}
          <div className="space-y-4 max-h-[600px] overflow-y-auto">
            <div className="sticky top-0 bg-white py-2 border-b border-gray-100">
              <h4 className="font-semibold text-gray-900">
                Locations ({locations.length})
              </h4>
              <p className="text-xs text-gray-500">Click any location to center map</p>
            </div>
            
            {locations.map((location) => (
              <div
                key={location.id}
                className={`bg-white rounded-lg border-2 transition-all cursor-pointer hover:shadow-md ${
                  selectedLocationId === location.id
                    ? 'border-blue-500 shadow-lg'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => {
                  setSelectedLocationId(location.id);
                  onLocationSelect?.(location);
                }}
              >
                <div className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(location.status)}`}></div>
                        <h3 className="font-semibold text-gray-900 text-sm">{location.name}</h3>
                      </div>
                      
                      <div className={`inline-flex px-2 py-1 rounded-full text-xs font-medium border ${getStatusTextColor(location.status)}`}>
                        {location.status.charAt(0).toUpperCase() + location.status.slice(1)}
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-2 text-xs text-gray-600">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3 h-3" />
                      <span className="truncate">{location.address}</span>
                    </div>
                    <div>
                      <span className="font-medium">Type:</span> {location.type} • <span className="font-medium">Category:</span> {location.category}
                    </div>
                    <div>
                      <span className="font-medium">Rate:</span> ${location.pricing.rate}/{location.pricing.unit}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openInGoogleMaps(location);
                      }}
                      className="flex-1 px-2 py-2 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Maps
                    </button>
                    
                    {location.coordinates && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openInGoogleEarth(location);
                        }}
                        className="flex-1 px-2 py-2 bg-green-600 text-white rounded text-xs font-medium hover:bg-green-700 transition-colors flex items-center justify-center gap-1"
                      >
                        <Navigation className="w-3 h-3" />
                        Earth
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Satellite className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Locations Found</h3>
          <p className="text-gray-600 mb-4">Add some locations to see them on the satellite map.</p>
          <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-700">
            💡 <strong>Tip:</strong> Once you add locations with addresses, they'll appear here with satellite imagery and interactive map features.
          </div>
        </div>
      )}
    </div>
  );
};

export default SatelliteMapView;