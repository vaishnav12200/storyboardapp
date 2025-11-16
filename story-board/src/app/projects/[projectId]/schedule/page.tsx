'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'next/navigation';
import {
  Plus,
  Calendar,
  Clock,
  MapPin,
  Users,
  Camera,
  AlertTriangle,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Filter,
  Search,
  Download,
  Upload,
  Edit3,
  Trash2,
  Eye,
  Sun,
  Moon,
  Cloud,
  Grid3X3,
  List,
  PlayCircle,
  PauseCircle,
  MoreHorizontal,
  Zap,
  Star,
  Flag,
} from 'lucide-react';
import { useRequireAuth } from '@/hooks/useAuth';
import { useCurrentProject } from '@/hooks/useProjects';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { toast } from 'react-hot-toast';

interface ScheduleEvent {
  id: string;
  title: string;
  type: 'scene' | 'setup' | 'break' | 'meeting' | 'travel' | 'wrap';
  startTime: string;
  endTime: string;
  duration: number; // in minutes
  location: string;
  sceneNumbers?: string[];
  crew: string[];
  equipment: string[];
  notes?: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled' | 'delayed';
  priority: 'low' | 'medium' | 'high' | 'critical';
  weather?: 'sunny' | 'cloudy' | 'rainy' | 'night';
  estimatedCost?: number;
  actualDuration?: number;
  completedAt?: string;
}

interface ShootingDay {
  date: string;
  events: ScheduleEvent[];
  totalDuration: number;
  location: string;
  callTime: string;
  wrapTime: string;
  crewCount: number;
  status: 'upcoming' | 'today' | 'completed' | 'cancelled';
}

