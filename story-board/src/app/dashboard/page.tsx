'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { 
  Plus, 
  Film, 
  Calendar, 
  DollarSign, 
  Users, 
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  Grid,
  List
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/lib/store';
import { fetchProjects } from '@/lib/store/projectsSlice';
import { openModal, toggleGridView } from '@/lib/store/uiSlice';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import DashboardLayout from '@/components/layout/DashboardLayout';
import CreateProjectModal from '@/components/projects/CreateProjectModal';
import ProjectCard from '@/components/projects/ProjectCard';
import { getStatusColor, formatDate, formatCurrency } from '@/lib/utils/helpers';
import { PROJECT_STATUS } from '@/lib/utils/constants';
import toast from 'react-hot-toast';

const DashboardPage = () => {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);
  const { projects, isLoading } = useAppSelector((state) => state.projects);
  const { modals, gridView } = useAppSelector((state) => state.ui);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
  }, [isAuthenticated, router]);

  // Fetch projects on mount
  useEffect(() => {
    if (isAuthenticated) {
      dispatch(fetchProjects({ page: 1, limit: 20 }));
    }
  }, [dispatch, isAuthenticated]);

  // Filter projects
  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || project.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  // Dashboard stats
  const stats = {
    totalProjects: projects.length,
    activeProjects: projects.filter(p => p.status === 'production' || p.status === 'pre-production').length,
    completedProjects: projects.filter(p => p.status === 'completed').length,
    totalBudget: projects.reduce((sum, p) => {
      // Handle the budget.total structure from the backend
      let budget = 0;
      if (p.budget?.total && typeof p.budget.total === 'number' && !isNaN(p.budget.total)) {
        budget = p.budget.total;
      } else if (typeof p.budget === 'number' && !isNaN(p.budget)) {
        // Fallback for simple budget number
        budget = p.budget;
      }
      return sum + budget;
    }, 0),
  };

  const recentProjects = projects.slice(0, 3);

  const handleCreateProject = () => {
    dispatch(openModal('createProject'));
  };

  const handleProjectClick = (projectId: string) => {
    router.push(`/projects/${projectId}`);
  };

  if (!isAuthenticated) {
    return null; // Will redirect in useEffect
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-8">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        >
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {stats.totalProjects > 0 ? `Welcome back, ${user?.firstName}!` : `Welcome, ${user?.firstName}!`} 👋
            </h1>
            <p className="text-xl text-gray-600">
              Let's bring your creative visions to life today.
            </p>
          </div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Button
              onClick={handleCreateProject}
              size="lg"
              className="bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 shadow-lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              New Project
            </Button>
          </motion.div>
        </motion.div>

        {/* Stats Cards */}
        <div className="stats-grid mb-8" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1.5rem'
        }}>
          {[
            {
              title: 'Total Projects',
              value: stats.totalProjects,
              icon: Film,
              color: 'from-blue-500 to-blue-600'
            },
            {
              title: 'Active Projects',
              value: stats.activeProjects,
              icon: Clock,
              color: 'from-green-500 to-green-600'
            },
            {
              title: 'Completed',
              value: stats.completedProjects,
              icon: CheckCircle,
              color: 'from-purple-500 to-purple-600'
            },
            {
              title: 'Total Budget',
              value: isNaN(stats.totalBudget) ? '$0.00' : formatCurrency(stats.totalBudget),
              icon: DollarSign,
              color: 'from-orange-500 to-orange-600',
              isPrice: true
            }
          ].map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                className="w-full"
              >
                <Card className="overflow-hidden h-full">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-600 mb-1">{stat.title}</p>
                        <p className="text-2xl lg:text-3xl font-bold text-gray-900">
                          {stat.isPrice ? stat.value : stat.value.toLocaleString()}
                        </p>
                      </div>
                      <div className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-lg flex items-center justify-center flex-shrink-0 ml-4`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.5 }}
        >
          <Card className="bg-gradient-to-br from-white via-gray-50/50 to-white border-gray-200/50 hover:shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-3 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                  <Users className="w-5 h-5 text-white" />
                </div>
                Quick Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { 
                    title: 'Create Storyboard', 
                    desc: 'Start visualizing your story',
                    icon: Film,
                    action: () => handleCreateProject()
                  },
                  { 
                    title: 'Schedule Shoot', 
                    desc: 'Plan your production timeline',
                    icon: Calendar,
                    action: () => toast('Create a project first!', { icon: 'ℹ️' })
                  },
                  { 
                    title: 'Manage Budget', 
                    desc: 'Track your production costs',
                    icon: DollarSign,
                    action: () => toast('Create a project first!', { icon: 'ℹ️' })
                  }
                ].map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <motion.div
                      key={index}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-primary-300 hover:bg-primary-50 transition-all"
                      onClick={action.action}
                    >
                      <Icon className="w-8 h-8 text-primary-600 mb-3" />
                      <h3 className="font-semibold text-gray-900 mb-1">{action.title}</h3>
                      <p className="text-sm text-gray-600">{action.desc}</p>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Projects Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Your Projects</h2>
            
            <div className="flex items-center gap-4 w-full md:w-auto">
              {/* Search */}
              <div className="relative flex-1 md:w-80">
                <Input
                  type="text"
                  placeholder="Search projects..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  icon={<Search className="w-4 h-4" />}
                  className="pl-10"
                />
              </div>

              {/* Filter */}
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="all">All Status</option>
                {Object.entries(PROJECT_STATUS).map(([key, value]) => (
                  <option key={key} value={value}>
                    {key.charAt(0) + key.slice(1).toLowerCase().replace('_', ' ')}
                  </option>
                ))}
              </select>

              {/* View Toggle */}
              <div className="flex border border-gray-300 rounded-lg overflow-hidden">
                <button
                  onClick={() => dispatch(toggleGridView())}
                  className={`p-2 ${gridView ? 'bg-primary text-white' : 'bg-white text-gray-600'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => dispatch(toggleGridView())}
                  className={`p-2 ${!gridView ? 'bg-primary text-white' : 'bg-white text-gray-600'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Projects Grid/List */}
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, index) => (
                <Card key={index} className="h-48 animate-pulse"><div /></Card>
              ))}
            </div>
          ) : filteredProjects.length > 0 ? (
            <div className={`grid gap-6 ${
              gridView 
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
                : 'grid-cols-1'
            }`}>
              <AnimatePresence>
                {filteredProjects.map((project, index) => (
                  <motion.div
                    key={project._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.1, duration: 0.4 }}
                  >
                    <ProjectCard
                      project={project}
                      onClick={() => handleProjectClick(project._id)}
                      gridView={gridView}
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Film className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {searchTerm || filterStatus !== 'all' 
                    ? 'No projects found' 
                    : 'No projects yet'}
                </h3>
                <p className="text-gray-600 mb-6">
                  {searchTerm || filterStatus !== 'all'
                    ? 'Try adjusting your search or filter criteria'
                    : 'Create your first project to start bringing your stories to life'}
                </p>
                {!searchTerm && filterStatus === 'all' && (
                  <Button onClick={handleCreateProject} className="bg-primary">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Your First Project
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </motion.div>
      </div>

      {/* Modals */}
      <CreateProjectModal />
    </DashboardLayout>
  );
};

export default DashboardPage;