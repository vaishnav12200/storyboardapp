'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Film, 
  Calendar, 
  DollarSign, 
  Users, 
  MoreVertical,
  Clock,
  CheckCircle,
  Trash2,
  Edit3
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Project } from '@/types/project';
import { Card, CardContent } from '@/components/ui/Card';
import { getStatusColor, formatDate, formatCurrency, capitalizeFirst } from '@/lib/utils/helpers';
import { cn } from '@/lib/utils/helpers';

interface ProjectCardProps {
  project: Project;
  onClick: () => void;
  onDelete: (projectId: string) => void;
  gridView?: boolean;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ 
  project, 
  onClick, 
  onDelete,
  gridView = true 
}) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(true);
    try {
      await onDelete(project._id);
      toast.success('Project deleted successfully');
      setShowDeleteDialog(false);
    } catch (error) {
      toast.error('Failed to delete project');
    } finally {
      setIsDeleting(false);
    }
  };
  const statusColors = {
    development: 'from-yellow-400 to-orange-500',
    'pre-production': 'from-blue-400 to-blue-600',
    production: 'from-green-400 to-green-600',
    'post-production': 'from-purple-400 to-purple-600',
    completed: 'from-gray-400 to-gray-600',
  };

  const statusIcons = {
    development: Clock,
    'pre-production': Calendar,
    production: Film,
    'post-production': Film,
    completed: CheckCircle,
  };

  const StatusIcon = statusIcons[project.status as keyof typeof statusIcons] || Clock;

  if (!gridView) {
    // List view
    return (
      <motion.div
        whileHover={{ y: -2, boxShadow: '0 8px 25px rgba(0,0,0,0.1)' }}
        whileTap={{ scale: 0.98 }}
        onClick={onClick}
        className="cursor-pointer"
      >
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <div className="w-12 h-12 bg-gradient-to-r from-primary-500 to-primary-600 rounded-lg flex items-center justify-center">
                  <Film className="w-6 h-6 text-white" />
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {project.title}
                  </h3>
                  <p className="text-gray-600 text-sm truncate">
                    {project.description || 'No description'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-6 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <StatusIcon className="w-4 h-4" />
                  <span className={cn(
                    'px-3 py-1 rounded-full text-xs font-medium',
                    getStatusColor(project.status)
                  )}>
                    {capitalizeFirst(project.status.replace('-', ' '))}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(project.createdAt)}</span>
                </div>

                {project.budget?.total && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    <span>{formatCurrency(Number(project.budget.total))}</span>
                  </div>
                )}

                <div className="relative">
                  <button 
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteDialog(true);
                    }}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // Grid view
  return (
    <motion.div
      whileHover={{ y: -5, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="cursor-pointer group"
    >
      <Card className="overflow-hidden">
        <div className={cn(
          'h-32 bg-gradient-to-r relative',
          statusColors[project.status as keyof typeof statusColors] || statusColors.development
        )}>
          {/* Status Badge */}
          <div className="absolute top-4 right-4">
            <span className={cn(
              'px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-sm'
            )}>
              {capitalizeFirst(project.status.replace('-', ' '))}
            </span>
          </div>

          {/* Project Icon */}
          <div className="absolute bottom-4 left-4">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
              <Film className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        <CardContent className="p-6">
          <div className="space-y-4">
            {/* Title and Description */}
            <div>
              <h3 className="text-xl font-bold text-gray-900 group-hover:text-primary-600 transition-colors mb-2">
                {project.title}
              </h3>
              <p className="text-gray-600 text-sm line-clamp-2">
                {project.description || 'No description provided'}
              </p>
            </div>

            {/* Project Details */}
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>Created {formatDate(project.createdAt)}</span>
              </div>

              {project.budget?.total && (
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <DollarSign className="w-4 h-4" />
                  <span>Budget: {formatCurrency(Number(project.budget.total))}</span>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2">
                <StatusIcon className="w-4 h-4 text-gray-400" />
                <span className="text-xs text-gray-500">
                  {project.collaborators?.length || 0} collaborators
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteDialog(true);
                  }}
                  className="w-8 h-8 bg-red-50 rounded-lg flex items-center justify-center hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </button>
                
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center group-hover:bg-primary-100 transition-colors"
                >
                  <Film className="w-4 h-4 text-primary-600" />
                </motion.div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AnimatePresence>
        {showDeleteDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => !isDeleting && setShowDeleteDialog(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete Project</h3>
                  <p className="text-sm text-gray-600">This action cannot be undone</p>
                </div>
              </div>
              
              <p className="text-gray-700 mb-6">
                Are you sure you want to delete <strong>"{project.title}"</strong>? All project data including storyboards, scripts, and schedules will be permanently removed.
              </p>
              
              <div className="flex gap-3">
                <button
                  onClick={() => setShowDeleteDialog(false)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isDeleting ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                    />
                  ) : (
                    <Trash2 className="w-4 h-4" />
                  )}
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ProjectCard;