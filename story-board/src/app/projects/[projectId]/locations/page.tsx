'use client';

import React, { useState, useEffect, useMemo } from 'react';
// import dynamic from 'next/dynamic'; // Temporarily disabled
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'next/navigation';
import {
  Plus,
  MapPin,
  Search,
  Filter,
  Star,
  Calendar,
  DollarSign,
  Phone,
  Mail,
  ExternalLink,
  Download,
  Upload,
  Edit3,
  Trash2,
  Eye,
  Navigation,
  Clock,
  Users,
  Camera,
  Car,
  Wifi,
  Zap,
  Home,
  Building,
  TreePine,
  Waves,
  Mountain,
  Coffee,
  Store,
  School,
  AlertTriangle,
  CheckCircle,
  ImageIcon,
  FileText,
  Map as MapIcon,
  Grid3X3,
  List,
} from 'lucide-react';
import { useRequireAuth } from '@/hooks/useAuth';
import { useCurrentProject } from '@/hooks/useProjects';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { toast } from 'react-hot-toast';
import SatelliteMapView from '@/components/maps/SatelliteMapView';

// Dynamically import the satellite map to avoid SSR issues
// Temporarily disabled to debug render error
// const SatelliteMap = dynamic(
//   () => import('@/components/maps/SatelliteMap'),
//   { 
//     ssr: false,
//     loading: () => (
//       <div className="h-96 bg-gray-100 rounded-lg flex items-center justify-center">
//         <div className="text-center">
//           <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
//           <p className="text-gray-600">Loading satellite map...</p>
//         </div>
//       </div>
//     )
//   }
// );

interface Location {
  id: string;
  name: string;
  type: 'interior' | 'exterior' | 'studio' | 'public' | 'private' | 'natural';
  category: 'residential' | 'commercial' | 'industrial' | 'outdoor' | 'institutional' | 'entertainment';
  address: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  description: string;
  images: string[];
  contact: {
    name?: string;
    phone?: string;
    email?: string;
    website?: string;
  };
  availability: {
    dates: string[];
    restrictions?: string;
    hours?: string;
  };
  pricing: {
    rate: number;
    unit: 'hour' | 'day' | 'week' | 'flat';
    deposit?: number;
    insurance?: number;
  };
  features: string[];
  amenities: string[];
  equipment: string[];
  parking: {
    available: boolean;
    spaces?: number;
    cost?: number;
  };
  power: {
    available: boolean;
    amperage?: number;
    outlets?: number;
  };
  accessibility: {
    wheelchairAccessible: boolean;
    loadingDock: boolean;
    elevator: boolean;
  };
  permits: {
    required: boolean;
    obtained: boolean;
    cost?: number;
    expiryDate?: string;
  };
  scenes: string[];
  shootingDays: string[];
  status: 'scouting' | 'confirmed' | 'booked' | 'completed' | 'cancelled';
  rating: number;
  notes?: string;
  attachments: Array<{
    id: string;
    name: string;
    type: 'image' | 'document' | 'contract' | 'permit';
    url: string;
    uploadedAt: string;
  }>;
}

