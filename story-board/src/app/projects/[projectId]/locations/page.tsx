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
import { useAppDispatch, useAppSelector } from '@/lib/store';
import { fetchLocations, createLocation, updateLocation, deleteLocation } from '@/lib/store/locationSlice';
import type { Location } from '@/lib/store/locationSlice';
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



const LocationsPage = () => {
  useRequireAuth();
  const params = useParams();
  const projectId = params.projectId as string;
  const { project, isLoading } = useCurrentProject(projectId);

  // Redux hooks
  const dispatch = useAppDispatch();
  const { locations, isLoading: locationsLoading } = useAppSelector((state) => state.locations);

  // Fetch locations on component mount
  useEffect(() => {
    if (projectId) {
      dispatch(fetchLocations(projectId));
    }
  }, [projectId, dispatch]);

  const [selectedLocation, setSelectedLocation] = useState<any>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'map'>('grid');
  const [showAddLocation, setShowAddLocation] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // New location form state
  const [newLocation, setNewLocation] = useState({
    name: '',
    type: 'indoor' as 'studio' | 'outdoor' | 'indoor' | 'public' | 'private' | 'green-screen' | 'practical',
    address: '',
    description: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    rate: 0,
    status: 'scouting' as 'scouting' | 'approved' | 'booked' | 'confirmed' | 'completed' | 'cancelled' | 'unavailable',
    latitude: '',
    longitude: ''
  });

  const handleLocationSelect = (mapLocation: { id: string; name: string; type: string; address: string; coordinates?: { lat: number; lng: number }; description?: string; status: string }) => {
    // Find the full location data from our locations array
    const fullLocation = locations.find(loc => loc._id === mapLocation.id);
    if (fullLocation) {
      setSelectedLocation(fullLocation);
    }
  };

  const handleExportLocations = () => {
    const printWindow = window.open('', '', 'height=800,width=800');
    if (!printWindow) {
      toast.error('Failed to open print window. Please allow popups.');
      return;
    }

    const content = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${project?.title || 'Project'} - Locations</title>
          <style>
            @page {
              margin: 1in;
            }
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
            h1 {
              color: #4f46e5;
              border-bottom: 3px solid #4f46e5;
              padding-bottom: 10px;
              margin-bottom: 30px;
            }
            h2 {
              color: #6366f1;
              margin-top: 30px;
              margin-bottom: 15px;
            }
            .location {
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              padding: 20px;
              margin-bottom: 25px;
              background: #f9fafb;
              page-break-inside: avoid;
            }
            .location-header {
              display: flex;
              justify-content: space-between;
              align-items: start;
              margin-bottom: 15px;
            }
            .location-title {
              font-size: 18px;
              font-weight: bold;
              color: #1f2937;
            }
            .status-badge {
              padding: 4px 12px;
              border-radius: 12px;
              font-size: 12px;
              font-weight: 600;
              text-transform: capitalize;
            }
            .status-booked, .status-confirmed {
              background: #d1fae5;
              color: #065f46;
            }
            .status-scouting, .status-approved {
              background: #dbeafe;
              color: #1e40af;
            }
            .status-completed {
              background: #e9d5ff;
              color: #6b21a8;
            }
            .status-cancelled {
              background: #fef3c7;
              color: #92400e;
            }
            .status-unavailable {
              background: #fee2e2;
              color: #991b1b;
            }
            .location-info {
              margin-bottom: 10px;
              display: grid;
              grid-template-columns: 1fr 1fr;
              gap: 10px;
            }
            .info-row {
              display: flex;
              align-items: start;
            }
            .info-label {
              font-weight: 600;
              color: #4b5563;
              min-width: 100px;
            }
            .info-value {
              color: #1f2937;
            }
            .description {
              margin-top: 10px;
              padding: 10px;
              background: white;
              border-radius: 4px;
              color: #4b5563;
            }
            .stats {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 20px;
              margin-bottom: 30px;
              padding: 20px;
              background: #f3f4f6;
              border-radius: 8px;
            }
            .stat-item {
              text-align: center;
            }
            .stat-value {
              font-size: 32px;
              font-weight: bold;
              color: #4f46e5;
            }
            .stat-label {
              font-size: 12px;
              color: #6b7280;
              text-transform: uppercase;
              margin-top: 5px;
            }
            @media print {
              .location {
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          <h1>${project?.title || 'Project'} - Location List</h1>
          
          <div class="stats">
            <div class="stat-item">
              <div class="stat-value">${locations.length}</div>
              <div class="stat-label">Total Locations</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${locations.filter(l => l.status === 'booked').length}</div>
              <div class="stat-label">Booked</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${locations.filter(l => l.status === 'scouting').length}</div>
              <div class="stat-label">Scouting</div>
            </div>
            <div class="stat-item">
              <div class="stat-value">${locations.filter(l => l.status === 'confirmed').length}</div>
              <div class="stat-label">Confirmed</div>
            </div>
          </div>

          <h2>Locations</h2>
          ${filteredLocations.map(location => `
            <div class="location">
              <div class="location-header">
                <div class="location-title">${location.name}</div>
                <span class="status-badge status-${location.status}">${location.status}</span>
              </div>
              
              <div class="location-info">
                <div class="info-row">
                  <span class="info-label">Type:</span>
                  <span class="info-value">${location.type}</span>
                </div>
                <div class="info-row">
                  <span class="info-label">Address:</span>
                  <span class="info-value">${location.address}</span>
                </div>
                ${location.cost ? `
                  <div class="info-row">
                    <span class="info-label">Daily Rate:</span>
                    <span class="info-value">$${location.cost.daily} ${location.cost.currency}</span>
                  </div>
                ` : ''}
                ${location.contact?.name ? `
                  <div class="info-row">
                    <span class="info-label">Contact:</span>
                    <span class="info-value">${location.contact.name}</span>
                  </div>
                ` : ''}
                ${location.contact?.phone ? `
                  <div class="info-row">
                    <span class="info-label">Phone:</span>
                    <span class="info-value">${location.contact.phone}</span>
                  </div>
                ` : ''}
                ${location.contact?.email ? `
                  <div class="info-row">
                    <span class="info-label">Email:</span>
                    <span class="info-value">${location.contact.email}</span>
                  </div>
                ` : ''}
                ${location.coordinates ? `
                  <div class="info-row">
                    <span class="info-label">Coordinates:</span>
                    <span class="info-value">${location.coordinates.latitude}, ${location.coordinates.longitude}</span>
                  </div>
                ` : ''}
              </div>
              
              ${location.description ? `
                <div class="description">
                  <strong>Description:</strong><br>
                  ${location.description}
                </div>
              ` : ''}
            </div>
          `).join('')}
        </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const handleAddLocation = async () => {
    if (!newLocation.name.trim() || !newLocation.address.trim()) {
      toast.error('Please fill in location name and address');
      return;
    }

    const locationData = {
      name: newLocation.name.trim(),
      type: newLocation.type,
      address: newLocation.address.trim(),
      coordinates: (newLocation.latitude && newLocation.longitude) ? {
        latitude: parseFloat(newLocation.latitude),
        longitude: parseFloat(newLocation.longitude)
      } : undefined,
      description: newLocation.description.trim() || undefined,
      contact: (newLocation.contactName.trim() || newLocation.contactPhone.trim() || newLocation.contactEmail.trim()) ? {
        name: newLocation.contactName.trim(),
        phone: newLocation.contactPhone.trim() || undefined,
        email: newLocation.contactEmail.trim() || undefined,
      } : undefined,
      cost: newLocation.rate > 0 ? {
        daily: newLocation.rate,
        currency: 'USD'
      } : undefined,
      status: newLocation.status,
      notes: newLocation.description.trim() || undefined,
    };

    try {
      await dispatch(createLocation({ projectId, locationData })).unwrap();
      setShowAddLocation(false);
      
      // Reset form
      setNewLocation({
        name: '',
        type: 'indoor',
        address: '',
        description: '',
        contactName: '',
        contactPhone: '',
        contactEmail: '',
        rate: 0,
        status: 'scouting',
        latitude: '',
        longitude: ''
      });

      toast.success('Location added successfully!');
    } catch (error: any) {
      toast.error(error || 'Failed to add location');
    }
  };



  const getLocationTypeIcon = (type: string) => {
    switch (type) {
      case 'indoor':
        return <Home className="w-4 h-4" />;
      case 'outdoor':
        return <TreePine className="w-4 h-4" />;
      case 'studio':
        return <Camera className="w-4 h-4" />;
      case 'public':
        return <Building className="w-4 h-4" />;
      case 'private':
        return <Home className="w-4 h-4" />;
      case 'green-screen':
        return <Camera className="w-4 h-4" />;
      case 'practical':
        return <MapPin className="w-4 h-4" />;
      default:
        return <MapPin className="w-4 h-4" />;
    }
  };

  const getCategoryIcon = (type: string) => {
    switch (type) {
      case 'indoor':
        return <Home className="w-4 h-4" />;
      case 'outdoor':
        return <TreePine className="w-4 h-4" />;
      case 'studio':
        return <Camera className="w-4 h-4" />;
      case 'public':
        return <Building className="w-4 h-4" />;
      case 'private':
        return <Home className="w-4 h-4" />;
      case 'green-screen':
        return <Camera className="w-4 h-4" />;
      case 'practical':
        return <MapPin className="w-4 h-4" />;
      default:
        return <MapPin className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'booked':
      case 'confirmed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'scouting':
      case 'approved':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'cancelled':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'unavailable':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredLocations = locations.filter(location => {
    const matchesSearch = location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         location.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (location.description && location.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = typeFilter === 'all' || location.type === typeFilter;
    const matchesStatus = statusFilter === 'all' || location.status === statusFilter;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  // Convert Redux locations to SatelliteMapLocation format
  const mapLocations = filteredLocations.map(location => ({
    id: location._id,
    name: location.name,
    type: location.type,
    category: location.type, // Use type as category since we don't have category field
    address: location.address,
    coordinates: location.coordinates ? {
      lat: location.coordinates.latitude,
      lng: location.coordinates.longitude
    } : undefined,
    description: location.description || '',
    status: location.status,
    pricing: {
      rate: location.cost?.daily || 0,
      unit: 'day'
    }
  }));



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
              onClick={handleExportLocations}
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
                  <p className="text-blue-100 text-sm font-medium">Scouting</p>
                  <p className="text-2xl font-bold">
                    {locations.filter(l => l.status === 'scouting').length}
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
                  <p className="text-yellow-100 text-sm font-medium">Confirmed</p>
                  <p className="text-2xl font-bold">
                    {locations.filter(l => l.status === 'confirmed').length}
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
                <option value="approved">Approved</option>
                <option value="booked">Booked</option>
                <option value="confirmed">Confirmed</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="unavailable">Unavailable</option>
              </select>
              
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Types</option>
                <option value="indoor">Indoor</option>
                <option value="outdoor">Outdoor</option>
                <option value="studio">Studio</option>
                <option value="public">Public</option>
                <option value="private">Private</option>
                <option value="green-screen">Green Screen</option>
                <option value="practical">Practical</option>
                <option value="virtual">Virtual</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Locations Display */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredLocations.map((location) => (
              <motion.div
                key={location._id}
                whileHover={{ scale: 1.02 }}
                className="cursor-pointer"
                onClick={() => setSelectedLocation(location)}
              >
                <Card className="h-full hover:shadow-lg transition-shadow overflow-hidden">
                  {/* Location Image */}
                  <div className="relative h-48 bg-gray-200">
                    {location.images && location.images.length > 0 ? (
                      <img
                        src={location.images[0].url}
                        alt={location.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <div className={`${location.images && location.images.length > 0 ? 'hidden' : ''} absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200`}>
                      <ImageIcon className="w-12 h-12 text-gray-400" />
                    </div>
                    
                    <div className="absolute top-3 left-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(location.status)}`}>
                        {location.status}
                      </span>
                    </div>
                    
                    <div className="absolute top-3 right-3 flex items-center gap-1">
                      <Star className="w-4 h-4 text-gray-300" />
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
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {location.description || 'No description available'}
                      </p>
                      
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <MapPin className="w-4 h-4" />
                        <span className="truncate">{location.address}</span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          {location.cost && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="w-4 h-4" />
                              ${location.cost.daily}/{location.cost.currency}
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between pt-2 border-t">
                        <div className="flex items-center gap-2">
                          {location.equipment?.power && (
                            <div className="w-6 h-6 bg-green-100 rounded flex items-center justify-center">
                              <Zap className="w-3 h-3 text-green-600" />
                            </div>
                          )}
                          {location.equipment?.parking?.available && (
                            <div className="w-6 h-6 bg-blue-100 rounded flex items-center justify-center">
                              <Car className="w-3 h-3 text-blue-600" />
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
                key={location._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start gap-6">
                      {/* Location Image */}
                      <div className="w-32 h-24 bg-gray-200 rounded-lg flex-shrink-0 overflow-hidden">
                        {location.images && location.images.length > 0 ? (
                          <img
                            src={location.images[0].url}
                            alt={location.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`${location.images && location.images.length > 0 ? 'hidden' : ''} w-full h-full flex items-center justify-center`}>
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
                          {location.description || 'No description available'}
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                          <div className="flex items-center gap-2 text-gray-600">
                            <MapPin className="w-4 h-4" />
                            <span className="truncate">{location.address}</span>
                          </div>
                          
                          {location.cost && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <DollarSign className="w-4 h-4" />
                              <span>${location.cost.daily}/{location.cost.currency}</span>
                            </div>
                          )}
                          
                          {location.contact?.phone && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <Phone className="w-4 h-4" />
                              <span>{location.contact.phone}</span>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 mt-3 pt-3 border-t">
                          <div className="flex items-center gap-2">
                            {location.equipment?.power && (
                              <div className="flex items-center gap-1 text-xs text-green-600">
                                <Zap className="w-3 h-3" />
                                <span>Power Available</span>
                              </div>
                            )}
                            {location.equipment?.parking?.available && (
                              <div className="flex items-center gap-1 text-xs text-blue-600">
                                <Car className="w-3 h-3" />
                                <span>Parking</span>
                              </div>
                            )}
                          </div>
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
                locations={mapLocations}
                selectedLocation={selectedLocation ? {
                  id: selectedLocation._id,
                  name: selectedLocation.name,
                  type: selectedLocation.type,
                  category: selectedLocation.type,
                  address: selectedLocation.address,
                  coordinates: selectedLocation.coordinates ? {
                    lat: selectedLocation.coordinates.latitude,
                    lng: selectedLocation.coordinates.longitude
                  } : undefined,
                  description: selectedLocation.description || '',
                  status: selectedLocation.status,
                  pricing: {
                    rate: selectedLocation.cost?.daily || 0,
                    unit: 'day'
                  }
                } : null}
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
                      type: 'indoor',
                      address: '',
                      description: '',
                      contactName: '',
                      contactPhone: '',
                      contactEmail: '',
                      rate: 0,
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
                      onChange={(e) => setNewLocation({...newLocation, status: e.target.value as 'scouting' | 'approved' | 'booked' | 'confirmed' | 'completed' | 'cancelled' | 'unavailable'})}
                    >
                      <option value="scouting">Scouting</option>
                      <option value="approved">Approved</option>
                      <option value="booked">Booked</option>
                      <option value="confirmed">Confirmed</option>
                      <option value="completed">Completed</option>
                      <option value="cancelled">Cancelled</option>
                      <option value="unavailable">Unavailable</option>
                    </select>
                  </div>
                </div>

                {/* Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type
                  </label>
                  <select
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    value={newLocation.type}
                    onChange={(e) => setNewLocation({...newLocation, type: e.target.value as 'studio' | 'outdoor' | 'indoor' | 'public' | 'private' | 'green-screen' | 'practical'})}
                  >
                    <option value="indoor">Indoor</option>
                    <option value="outdoor">Outdoor</option>
                    <option value="studio">Studio</option>
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                    <option value="green-screen">Green Screen</option>
                    <option value="practical">Practical</option>
                  </select>
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
c
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Daily Rate ($)
                    </label>
                    <Input
                      type="number"
                      placeholder="0"
                      min="0"
                      value={newLocation.rate}
                      onChange={(e) => setNewLocation({...newLocation, rate: Number(e.target.value)})}
                    />
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
                      type: 'indoor',
                      address: '',
                      description: '',
                      contactName: '',
                      contactPhone: '',
                      contactEmail: '',
                      rate: 0,
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
