'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'next/navigation';
import {
  Download,
  FileText,
  Image as ImageIcon,
  Video,
  Printer,
  Mail,
  Cloud,
  Share2,
  Settings,
  Calendar,
  DollarSign,
  MapPin,
  Camera,
  Users,
  Clock,
  PlayCircle,
  Filter,
  Search,
  Eye,
  Trash2,
  CheckSquare,
  Square,
  FileSpreadsheet,
  FileText as FilePdf,
  FileImage,
  Package,
  Zap,
  Star,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  ExternalLink,
  Folder,
  Archive,
} from 'lucide-react';
import { useRequireAuth } from '@/hooks/useAuth';
import { useCurrentProject } from '@/hooks/useProjects';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { toast } from 'react-hot-toast';

interface ExportTemplate {
  id: string;
  name: string;
  description: string;
  type: 'report' | 'schedule' | 'budget' | 'shotlist' | 'callsheet' | 'contract' | 'presentation';
  format: 'pdf' | 'excel' | 'word' | 'powerpoint' | 'csv' | 'json';
  icon: React.ElementType;
  color: string;
  premium: boolean;
  sections: string[];
  customizable: boolean;
  lastUsed?: string;
  popularity: number;
}

interface ExportJob {
  id: string;
  templateId: string;
  templateName: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  format: string;
  fileSize?: string;
  downloadUrl?: string;
  createdAt: string;
  completedAt?: string;
  error?: string;
  settings: {
    dateRange?: { start: string; end: string };
    includeImages: boolean;
    watermark: boolean;
    customBranding: boolean;
  };
}