const LocationsPage = () => {
  useRequireAuth();
  const params = useParams();
  const projectId = params.projectId as string;
  const { project, isLoading } = useCurrentProject(projectId);

  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('grid');
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // New location form state
  const [newLocation, setNewLocation] = useState({
    name: '',
    type: 'interior' as Location['type'],
    category: 'residential' as Location['category'],
    address: '',
    description: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    rate: 0,
    unit: 'day' as 'day' | 'hour' | 'week' | 'flat',
    status: 'scouting' as Location['status'],
    latitude: '',
    longitude: ''
  });

  const handleLocationSelect = (mapLocation: { id: string; name: string; type: string; category: string; address: string; coordinates?: { lat: number; lng: number }; description: string; status: string; pricing: { rate: number; unit: string } }) => {
    // Find the full location data from our locations array
    const fullLocation = locations.find(loc => loc.id === mapLocation.id);
    if (fullLocation) {
      setSelectedLocation(fullLocation);
    }
  };

  const handleAddLocation = () => {
    if (!newLocation.name.trim() || !newLocation.address.trim()) {
      toast.error('Please fill in location name and address');
      return;
    }

    const location: Location = {
      id: Date.now().toString(),
      name: newLocation.name.trim(),
      type: newLocation.type,
      category: newLocation.category,
      address: newLocation.address.trim(),
      coordinates: (newLocation.latitude && newLocation.longitude) ? {
        lat: parseFloat(newLocation.latitude),
        lng: parseFloat(newLocation.longitude)
      } : undefined,
      description: newLocation.description.trim(),
      images: [],
      contact: {
        name: newLocation.contactName.trim() || undefined,
        phone: newLocation.contactPhone.trim() || undefined,
        email: newLocation.contactEmail.trim() || undefined,
      },
      availability: {
        dates: [],
      },
      pricing: {
        rate: newLocation.rate,
        unit: newLocation.unit,
      },
      features: [],
      amenities: [],
      equipment: [],
      parking: { available: false },
      power: { available: false },
      accessibility: {
        wheelchairAccessible: false,
        loadingDock: false,
        elevator: false,
      },
      permits: { required: false, obtained: false },
      scenes: [],
      shootingDays: [],
      status: newLocation.status,
      rating: 0,
      attachments: [],
    };

    setLocations([...locations, location]);
    setShowAddLocation(false);
    
    // Reset form
    setNewLocation({
      name: '',
      type: 'interior',
      category: 'residential',
      address: '',
      description: '',
      contactName: '',
      contactPhone: '',
      contactEmail: '',
      rate: 0,
      unit: 'day',
      status: 'scouting',
      latitude: '',
      longitude: ''
    });

    toast.success('Location added successfully!');
  };

  // Initialize locations data
  useEffect(() => {
    if (project) {
      // Start with empty locations - user will add their own
      const initialLocations: Location[] = [];
      
      setLocations(initialLocations);
    }
  }, [project]);

  const getLocationTypeIcon = (type: string) => {
    switch (type) {
      case 'interior':
        return <Home className="w-4 h-4" />;
      case 'exterior':
        return <TreePine className="w-4 h-4" />;
      case 'studio':
        return <Camera className="w-4 h-4" />;
      case 'public':
        return <Users className="w-4 h-4" />;
      case 'private':
        return <Building className="w-4 h-4" />;
      case 'natural':
        return <Mountain className="w-4 h-4" />;
      default:
        return <MapPin className="w-4 h-4" />;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'residential':
        return <Home className="w-4 h-4" />;
      case 'commercial':
        return <Store className="w-4 h-4" />;
      case 'industrial':
        return <Building className="w-4 h-4" />;
      case 'outdoor':
        return <TreePine className="w-4 h-4" />;
      case 'institutional':
        return <School className="w-4 h-4" />;
      case 'entertainment':
        return <Coffee className="w-4 h-4" />;
      default:
        return <MapPin className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'booked':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'scouting':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'completed':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredLocations = locations.filter(location => {
    const matchesSearch = location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         location.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         location.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || location.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || location.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || location.category === categoryFilter;
    
    return matchesSearch && matchesType && matchesStatus && matchesCategory;
  });

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating) 
            ? 'text-yellow-400 fill-current' 
            : i < rating 
            ? 'text-yellow-400 fill-current opacity-50' 
            : 'text-gray-300'
        }`}
      />
    ));
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"
          />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Location Management</h1>
            <p className="text-gray-600">{project?.title}</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                leftIcon={<Grid3X3 className="w-4 h-4" />}
              >
                Grid
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                leftIcon={<List className="w-4 h-4" />}
              >
                List
              </Button>
              <Button
                variant={viewMode === 'map' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('map')}
                leftIcon={<MapIcon className="w-4 h-4" />}
              >
                Map
              </Button>
            </div>
            
            <Button
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setShowAddLocation(true)}
            >
              Add Location
            </Button>
            
            <Button
              variant="outline"
              leftIcon={<Download className="w-4 h-4" />}
            >
              Export List
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-100 text-sm font-medium">Total Locations</p>
                  <p className="text-2xl font-bold">{locations.length}</p>
                </div>
                <MapPin className="w-8 h-8 text-white/80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Booked</p>
                  <p className="text-2xl font-bold">
                    {locations.filter(l => l.status === 'booked').length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-white/80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Confirmed</p>
                  <p className="text-2xl font-bold">
                    {locations.filter(l => l.status === 'confirmed').length}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-white/80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm font-medium">Scouting</p>
                  <p className="text-2xl font-bold">
                    {locations.filter(l => l.status === 'scouting').length}
                  </p>
                </div>
                <Search className="w-8 h-8 text-white/80" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Search & Filter Locations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search locations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Status</option>
                <option value="scouting">Scouting</option>
                <option value="confirmed">Confirmed</option>
                <option value="booked">Booked</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
              
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Types</option>
                <option value="interior">Interior</option>
                <option value="exterior">Exterior</option>
                <option value="studio">Studio</option>
                <option value="public">Public</option>
                <option value="private">Private</option>
                <option value="natural">Natural</option>
              </select>
              
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Categories</option>
                <option value="residential">Residential</option>
                <option value="commercial">Commercial</option>
                <option value="industrial">Industrial</option>
                <option value="outdoor">Outdoor</option>
                <option value="institutional">Institutional</option>
                <option value="entertainment">Entertainment</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Locations Display */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredLocations.map((location) => (
              <motion.div
                key={location.id}
                whileHover={{ scale: 1.02 }}
                className="cursor-pointer"
                onClick={() => setSelectedLocation(location)}
              >
                <Card className="h-full hover:shadow-lg transition-shadow overflow-hidden">
                  {/* Location Image */}
                  <div className="relative h-48 bg-gray-200">
                    {location.images.length > 0 ? (
                      <img
                        src={location.images[0]}
                        alt={location.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`${location.images.length > 0 ? 'hidden' : ''} absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200`}>
                      <ImageIcon className="w-12 h-12 text-gray-400" />
                    </div>
                    
                    <div className="absolute top-3 left-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(location.status)}`}>
                        {location.status}
                      </span>
                    </div>
                    
                    <div className="absolute top-3 right-3 flex items-center gap-1">
                      {renderStars(location.rating)}
                    </div>
                  </div>
                  
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-1">
                          {location.name}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          {getLocationTypeIcon(location.type)}
                          <span className="capitalize">{location.type}</span>
                          <span>•</span>
                          {getCategoryIcon(location.category)}
                          <span className="capitalize">{location.category}</span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {location.description}
                      </p>
                      
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <MapPin className="w-4 h-4" />
                        <span className="truncate">{location.address}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            ${location.pricing.rate}/{location.pricing.unit}
                          </span>
                          {location.scenes.length > 0 && (
                            <span className="flex items-center gap-1">
                              <Camera className="w-4 h-4" />
                              {location.scenes.length} scenes
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center gap-2">
                          {location.power.available && (
                            <div className="w-6 h-6 bg-green-100 rounded flex items-center justify-center">
                              <Zap className="w-3 h-3 text-green-600" />
                            </div>
                          )}
                          {location.parking.available && (
                            <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
                              <Car className="w-3 h-3 text-blue-600" />
                            </div>
                          )}
                          {location.accessibility.wheelchairAccessible && (
                            <div className="w-6 h-6 bg-purple-100 rounded flex items-center justify-center">
                              <Users className="w-3 h-3 text-purple-600" />
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <Button size="icon-sm" variant="ghost">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="icon-sm" variant="ghost">
                            <Edit3 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : viewMode === 'list' ? (
          <div className="space-y-4">
            {filteredLocations.map((location) => (
              <motion.div
                key={location.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-6">
                      {/* Location Image */}
                      <div className="w-32 h-24 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                        {location.images.length > 0 ? (
                          <img
                            src={location.images[0]}
                            alt={location.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`${location.images.length > 0 ? 'hidden' : ''} w-full h-full flex items-center justify-center`}>
                          <ImageIcon className="w-8 h-8 text-gray-400" />
                        </div>
                      </div>
                      
                      {/* Location Details */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-xl font-semibold text-gray-900 mb-1">
                              {location.name}
                            </h3>
                            <div className="flex items-center gap-3 text-sm text-gray-600 mb-2">
                              <div className="flex items-center gap-1">
                                {getLocationTypeIcon(location.type)}
                                <span className="capitalize">{location.type}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                {getCategoryIcon(location.category)}
                                <span className="capitalize">{location.category}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                {renderStars(location.rating)}
                                <span>({location.rating})</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(location.status)}`}>
                              {location.status}
                            </span>
                            <div className="flex items-center gap-1">
                              <Button size="icon-sm" variant="ghost">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button size="icon-sm" variant="ghost">
                                <Edit3 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        
                        <p className="text-gray-600 mb-3 line-clamp-2">
                          {location.description}
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <MapPin className="w-4 h-4" />
                            <span className="truncate">{location.address}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 text-gray-600">
                            <DollarSign className="w-4 h-4" />
                            <span>${location.pricing.rate}/{location.pricing.unit}</span>
                          </div>
                          
                          {location.scenes.length > 0 && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <Camera className="w-4 h-4" />
                              <span>{location.scenes.length} scenes assigned</span>
                            </div>
                          )}
                          
                          {location.contact.phone && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <Phone className="w-4 h-4" />
                              <span>{location.contact.phone}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 mt-3 pt-3 border-t">
                          <div className="flex items-center gap-2">
                            {location.power.available && (
                              <div className="flex items-center gap-1 text-xs text-green-600">
                                <Zap className="w-3 h-3" />
                                <span>Power</span>
                              </div>
                            )}
                            {location.parking.available && (
                              <div className="flex items-center gap-1 text-xs text-blue-600">
                                <Car className="w-3 h-3" />
                                <span>Parking</span>
                              </div>
                            )}
                            {location.accessibility.wheelchairAccessible && (
                              <div className="flex items-center gap-1 text-xs text-purple-600">
                                <Users className="w-3 h-3" />
                                <span>Accessible</span>
                              </div>
                            )}
                          </div>
                          
                          {location.permits.required && (
                            <div className="flex items-center gap-1 text-xs">
                              {location.permits.obtained ? (
                                <>
                                  <CheckCircle className="w-3 h-3 text-green-600" />
                                  <span className="text-green-600">Permits Obtained</span>
                                </>
                              ) : (
                                <>
                                  <AlertTriangle className="w-3 h-3 text-yellow-600" />
                                  <span className="text-yellow-600">Permits Required</span>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          /* Satellite Map View */
          <Card>
            <CardContent className="p-6">
              <SatelliteMapView
                locations={filteredLocations}
                selectedLocation={selectedLocation}
                onLocationSelect={handleLocationSelect}
                height="700px"
              />
            </CardContent>
          </Card>
        )}

        {filteredLocations.length === 0 && (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No locations found</h3>
              <p className="text-gray-600">Try adjusting your search or filter criteria</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Location Modal */}
      <AnimatePresence>
        {showAddLocation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Add New Location</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    setShowAddLocation(false);
                    // Reset form on close
                    setNewLocation({
                      name: '',
                      type: 'interior',
                      category: 'residential',
                      address: '',
                      description: '',
                      contactName: '',
                      contactPhone: '',
                      contactEmail: '',
                      rate: 0,
                      unit: 'day',
                      status: 'scouting',
                      latitude: '',
                      longitude: ''
                    });
                  }}
                >
                  ×
                </Button>
              </div>
              
              <div className="p-6 space-y-4">
                {/* Basic Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location Name *
                    </label>
                    <Input
                      placeholder="e.g., Downtown Studio, Beach House"
                      value={newLocation.name}
                      onChange={(e) => setNewLocation({...newLocation, name: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Status
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      value={newLocation.status}
                      onChange={(e) => setNewLocation({...newLocation, status: e.target.value as Location['status']})}
                    >
                      <option value="scouting">Scouting</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="booked">Booked</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                {/* Type and Category */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Type
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      value={newLocation.type}
                      onChange={(e) => setNewLocation({...newLocation, type: e.target.value as Location['type']})}
                    >
                      <option value="interior">Interior</option>
                      <option value="exterior">Exterior</option>
                      <option value="studio">Studio</option>
                      <option value="public">Public</option>
                      <option value="private">Private</option>
                      <option value="natural">Natural</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      value={newLocation.category}
                      onChange={(e) => setNewLocation({...newLocation, category: e.target.value as Location['category']})}
                    >
                      <option value="residential">Residential</option>
                      <option value="commercial">Commercial</option>
                      <option value="industrial">Industrial</option>
                      <option value="outdoor">Outdoor</option>
                      <option value="institutional">Institutional</option>
                      <option value="entertainment">Entertainment</option>
                    </select>
                  </div>
                </div>

                {/* Address and Coordinates */}
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-md font-medium text-gray-900 mb-3">Location Details</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Address *
                    </label>
                    <Input
                      placeholder="Enter full address"
                      value={newLocation.address}
                      onChange={(e) => setNewLocation({...newLocation, address: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Latitude (Optional)
                      </label>
                      <Input
                        placeholder="e.g., 34.0522"
                        value={newLocation.latitude}
                        onChange={(e) => setNewLocation({...newLocation, latitude: e.target.value})}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Longitude (Optional)
                      </label>
                      <Input
                        placeholder="e.g., -118.2437"
                        value={newLocation.longitude}
                        onChange={(e) => setNewLocation({...newLocation, longitude: e.target.value})}
                      />
                    </div>
                  </div>
                  
                  <div className="mt-2 text-xs text-gray-500">
                    💡 <strong>Tip:</strong> Add coordinates to show exact location on satellite map. You can get these from Google Maps by right-clicking on a location.
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    rows={3}
                    placeholder="Describe the location, its features, and what makes it suitable for filming"
                    value={newLocation.description}
                    onChange={(e) => setNewLocation({...newLocation, description: e.target.value})}
                  />
                </div>

                {/* Contact Information */}
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-md font-medium text-gray-900 mb-3">Contact Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Contact Name
                      </label>
                      <Input
                        placeholder="Contact person"
                        value={newLocation.contactName}
                        onChange={(e) => setNewLocation({...newLocation, contactName: e.target.value})}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Phone
                      </label>
                      <Input
                        placeholder="(555) 123-4567"
                        value={newLocation.contactPhone}
                        onChange={(e) => setNewLocation({...newLocation, contactPhone: e.target.value})}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Email
                      </label>
                      <Input
                        placeholder="contact@location.com"
                        type="email"
                        value={newLocation.contactEmail}
                        onChange={(e) => setNewLocation({...newLocation, contactEmail: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                {/* Pricing */}
                <div className="border-t border-gray-200 pt-4">
                  <h4 className="text-md font-medium text-gray-900 mb-3">Pricing</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Rate ($)
                      </label>
                      <Input
                        type="number"
                        placeholder="0"
                        min="0"
                        value={newLocation.rate}
                        onChange={(e) => setNewLocation({...newLocation, rate: Number(e.target.value)})}
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Unit
                      </label>
                      <select
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        value={newLocation.unit}
                        onChange={(e) => setNewLocation({...newLocation, unit: e.target.value as 'hour' | 'day' | 'week' | 'flat'})}
                      >
                        <option value="hour">Per Hour</option>
                        <option value="day">Per Day</option>
                        <option value="week">Per Week</option>
                        <option value="flat">Flat Rate</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowAddLocation(false);
                    setNewLocation({
                      name: '',
                      type: 'interior',
                      category: 'residential',
                      address: '',
                      description: '',
                      contactName: '',
                      contactPhone: '',
                      contactEmail: '',
                      rate: 0,
                      unit: 'day',
                      status: 'scouting',
                      latitude: '',
                      longitude: ''
                    });
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddLocation}
                  disabled={!newLocation.name.trim() || !newLocation.address.trim()}
                >
                  Add Location
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
};

export default LocationsPage;
