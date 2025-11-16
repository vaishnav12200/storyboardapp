'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Film, 
  Calendar, 
  DollarSign, 
  Users, 
  MoreVertical,
  Clock,
  CheckCircle
} from 'lucide-react';
import { Project } from '@/types/project';
import { Card, CardContent } from '@/components/ui/Card';
import { getStatusColor, formatDate, formatCurrency, capitalizeFirst } from '@/lib/utils/helpers';
import { cn } from '@/lib/utils/helpers';

interface ProjectCardProps {
  project: Project;
  onClick: () => void;
  gridView?: boolean;
}

const ProjectCard: React.FC<ProjectCardProps> = ({ 
  project, 
  onClick, 
  gridView = true 
}) => {
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

                {project.budget && (
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    <span>{formatCurrency(project.budget)}</span>
                  </div>
                )}

                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                  <MoreVertical className="w-4 h-4" />
                </button>
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
                <Users className="w-4 h-4" />
                <span>Director: {project.director}</span>
              </div>

              {project.producer && (
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <Users className="w-4 h-4" />
                  <span>Producer: {project.producer}</span>
                </div>
              )}

              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>Created {formatDate(project.createdAt)}</span>
              </div>

              {project.budget && (
                <div className="flex items-center gap-3 text-sm text-gray-600">
                  <DollarSign className="w-4 h-4" />
                  <span>Budget: {formatCurrency(project.budget)}</span>
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

              <motion.div
                whileHover={{ scale: 1.1 }}
                className="w-8 h-8 bg-primary-50 rounded-lg flex items-center justify-center group-hover:bg-primary-100 transition-colors"
              >
                <Film className="w-4 h-4 text-primary-600" />
              </motion.div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default ProjectCard;