'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { usePathname, useParams } from 'next/navigation';
import { 
  Home, 
  Film, 
  Palette, 
  Calendar, 
  DollarSign, 
  MapPin, 
  FileText, 
  Download,
  Settings,
  LogOut,
  ChevronRight
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/lib/store';
import { logoutUser } from '@/lib/store/authSlice';
import { cn } from '@/lib/utils/helpers';

const Sidebar = () => {
  const pathname = usePathname();
  const params = useParams();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { currentProject } = useAppSelector((state) => state.projects);

  const projectId = params?.projectId as string;

  const mainNavItems = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: Home,
      active: pathname === '/dashboard'
    },
  ];

  const projectNavItems = projectId ? [
    {
      name: 'Overview',
      href: `/projects/${projectId}`,
      icon: Film,
      active: pathname === `/projects/${projectId}`
    },
    {
      name: 'Storyboard',
      href: `/projects/${projectId}/storyboard`,
      icon: Palette,
      active: pathname.includes('/storyboard')
    },
    {
      name: 'Script',
      href: `/projects/${projectId}/script`,
      icon: FileText,
      active: pathname.includes('/script')
    },
    {
      name: 'Schedule',
      href: `/projects/${projectId}/schedule`,
      icon: Calendar,
      active: pathname.includes('/schedule')
    },
    {
      name: 'Budget',
      href: `/projects/${projectId}/budget`,
      icon: DollarSign,
      active: pathname.includes('/budget')
    },
    {
      name: 'Locations',
      href: `/projects/${projectId}/locations`,
      icon: MapPin,
      active: pathname.includes('/locations')
    },
    {
      name: 'Shot List',
      href: `/projects/${projectId}/shotlist`,
      icon: FileText,
      active: pathname.includes('/shotlist')
    },
    {
      name: 'Exports',
      href: `/projects/${projectId}/exports`,
      icon: Download,
      active: pathname.includes('/exports')
    },
  ] : [];

  const handleLogout = async () => {
    try {
      await dispatch(logoutUser()).unwrap();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="h-full bg-white border-r border-gray-200 w-70 flex flex-col">
      {/* Logo */}
      <div className="h-16 flex items-center px-6 border-b border-gray-200">
        <Link href="/dashboard" className="flex items-center gap-3">
          <motion.div
            whileHover={{ rotate: 360 }}
            transition={{ duration: 0.8 }}
          >
            <img 
              src="/logo.png" 
              alt="CineCore Logo" 
              className="w-10 h-10"
            />
          </motion.div>
          <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">CineCore</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-8 overflow-y-auto">
        {/* Main Navigation */}
        <div>
          <ul className="space-y-2">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                      item.active
                        ? 'bg-primary text-white shadow-lg'
                        : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    {item.name}
                    {item.active && (
                      <motion.div
                        layoutId="activeIndicator"
                        className="ml-auto w-1 h-1 bg-white rounded-full"
                      />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Project Navigation */}
        {projectId && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Project
              </h3>
              {currentProject && (
                <span className="text-xs text-gray-400 truncate max-w-32">
                  {currentProject.title}
                </span>
              )}
            </div>
            <ul className="space-y-1">
              {projectNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={cn(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 group',
                        item.active
                          ? 'bg-primary-50 text-primary-700 border-l-2 border-primary'
                          : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      {item.name}
                      {item.active && (
                        <ChevronRight className="w-4 h-4 ml-auto" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </nav>

      {/* User Profile & Actions */}
      <div className="p-4 border-t border-gray-200">
        {/* User Info */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
            <span className="text-primary-700 font-semibold text-sm">
              {user?.firstName?.charAt(0) || 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {user?.firstName && user?.lastName 
                ? `${user.firstName} ${user.lastName}`
                : user?.email
              }
            </p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <Link
            href="/settings"
            className="flex items-center gap-3 w-full px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
          >
            <Settings className="w-4 h-4" />
            Settings
          </Link>
          
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;