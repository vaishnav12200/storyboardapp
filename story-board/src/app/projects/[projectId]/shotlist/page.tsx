'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'next/navigation';
import {
  Plus,
  Camera,
  Search,
  Filter,
  Download,
  Upload,
  Edit3,
  Trash2,
  Eye,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RotateCcw,
  Zap,
  Clock,
  MapPin,
  Users,
  FileText,
  Image as ImageIcon,
  Video,
  Mic,
  Settings,
  Star,
  Flag,
  AlertTriangle,
  CheckCircle,
  Grid3X3,
  List,
  Calendar,
  Target,
  Aperture,
  Focus,
  Palette,
  Volume2,
  Move,
  Maximize,
  MoreHorizontal,
} from 'lucide-react';
import { useRequireAuth } from '@/hooks/useAuth';
import { useCurrentProject } from '@/hooks/useProjects';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useAppDispatch, useAppSelector } from '@/lib/store';
import { fetchShotLists, createShot, updateShot, deleteShot } from '@/lib/store/shotlistSlice';
import type { Shot } from '@/lib/store/shotlistSlice';
import { toast } from 'react-hot-toast';



const ShotlistPage = () => {
  useRequireAuth();
  const params = useParams();
  const projectId = params.projectId as string;
  const { project, isLoading } = useCurrentProject(projectId);

  // Redux hooks
  const dispatch = useAppDispatch();
  const { shotLists, shots, isLoading: shotListLoading } = useAppSelector((state) => state.shotlist);

  // Fetch shot lists on component mount
  useEffect(() => {
    if (projectId) {
      dispatch(fetchShotLists(projectId));
    }
  }, [projectId, dispatch]);

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [shotTypeFilter, setShotTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('shotNumber');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [selectedShot, setSelectedShot] = useState<Shot | null>(null);
  const [showAddShot, setShowAddShot] = useState(false);
  const [showShotDetails, setShowShotDetails] = useState(false);
  const [newShotNumber, setNewShotNumber] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newShotType, setNewShotType] = useState<'wide' | 'medium' | 'close-up' | 'extreme-close-up' | 'insert' | 'cutaway' | 'establishing' | 'master'>('medium');
  const [newCameraMovement, setNewCameraMovement] = useState<'static' | 'pan' | 'tilt' | 'zoom' | 'dolly' | 'track' | 'handheld' | 'steadicam'>('static');
  const [newLocation, setNewLocation] = useState('');
  const [editingShot, setEditingShot] = useState<Shot | null>(null);

  // Initialize shots data
  useEffect(() => {
    // Data is now fetched via Redux
  }, [project]);

  const handleAddShot = async () => {
    if (newShotNumber.trim() && newDescription.trim()) {
      if (editingShot) {
        // Update existing shot
        try {
          const shotData = {
            shotNumber: newShotNumber.trim(),
            description: newDescription.trim(),
            shotType: newShotType,
            movement: newCameraMovement,
            location: newLocation.trim() || undefined
          };
          await dispatch(updateShot({ 
            projectId, 
            shotId: editingShot._id || editingShot.id || '', 
            shotData 
          })).unwrap();
          setEditingShot(null);
          toast.success('Shot updated successfully!');
        } catch (error: any) {
          toast.error(error || 'Failed to update shot');
        }
      } else {
        // Add new shot
        try {
          const shotData = {
            shotNumber: newShotNumber.trim(),
            description: newDescription.trim(),
            shotType: newShotType,
            cameraAngle: 'eye-level' as const,
            movement: newCameraMovement,
            duration: 30, // default 30 seconds
            location: newLocation.trim() || undefined,
            status: 'planned' as const,
            priority: 'medium' as const
          };
          
          await dispatch(createShot({ projectId, shotData })).unwrap();
          toast.success('Shot added successfully!');
        } catch (error: any) {
          toast.error(error || 'Failed to add shot');
        }
      }

      // Reset form
      setNewShotNumber('');
      setNewDescription('');
      setNewShotType('medium');
      setNewCameraMovement('static');
      setNewLocation('');
      setShowAddShot(false);
    } else {
      toast.error('Please fill in shot number and description');
    }
  };

  const handleEditShot = (shot: Shot) => {
    setEditingShot(shot);
    setNewShotNumber(shot.shotNumber);
    setNewDescription(shot.description);
    setNewShotType(shot.shotType);
    setNewCameraMovement(shot.movement || 'static');
    setNewLocation(shot.location || '');
    setShowAddShot(true);
  };

  const handleDeleteShot = async (shotId: string) => {
    try {
      await dispatch(deleteShot({ projectId, shotId })).unwrap();
      toast.success('Shot deleted successfully!');
    } catch (error) {
      toast.error('Failed to delete shot');
    }
  };

  const getShotTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'wide': 'Wide Shot',
      'medium': 'Medium Shot',
      'close-up': 'Close-Up',
      'extreme-close-up': 'Extreme Close-Up',
      'insert': 'Insert',
      'cutaway': 'Cutaway',
      'establishing': 'Establishing Shot',
      'master': 'Master Shot',
    };
    return labels[type] || type;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'planned':
        return <Clock className="w-4 h-4 text-gray-500" />;
      case 'ready':
        return <CheckCircle className="w-4 h-4 text-blue-500" />;
      case 'in-progress':
        return <Video className="w-4 h-4 text-orange-500" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'cancelled':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'low':
        return 'bg-gray-100 text-gray-700 border-gray-200';
      case 'medium':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'high':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const filteredShots = shots.filter(shot => {
    const matchesSearch = shot.shotNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         shot.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (shot.location && shot.location.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === 'all' || shot.status === statusFilter;
    const matchesShotType = shotTypeFilter === 'all' || shot.shotType === shotTypeFilter;
    const matchesPriority = priorityFilter === 'all' || shot.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesShotType && matchesPriority;
  });

  const sortedShots = filteredShots.sort((a, b) => {
    switch (sortBy) {
      case 'shotNumber':
        return a.shotNumber.localeCompare(b.shotNumber);
      case 'status':
        return a.status.localeCompare(b.status);
      case 'priority':
        const priorityOrder = { 'critical': 4, 'high': 3, 'medium': 2, 'low': 1 };
        return (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - 
               (priorityOrder[a.priority as keyof typeof priorityOrder] || 0);
      case 'duration':
        return (b.duration || 0) - (a.duration || 0);
      default:
        return 0;
    }
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Shot List</h1>
            <p className="text-gray-600 mt-1">
              Plan and track every shot for your production
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
              className="flex items-center gap-2"
            >
              {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid3X3 className="w-4 h-4" />}
              {viewMode === 'grid' ? 'List View' : 'Grid View'}
            </Button>
            <Button
              onClick={() => setShowAddShot(true)}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Shot
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Shots</p>
                  <p className="text-2xl font-bold text-gray-900">{shots.length}</p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-green-600">
                    {shots.filter(s => s.status === 'completed').length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Duration</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {Math.round(shots.reduce((acc, shot) => acc + (shot.duration || 0), 0))}s
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Shots</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {shots.length}
                  </p>
                </div>
                <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                  <Target className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters & Search
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search shots..."
                  className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <select
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="planned">Planned</option>
                <option value="ready">Ready</option>
                <option value="in-progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>

              <select
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={shotTypeFilter}
                onChange={(e) => setShotTypeFilter(e.target.value)}
              >
                <option value="all">All Shot Types</option>
                <option value="wide">Wide Shot</option>
                <option value="medium">Medium Shot</option>
                <option value="close-up">Close-Up</option>
                <option value="extreme-close-up">Extreme Close-Up</option>
                <option value="insert">Insert</option>
                <option value="cutaway">Cutaway</option>
                <option value="establishing">Establishing</option>
                <option value="master">Master</option>
              </select>

              <select
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              >
                <option value="all">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>

              <select
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="shotNumber">Sort by Shot Number</option>
                <option value="status">Sort by Status</option>
                <option value="priority">Sort by Priority</option>
                <option value="duration">Sort by Duration</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Shot List */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Camera className="w-5 h-5" />
              Shot List ({filteredShots.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sortedShots.length === 0 ? (
              <div className="text-center py-12">
                <Camera className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">No shots yet</h3>
                <p className="mt-2 text-gray-500">
                  {shots.length === 0 
                    ? "Get started by creating your first shot."
                    : "No shots match your current filters."
                  }
                </p>
                {shots.length === 0 && (
                  <Button
                    onClick={() => setShowAddShot(true)}
                    className="mt-4 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Shot
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {sortedShots.map((shot, index) => (
                  <motion.div
                    key={shot.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => {
                      setSelectedShot(shot);
                      setShowShotDetails(true);
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                            {shot.shotNumber}
                          </span>
                          {shot.sceneId && (
                            <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm">
                              Scene {shot.sceneId}
                            </span>
                          )}
                          <div className="flex items-center gap-1">
                            {getStatusIcon(shot.status)}
                            <span className="text-sm text-gray-600 capitalize">{shot.status}</span>
                          </div>
                          <span className={`px-2 py-1 rounded text-xs border ${getPriorityColor(shot.priority)}`}>
                            {shot.priority}
                          </span>
                        </div>
                        
                        <h3 className="text-lg font-medium text-gray-900 mb-2">{shot.description}</h3>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Target className="w-4 h-4" />
                            <span>{getShotTypeLabel(shot.shotType)}</span>
                          </div>
                          {shot.location && (
                            <div className="flex items-center gap-2">
                              <MapPin className="w-4 h-4" />
                              <span>{shot.location}</span>
                            </div>
                          )}
                          {shot.duration && (
                            <div className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              <span>{shot.duration}s</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEditShot(shot);
                          }}
                          title="Edit shot"
                        >
                          <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteShot(shot._id || shot.id || '');
                          }}
                          className="text-red-600 hover:text-red-700"
                          title="Delete shot"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Shot Modal */}
      <AnimatePresence>
        {showAddShot && (
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
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingShot ? 'Edit Shot' : 'Add New Shot'}
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowAddShot(false)}
                >
                  ×
                </Button>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Shot Number
                    </label>
                    <input
                      type="text"
                      value={newShotNumber}
                      onChange={(e) => setNewShotNumber(e.target.value)}
                      placeholder="e.g. 1A, 2B, 3C"
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={newDescription}
                      onChange={(e) => setNewDescription(e.target.value)}
                      placeholder="Describe the shot content..."
                      rows={3}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary resize-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Shot Type
                      </label>
                      <select
                        value={newShotType}
                        onChange={(e) => setNewShotType(e.target.value as any)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                      >
                        <option value="wide">Wide Shot</option>
                        <option value="medium">Medium Shot</option>
                        <option value="close-up">Close-Up</option>
                        <option value="extreme-close-up">Extreme Close-Up</option>
                        <option value="insert">Insert</option>
                        <option value="cutaway">Cutaway</option>
                        <option value="establishing">Establishing</option>
                        <option value="master">Master</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Camera Movement
                      </label>
                      <select
                        value={newCameraMovement}
                        onChange={(e) => setNewCameraMovement(e.target.value as any)}
                        className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                      >
                        <option value="static">Static</option>
                        <option value="pan">Pan</option>
                        <option value="tilt">Tilt</option>
                        <option value="zoom">Zoom</option>
                        <option value="dolly">Dolly</option>
                        <option value="track">Track</option>
                        <option value="handheld">Handheld</option>
                        <option value="steadicam">Steadicam</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location
                    </label>
                    <input
                      type="text"
                      value={newLocation}
                      onChange={(e) => setNewLocation(e.target.value)}
                      placeholder="Enter shooting location"
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowAddShot(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddShot}
                      className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
                    >
                      {editingShot ? 'Update Shot' : 'Add Shot'}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
};

export default ShotlistPage;