const SchedulePage = () => {
  useRequireAuth();
  const params = useParams();
  const projectId = params.projectId as string;
  const { project, isLoading } = useCurrentProject(projectId);

  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'timeline' | 'list'>('calendar');
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [shootingDays, setShootingDays] = useState<ShootingDay[]>([]);
  const [showAddEvent, setShowAddEvent] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventType, setNewEventType] = useState<'scene' | 'setup' | 'break' | 'meeting' | 'travel' | 'wrap'>('scene');
  const [newEventDate, setNewEventDate] = useState('');
  const [newEventStartTime, setNewEventStartTime] = useState('');
  const [newEventEndTime, setNewEventEndTime] = useState('');
  const [newEventLocation, setNewEventLocation] = useState('');
  const [editingEvent, setEditingEvent] = useState<ScheduleEvent | null>(null);
  const [viewingEvent, setViewingEvent] = useState<ScheduleEvent | null>(null);

  // Initialize schedule data
  useEffect(() => {
    if (project) {
      const initialSchedule: ShootingDay[] = [];
      
      setShootingDays(initialSchedule);
    }
  }, [project]);

  const handleAddEvent = () => {
    if (newEventTitle.trim() && newEventDate && newEventStartTime && newEventEndTime) {
      const startDateTime = new Date(`${newEventDate} ${newEventStartTime}`);
      const endDateTime = new Date(`${newEventDate} ${newEventEndTime}`);
      const duration = Math.round((endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60)); // duration in minutes

      if (editingEvent) {
        // Update existing event
        const updatedDays = shootingDays.map(day => ({
          ...day,
          events: day.events.map(event =>
            event.id === editingEvent.id
              ? {
                  ...event,
                  title: newEventTitle.trim(),
                  type: newEventType,
                  startTime: newEventStartTime,
                  endTime: newEventEndTime,
                  duration,
                  location: newEventLocation.trim() || 'TBD'
                }
              : event
          )
        }));
        setShootingDays(updatedDays);
        setEditingEvent(null);
        toast.success('Event updated successfully!');
      } else {
        // Add new event
        const newEvent: ScheduleEvent = {
          id: Date.now().toString(),
          title: newEventTitle.trim(),
          type: newEventType,
          startTime: newEventStartTime,
          endTime: newEventEndTime,
          duration,
          location: newEventLocation.trim() || 'TBD',
          crew: [],
          equipment: [],
          status: 'scheduled',
          priority: 'medium'
        };

        // Find or create shooting day
        const existingDayIndex = shootingDays.findIndex(day => day.date === newEventDate);
        
        if (existingDayIndex >= 0) {
          const updatedDays = [...shootingDays];
          updatedDays[existingDayIndex].events.push(newEvent);
          updatedDays[existingDayIndex].totalDuration += duration;
          setShootingDays(updatedDays);
        } else {
          const newDay: ShootingDay = {
            date: newEventDate,
            events: [newEvent],
            totalDuration: duration,
            location: newEventLocation.trim() || 'TBD',
            callTime: newEventStartTime,
            wrapTime: newEventEndTime,
            crewCount: 0,
            status: 'upcoming'
          };
          setShootingDays([...shootingDays, newDay]);
        }

        toast.success('Event added successfully!');
      }

      // Reset form
      setNewEventTitle('');
      setNewEventType('scene');
      setNewEventDate('');
      setNewEventStartTime('');
      setNewEventEndTime('');
      setNewEventLocation('');
      setShowAddEvent(false);
    }
  };

  const handleEditEvent = (event: ScheduleEvent) => {
    setEditingEvent(event);
    setNewEventTitle(event.title);
    setNewEventType(event.type);
    setNewEventDate(''); // Would need to derive from shooting day
    setNewEventStartTime(event.startTime);
    setNewEventEndTime(event.endTime);
    setNewEventLocation(event.location);
    setShowAddEvent(true);
  };

  const handleViewEvent = (event: ScheduleEvent) => {
    setViewingEvent(event);
  };

  const handleDeleteEvent = (eventId: string) => {
    const updatedDays = shootingDays.map(day => ({
      ...day,
      events: day.events.filter(event => event.id !== eventId)
    })).filter(day => day.events.length > 0);
    
    setShootingDays(updatedDays);
    toast.success('Event deleted successfully!');
  };

  const getEventTypeIcon = (type: string) => {
    switch (type) {
      case 'scene':
        return <Camera className="w-4 h-4" />;
      case 'setup':
        return <Zap className="w-4 h-4" />;
      case 'break':
        return <PauseCircle className="w-4 h-4" />;
      case 'meeting':
        return <Users className="w-4 h-4" />;
      case 'travel':
        return <MapPin className="w-4 h-4" />;
      case 'wrap':
        return <Flag className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getEventTypeColor = (type: string) => {
    switch (type) {
      case 'scene':
        return 'from-blue-500 to-blue-600';
      case 'setup':
        return 'from-green-500 to-green-600';
      case 'break':
        return 'from-gray-500 to-gray-600';
      case 'meeting':
        return 'from-purple-500 to-purple-600';
      case 'travel':
        return 'from-yellow-500 to-yellow-600';
      case 'wrap':
        return 'from-red-500 to-red-600';
      default:
        return 'from-indigo-500 to-indigo-600';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'scheduled':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'delayed':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
        return 'text-red-600';
      case 'high':
        return 'text-orange-600';
      case 'medium':
        return 'text-yellow-600';
      case 'low':
        return 'text-green-600';
      default:
        return 'text-gray-600';
    }
  };

  const getWeatherIcon = (weather?: string) => {
    switch (weather) {
      case 'sunny':
        return <Sun className="w-4 h-4 text-yellow-500" />;
      case 'cloudy':
        return <Cloud className="w-4 h-4 text-gray-500" />;
      case 'rainy':
        return <Cloud className="w-4 h-4 text-blue-500" />;
      case 'night':
        return <Moon className="w-4 h-4 text-indigo-500" />;
      default:
        return null;
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const allEvents = shootingDays.flatMap(day => 
    day.events.map(event => ({ ...event, date: day.date }))
  );

  const filteredEvents = allEvents.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         event.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || event.status === statusFilter;
    const matchesType = typeFilter === 'all' || event.type === typeFilter;
    
    return matchesSearch && matchesStatus && matchesType;
  });

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
            <h1 className="text-3xl font-bold text-gray-900">Production Schedule</h1>
            <p className="text-gray-600">{project?.title}</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <Button
                variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('calendar')}
                leftIcon={<Calendar className="w-4 h-4" />}
              >
                Calendar
              </Button>
              <Button
                variant={viewMode === 'timeline' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('timeline')}
                leftIcon={<Clock className="w-4 h-4" />}
              >
                Timeline
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                leftIcon={<List className="w-4 h-4" />}
              >
                List
              </Button>
            </div>
            
            <Button
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setShowAddEvent(true)}
            >
              Add Event
            </Button>
            
            <Button
              variant="outline"
              leftIcon={<Download className="w-4 h-4" />}
            >
              Export Schedule
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-100 text-sm font-medium">Shooting Days</p>
                  <p className="text-2xl font-bold">{shootingDays.length}</p>
                </div>
                <Calendar className="w-8 h-8 text-white/80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Total Events</p>
                  <p className="text-2xl font-bold">{allEvents.length}</p>
                </div>
                <Clock className="w-8 h-8 text-white/80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Completed</p>
                  <p className="text-2xl font-bold">
                    {allEvents.filter(e => e.status === 'completed').length}
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-white/80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm font-medium">Upcoming</p>
                  <p className="text-2xl font-bold">
                    {allEvents.filter(e => e.status === 'scheduled').length}
                  </p>
                </div>
                <AlertTriangle className="w-8 h-8 text-white/80" />
              </div>
            </CardContent>
          </Card>
        </div>

        {viewMode === 'calendar' ? (
          /* Calendar View */
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {shootingDays.map((day) => (
              <motion.div
                key={day.date}
                whileHover={{ scale: 1.02 }}
                className="cursor-pointer"
              >
                <Card className="h-full hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <div className="text-lg font-bold">
                            {new Date(day.date).toLocaleDateString('en-US', { 
                              weekday: 'short', 
                              month: 'short', 
                              day: 'numeric' 
                            })}
                          </div>
                          <div className="text-sm text-gray-500">
                            {day.callTime} - {day.wrapTime}
                          </div>
                        </div>
                      </CardTitle>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        day.status === 'today' ? 'bg-blue-100 text-blue-800' :
                        day.status === 'completed' ? 'bg-green-100 text-green-800' :
                        day.status === 'upcoming' ? 'bg-gray-100 text-gray-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {day.status}
                      </span>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">📍 {day.location}</span>
                        <span className="text-gray-600">👥 {day.crewCount} crew</span>
                      </div>
                      
                      <div className="space-y-2">
                        {day.events.slice(0, 3).map((event) => (
                          <div key={event.id} className="flex items-center gap-2 text-sm">
                            <div className={`w-6 h-6 bg-gradient-to-r ${getEventTypeColor(event.type)} rounded flex items-center justify-center`}>
                              {getEventTypeIcon(event.type)}
                            </div>
                            <span className="font-medium">{event.startTime}</span>
                            <span className="text-gray-600 truncate">{event.title}</span>
                          </div>
                        ))}
                        
                        {day.events.length > 3 && (
                          <div className="text-sm text-gray-500 pl-8">
                            +{day.events.length - 3} more events
                          </div>
                        )}
                      </div>
                      
                      <div className="pt-2 border-t">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Total Duration</span>
                          <span className="font-medium">{formatDuration(day.totalDuration)}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          /* Timeline/List View */
          <div className="space-y-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Schedule Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search events..."
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
                    <option value="scheduled">Scheduled</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="delayed">Delayed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="all">All Types</option>
                    <option value="scene">Scene</option>
                    <option value="setup">Setup</option>
                    <option value="break">Break</option>
                    <option value="meeting">Meeting</option>
                    <option value="travel">Travel</option>
                    <option value="wrap">Wrap</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Event List */}
            <div className="space-y-4">
              {filteredEvents.map((event) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-4 flex-1">
                          <div className={`w-12 h-12 bg-gradient-to-r ${getEventTypeColor(event.type)} rounded-lg flex items-center justify-center flex-shrink-0`}>
                            {getEventTypeIcon(event.type)}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="text-lg font-semibold text-gray-900 truncate">
                                {event.title}
                              </h3>
                              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(event.status)}`}>
                                {event.status}
                              </span>
                              {event.priority === 'critical' && (
                                <Star className={`w-4 h-4 ${getPriorityColor(event.priority)}`} />
                              )}
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                              <span>📅 {new Date(event.date).toLocaleDateString()}</span>
                              <span>⏰ {event.startTime} - {event.endTime}</span>
                              <span>⏱️ {formatDuration(event.duration)}</span>
                              {event.weather && getWeatherIcon(event.weather)}
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                              <span>📍 {event.location}</span>
                              {event.sceneNumbers && (
                                <span>🎬 Scenes: {event.sceneNumbers.join(', ')}</span>
                              )}
                              <span>👥 {event.crew.length} crew</span>
                            </div>
                            
                            {event.notes && (
                              <p className="text-sm text-gray-600 mb-2">{event.notes}</p>
                            )}
                            
                            <div className="flex flex-wrap gap-2">
                              {event.crew.slice(0, 3).map((member, index) => (
                                <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                  {member}
                                </span>
                              ))}
                              {event.crew.length > 3 && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                                  +{event.crew.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-4">
                          {event.estimatedCost && (
                            <div className="text-right">
                              <p className="text-sm text-gray-500">Estimated Cost</p>
                              <p className="text-lg font-semibold text-gray-900">
                                ${event.estimatedCost.toLocaleString()}
                              </p>
                            </div>
                          )}
                          
                          <div className="flex items-center gap-1">
                            <Button 
                              size="icon-sm" 
                              variant="ghost"
                              onClick={() => handleViewEvent(event)}
                              title="View details"
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="icon-sm" 
                              variant="ghost"
                              onClick={() => handleEditEvent(event)}
                              title="Edit event"
                            >
                              <Edit3 className="w-4 h-4" />
                            </Button>
                            <Button 
                              size="icon-sm" 
                              variant="ghost"
                              onClick={() => handleDeleteEvent(event.id)}
                              title="Delete event"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
              
              {filteredEvents.length === 0 && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Calendar className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No events found</h3>
                    <p className="text-gray-600">Try adjusting your search or filter criteria</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Event Modal */}
      <AnimatePresence>
        {showAddEvent && (
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
              className="bg-white rounded-lg shadow-xl max-w-md w-full"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  {editingEvent ? 'Edit Schedule Event' : 'Add Schedule Event'}
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowAddEvent(false)}
                >
                  ×
                </Button>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Event Title
                    </label>
                    <Input
                      value={newEventTitle}
                      onChange={(e) => setNewEventTitle(e.target.value)}
                      placeholder="Enter event title"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Event Type
                    </label>
                    <select
                      value={newEventType}
                      onChange={(e) => setNewEventType(e.target.value as 'scene' | 'setup' | 'break' | 'meeting' | 'travel' | 'wrap')}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                    >
                      <option value="scene">Scene</option>
                      <option value="setup">Setup</option>
                      <option value="break">Break</option>
                      <option value="meeting">Meeting</option>
                      <option value="travel">Travel</option>
                      <option value="wrap">Wrap</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date
                    </label>
                    <Input
                      type="date"
                      value={newEventDate}
                      onChange={(e) => setNewEventDate(e.target.value)}
                      className="w-full"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Start Time
                      </label>
                      <Input
                        type="time"
                        value={newEventStartTime}
                        onChange={(e) => setNewEventStartTime(e.target.value)}
                        className="w-full"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        End Time
                      </label>
                      <Input
                        type="time"
                        value={newEventEndTime}
                        onChange={(e) => setNewEventEndTime(e.target.value)}
                        className="w-full"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Location
                    </label>
                    <Input
                      value={newEventLocation}
                      onChange={(e) => setNewEventLocation(e.target.value)}
                      placeholder="Enter location"
                      className="w-full"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowAddEvent(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddEvent}
                      className="flex-1 bg-primary"
                    >
                      {editingEvent ? 'Update Event' : 'Add Event'}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Event Modal */}
      <AnimatePresence>
        {viewingEvent && (
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
              className="bg-white rounded-lg shadow-xl max-w-md w-full"
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Event Details</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setViewingEvent(null)}
                >
                  ×
                </Button>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <p className="text-gray-900">{viewingEvent.title}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <p className="text-gray-900 capitalize">{viewingEvent.type}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                      <p className="text-gray-900">{viewingEvent.startTime}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                      <p className="text-gray-900">{viewingEvent.endTime}</p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                    <p className="text-gray-900">{viewingEvent.duration} minutes</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                    <p className="text-gray-900">{viewingEvent.location}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize ${
                      viewingEvent.status === 'completed' ? 'bg-green-100 text-green-800' :
                      viewingEvent.status === 'in-progress' ? 'bg-blue-100 text-blue-800' :
                      viewingEvent.status === 'scheduled' ? 'bg-gray-100 text-gray-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {viewingEvent.status}
                    </span>
                  </div>
                </div>
                <div className="flex gap-3 pt-6">
                  <Button
                    onClick={() => {
                      setViewingEvent(null);
                      handleEditEvent(viewingEvent);
                    }}
                    className="flex-1"
                  >
                    Edit Event
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setViewingEvent(null)}
                    className="flex-1"
                  >
                    Close
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
};

export default SchedulePage;
