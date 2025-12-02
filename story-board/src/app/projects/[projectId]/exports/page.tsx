'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { useParams } from 'next/navigation';
import {
  Download,
  FileText,
  Calendar,
  DollarSign,
  MapPin,
  Camera,
} from 'lucide-react';
import { useRequireAuth } from '@/hooks/useAuth';
import { useCurrentProject } from '@/hooks/useProjects';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import { toast } from 'react-hot-toast';


const ExportsPage = () => {
  useRequireAuth();
  const params = useParams();
  const projectId = params.projectId as string;
  const { project, isLoading } = useCurrentProject(projectId);

  // Export functions for each type
  const handleExportScript = () => {
    const printWindow = window.open('', '', 'height=800,width=800');
    if (!printWindow) {
      toast.error('Failed to open print window. Please allow popups.');
      return;
    }

    toast.success('Exporting Script...');
    
    const content = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${project?.title || 'Project'} - Script</title>
          <style>
            @page { margin: 1in; }
            body { font-family: 'Courier New', monospace; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
            h1 { text-align: center; margin-bottom: 40px; text-transform: uppercase; }
            .content { white-space: pre-wrap; }
          </style>
        </head>
        <body>
          <h1>${project?.title || 'Script'}</h1>
          <div class="content">${project?.description || 'No script content available'}</div>
        </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 250);
  };

  const handleExportSchedule = () => {
    const printWindow = window.open('', '', 'height=800,width=800');
    if (!printWindow) {
      toast.error('Failed to open print window. Please allow popups.');
      return;
    }

    toast.success('Exporting Schedule...');
    
    const content = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${project?.title || 'Project'} - Schedule</title>
          <style>
            @page { margin: 1in; }
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
            h1 { color: #4f46e5; border-bottom: 3px solid #4f46e5; padding-bottom: 10px; margin-bottom: 30px; }
            .info { background: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <h1>${project?.title || 'Project'} - Shooting Schedule</h1>
          <div class="info">
            <p><strong>Project:</strong> ${project?.title || 'N/A'}</p>
            <p><strong>Genre:</strong> ${project?.genre || 'N/A'}</p>
            <p><strong>Exported:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <p>Schedule data will be populated from the schedule page.</p>
        </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 250);
  };

  const handleExportBudget = () => {
    const printWindow = window.open('', '', 'height=800,width=800');
    if (!printWindow) {
      toast.error('Failed to open print window. Please allow popups.');
      return;
    }

    toast.success('Exporting Budget...');
    
    const content = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${project?.title || 'Project'} - Budget</title>
          <style>
            @page { margin: 1in; }
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
            h1 { color: #4f46e5; border-bottom: 3px solid #4f46e5; padding-bottom: 10px; margin-bottom: 30px; }
            .info { background: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <h1>${project?.title || 'Project'} - Budget Report</h1>
          <div class="info">
            <p><strong>Project:</strong> ${project?.title || 'N/A'}</p>
            <p><strong>Exported:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <p>Budget data will be populated from the budget page.</p>
        </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 250);
  };

  const handleExportLocations = () => {
    const printWindow = window.open('', '', 'height=800,width=800');
    if (!printWindow) {
      toast.error('Failed to open print window. Please allow popups.');
      return;
    }

    toast.success('Exporting Locations...');
    
    const content = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${project?.title || 'Project'} - Locations</title>
          <style>
            @page { margin: 1in; }
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
            h1 { color: #4f46e5; border-bottom: 3px solid #4f46e5; padding-bottom: 10px; margin-bottom: 30px; }
            .info { background: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <h1>${project?.title || 'Project'} - Location List</h1>
          <div class="info">
            <p><strong>Project:</strong> ${project?.title || 'N/A'}</p>
            <p><strong>Exported:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <p>Location data will be populated from the locations page.</p>
        </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 250);
  };

  const handleExportShotList = () => {
    const printWindow = window.open('', '', 'height=800,width=800');
    if (!printWindow) {
      toast.error('Failed to open print window. Please allow popups.');
      return;
    }

    toast.success('Exporting Shot List...');
    
    const content = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${project?.title || 'Project'} - Shot List</title>
          <style>
            @page { margin: 1in; }
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
            h1 { color: #4f46e5; border-bottom: 3px solid #4f46e5; padding-bottom: 10px; margin-bottom: 30px; }
            .info { background: #f3f4f6; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <h1>${project?.title || 'Project'} - Shot List</h1>
          <div class="info">
            <p><strong>Project:</strong> ${project?.title || 'N/A'}</p>
            <p><strong>Exported:</strong> ${new Date().toLocaleString()}</p>
          </div>
          <p>Shot list data will be populated from the shotlist page.</p>
        </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 250);
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
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Exports</h1>
          <p className="text-gray-600">{project?.title}</p>
        </div>

        {/* Export Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Script Export */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Script</h3>
              <p className="text-sm text-gray-600 mb-4">Export screenplay and script content</p>
              <Button
                className="w-full"
                onClick={handleExportScript}
                leftIcon={<Download className="w-4 h-4" />}
              >
                Export PDF
              </Button>
            </CardContent>
          </Card>

          {/* Schedule Export */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-green-600 rounded-lg flex items-center justify-center">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Schedule</h3>
              <p className="text-sm text-gray-600 mb-4">Export shooting schedule</p>
              <Button
                className="w-full"
                onClick={handleExportSchedule}
                leftIcon={<Download className="w-4 h-4" />}
              >
                Export PDF
              </Button>
            </CardContent>
          </Card>

          {/* Budget Export */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Budget</h3>
              <p className="text-sm text-gray-600 mb-4">Export budget breakdown</p>
              <Button
                className="w-full"
                onClick={handleExportBudget}
                leftIcon={<Download className="w-4 h-4" />}
              >
                Export PDF
              </Button>
            </CardContent>
          </Card>

          {/* Locations Export */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-lg flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Locations</h3>
              <p className="text-sm text-gray-600 mb-4">Export location list</p>
              <Button
                className="w-full"
                onClick={handleExportLocations}
                leftIcon={<Download className="w-4 h-4" />}
              >
                Export PDF
              </Button>
            </CardContent>
          </Card>

          {/* Shot List Export */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg flex items-center justify-center">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Shot List</h3>
              <p className="text-sm text-gray-600 mb-4">Export shot list</p>
              <Button
                className="w-full"
                onClick={handleExportShotList}
                leftIcon={<Download className="w-4 h-4" />}
              >
                Export PDF
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default ExportsPage;