const ExportsPage = () => {
  useRequireAuth();
  const params = useParams();
  const projectId = params.projectId as string;
  const { project, isLoading } = useCurrentProject(projectId);

  const [templates, setTemplates] = useState<ExportTemplate[]>([]);
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [showBulkExport, setShowBulkExport] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [formatFilter, setFormatFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'templates' | 'jobs'>('templates');

  // Initialize export templates
  useEffect(() => {
    if (project) {
      const mockTemplates: ExportTemplate[] = [
        {
          id: '1',
          name: 'Production Report',
          description: 'Comprehensive production status report with all project details',
          type: 'report',
          format: 'pdf',
          icon: FileText,
          color: 'from-blue-500 to-blue-600',
          premium: false,
          sections: ['Project Overview', 'Schedule Status', 'Budget Summary', 'Location Details', 'Crew Information'],
          customizable: true,
          lastUsed: '2025-10-18',
          popularity: 95,
        },
        {
          id: '2',
          name: 'Shooting Schedule',
          description: 'Detailed shooting schedule with call times and crew assignments',
          type: 'schedule',
          format: 'pdf',
          icon: Calendar,
          color: 'from-green-500 to-green-600',
          premium: false,
          sections: ['Daily Schedule', 'Call Times', 'Location Info', 'Crew Assignments', 'Equipment List'],
          customizable: true,
          lastUsed: '2025-10-19',
          popularity: 88,
        },
        {
          id: '3',
          name: 'Budget Breakdown',
          description: 'Detailed budget analysis with cost breakdowns and expense tracking',
          type: 'budget',
          format: 'excel',
          icon: DollarSign,
          color: 'from-purple-500 to-purple-600',
          premium: false,
          sections: ['Category Breakdown', 'Expense Details', 'Cost Analysis', 'Variance Report'],
          customizable: true,
          popularity: 82,
        },
        {
          id: '4',
          name: 'Shot List Export',
          description: 'Complete shot list with technical specifications and status',
          type: 'shotlist',
          format: 'pdf',
          icon: Camera,
          color: 'from-indigo-500 to-indigo-600',
          premium: false,
          sections: ['Shot Details', 'Technical Specs', 'Equipment Requirements', 'Status Tracking'],
          customizable: true,
          popularity: 76,
        },
        {
          id: '5',
          name: 'Call Sheet',
          description: 'Daily call sheet with crew and talent information',
          type: 'callsheet',
          format: 'pdf',
          icon: Users,
          color: 'from-yellow-500 to-yellow-600',
          premium: false,
          sections: ['Cast & Crew', 'Call Times', 'Location Details', 'Weather Info', 'Emergency Contacts'],
          customizable: true,
          popularity: 91,
        },
        {
          id: '6',
          name: 'Location Package',
          description: 'Location details with photos, contacts, and agreements',
          type: 'report',
          format: 'pdf',
          icon: MapPin,
          color: 'from-red-500 to-red-600',
          premium: false,
          sections: ['Location Photos', 'Contact Information', 'Permits', 'Technical Requirements'],
          customizable: true,
          popularity: 71,
        },
        {
          id: '7',
          name: 'Presentation Deck',
          description: 'Professional project presentation with visuals and key metrics',
          type: 'presentation',
          format: 'powerpoint',
          icon: PlayCircle,
          color: 'from-orange-500 to-orange-600',
          premium: true,
          sections: ['Project Overview', 'Visual Assets', 'Progress Updates', 'Budget Summary'],
          customizable: true,
          popularity: 65,
        },
        {
          id: '8',
          name: 'Production Bible',
          description: 'Complete production documentation package',
          type: 'report',
          format: 'pdf',
          icon: Package,
          color: 'from-teal-500 to-teal-600',
          premium: true,
          sections: ['All Project Data', 'Scripts', 'Storyboards', 'Schedules', 'Budgets', 'Locations'],
          customizable: false,
          popularity: 89,
        },
      ];

      const mockJobs: ExportJob[] = [
        {
          id: 'job1',
          templateId: '1',
          templateName: 'Production Report',
          status: 'completed',
          format: 'pdf',
          fileSize: '2.4 MB',
          downloadUrl: '/exports/production-report-2025-10-19.pdf',
          createdAt: '2025-10-19T10:30:00Z',
          completedAt: '2025-10-19T10:32:15Z',
          settings: {
            includeImages: true,
            watermark: false,
            customBranding: true,
          },
        },
        {
          id: 'job2',
          templateId: '2',
          templateName: 'Shooting Schedule',
          status: 'processing',
          format: 'pdf',
          createdAt: '2025-10-19T14:15:00Z',
          settings: {
            dateRange: { start: '2025-10-20', end: '2025-10-25' },
            includeImages: false,
            watermark: true,
            customBranding: false,
          },
        },
        {
          id: 'job3',
          templateId: '3',
          templateName: 'Budget Breakdown',
          status: 'failed',
          format: 'excel',
          createdAt: '2025-10-18T16:20:00Z',
          error: 'Template configuration error. Please try again.',
          settings: {
            includeImages: false,
            watermark: false,
            customBranding: false,
          },
        },
      ];

      setTemplates(mockTemplates);
      setExportJobs(mockJobs);
    }
  }, [project]);

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'pdf':
        return <FilePdf className="w-4 h-4 text-red-500" />;
      case 'excel':
        return <FileSpreadsheet className="w-4 h-4 text-green-500" />;
      case 'word':
        return <FileText className="w-4 h-4 text-blue-500" />;
      case 'powerpoint':
        return <PlayCircle className="w-4 h-4 text-orange-500" />;
      default:
        return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'processing':
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'failed':
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'failed':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || template.type === typeFilter;
    const matchesFormat = formatFilter === 'all' || template.format === formatFilter;
    
    return matchesSearch && matchesType && matchesFormat;
  });

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplates(prev => 
      prev.includes(templateId) 
        ? prev.filter(id => id !== templateId)
        : [...prev, templateId]
    );
  };

  const handleExport = (templateId: string) => {
    toast.success('Export job started! You will be notified when it\'s ready.');
    
    // Simulate export job creation
    const newJob: ExportJob = {
      id: `job${Date.now()}`,
      templateId,
      templateName: templates.find(t => t.id === templateId)?.name || 'Unknown',
      status: 'processing',
      format: templates.find(t => t.id === templateId)?.format || 'pdf',
      createdAt: new Date().toISOString(),
      settings: {
        includeImages: true,
        watermark: false,
        customBranding: true,
      },
    };

    setExportJobs(prev => [newJob, ...prev]);
  };

  const handleBulkExport = () => {
    if (selectedTemplates.length === 0) {
      toast.error('Please select at least one template to export.');
      return;
    }

    selectedTemplates.forEach(templateId => {
      handleExport(templateId);
    });
    
    setSelectedTemplates([]);
    setShowBulkExport(false);
    toast.success(`Started ${selectedTemplates.length} export jobs!`);
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
            <h1 className="text-3xl font-bold text-gray-900">Export Center</h1>
            <p className="text-gray-600">{project?.title}</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <Button
                variant={viewMode === 'templates' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('templates')}
                leftIcon={<FileText className="w-4 h-4" />}
              >
                Templates
              </Button>
              <Button
                variant={viewMode === 'jobs' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('jobs')}
                leftIcon={<Download className="w-4 h-4" />}
              >
                Export Jobs
              </Button>
            </div>
            
            {selectedTemplates.length > 0 && (
              <Button
                leftIcon={<Package className="w-4 h-4" />}
                onClick={handleBulkExport}
              >
                Export Selected ({selectedTemplates.length})
              </Button>
            )}
            
            <Button
              variant="outline"
              leftIcon={<Settings className="w-4 h-4" />}
            >
              Settings
            </Button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-100 text-sm font-medium">Available Templates</p>
                  <p className="text-2xl font-bold">{templates.length}</p>
                </div>
                <FileText className="w-8 h-8 text-white/80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Completed Exports</p>
                  <p className="text-2xl font-bold">
                    {exportJobs.filter(job => job.status === 'completed').length}
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
                  <p className="text-blue-100 text-sm font-medium">Processing</p>
                  <p className="text-2xl font-bold">
                    {exportJobs.filter(job => job.status === 'processing').length}
                  </p>
                </div>
                <RefreshCw className="w-8 h-8 text-white/80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm font-medium">Premium Templates</p>
                  <p className="text-2xl font-bold">
                    {templates.filter(t => t.premium).length}
                  </p>
                </div>
                <Star className="w-8 h-8 text-white/80" />
              </div>
            </CardContent>
          </Card>
        </div>

        {viewMode === 'templates' ? (
          <>
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Export Templates</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search templates..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  <select
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="all">All Types</option>
                    <option value="report">Reports</option>
                    <option value="schedule">Schedules</option>
                    <option value="budget">Budget</option>
                    <option value="shotlist">Shot Lists</option>
                    <option value="callsheet">Call Sheets</option>
                    <option value="presentation">Presentations</option>
                  </select>
                  
                  <select
                    value={formatFilter}
                    onChange={(e) => setFormatFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="all">All Formats</option>
                    <option value="pdf">PDF</option>
                    <option value="excel">Excel</option>
                    <option value="word">Word</option>
                    <option value="powerpoint">PowerPoint</option>
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Templates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredTemplates.map((template) => {
                const Icon = template.icon;
                const isSelected = selectedTemplates.includes(template.id);
                
                return (
                  <motion.div
                    key={template.id}
                    whileHover={{ scale: 1.02 }}
                    className="cursor-pointer"
                  >
                    <Card className={`h-full hover:shadow-lg transition-all ${
                      isSelected ? 'ring-2 ring-indigo-500 shadow-lg' : ''
                    }`}>
                      <CardContent className="p-6">
                        <div className="space-y-4">
                          {/* Header */}
                          <div className="flex items-start justify-between">
                            <div className={`w-12 h-12 bg-gradient-to-r ${template.color} rounded-lg flex items-center justify-center`}>
                              <Icon className="w-6 h-6 text-white" />
                            </div>
                            
                            <div className="flex items-center gap-2">
                              {template.premium && (
                                <Star className="w-4 h-4 text-yellow-500 fill-current" />
                              )}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTemplateSelect(template.id);
                                }}
                                className="text-gray-400 hover:text-indigo-500"
                              >
                                {isSelected ? (
                                  <CheckSquare className="w-5 h-5 text-indigo-500" />
                                ) : (
                                  <Square className="w-5 h-5" />
                                )}
                              </button>
                            </div>
                          </div>
                          
                          {/* Content */}
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                              {template.name}
                            </h3>
                            <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                              {template.description}
                            </p>
                          </div>
                          
                          {/* Format and Type */}
                          <div className="flex items-center gap-2 text-sm">
                            {getFormatIcon(template.format)}
                            <span className="text-gray-600 capitalize">
                              {template.format}
                            </span>
                            <span className="text-gray-400">•</span>
                            <span className="text-gray-600 capitalize">
                              {template.type}
                            </span>
                          </div>
                          
                          {/* Sections */}
                          <div className="space-y-2">
                            <p className="text-xs text-gray-500 font-medium">Includes:</p>
                            <div className="flex flex-wrap gap-1">
                              {template.sections.slice(0, 3).map((section, index) => (
                                <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                                  {section}
                                </span>
                              ))}
                              {template.sections.length > 3 && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded">
                                  +{template.sections.length - 3} more
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Footer */}
                          <div className="flex items-center justify-between pt-4 border-t">
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <div className="flex items-center gap-1">
                                <Star className="w-3 h-3" />
                                <span>{template.popularity}%</span>
                              </div>
                              {template.lastUsed && (
                                <span>Last used {new Date(template.lastUsed).toLocaleDateString()}</span>
                              )}
                            </div>
                            
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleExport(template.id);
                              }}
                              leftIcon={<Download className="w-3 h-3" />}
                            >
                              Export
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </>
        ) : (
          /* Export Jobs View */
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Export History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {exportJobs.map((job) => (
                    <motion.div
                      key={job.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                            {getStatusIcon(job.status)}
                            {getFormatIcon(job.format)}
                          </div>
                          
                          <div>
                            <h4 className="font-semibold text-gray-900">{job.templateName}</h4>
                            <div className="flex items-center gap-3 text-sm text-gray-600">
                              <span>{new Date(job.createdAt).toLocaleString()}</span>
                              {job.fileSize && <span>{job.fileSize}</span>}
                              <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(job.status)}`}>
                                {job.status}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {job.status === 'completed' && job.downloadUrl && (
                            <Button
                              size="sm"
                              leftIcon={<Download className="w-4 h-4" />}
                              onClick={() => {
                                // Simulate download
                                toast.success('Download started!');
                              }}
                            >
                              Download
                            </Button>
                          )}
                          
                          {job.status === 'failed' && (
                            <Button
                              size="sm"
                              variant="outline"
                              leftIcon={<RefreshCw className="w-4 h-4" />}
                              onClick={() => {
                                handleExport(job.templateId);
                              }}
                            >
                              Retry
                            </Button>
                          )}
                          
                          <Button
                            size="icon-sm"
                            variant="ghost"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          
                          <Button
                            size="icon-sm"
                            variant="ghost"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {job.error && (
                        <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm text-red-600">{job.error}</p>
                        </div>
                      )}
                    </motion.div>
                  ))}
                  
                  {exportJobs.length === 0 && (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Download className="w-8 h-8 text-gray-400" />
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">No export jobs yet</h3>
                      <p className="text-gray-600">Start by exporting a template to see your jobs here</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {filteredTemplates.length === 0 && viewMode === 'templates' && (
          <Card>
            <CardContent className="p-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No templates found</h3>
              <p className="text-gray-600">Try adjusting your search or filter criteria</p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ExportsPage;
