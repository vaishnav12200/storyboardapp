'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { 
  Menu, 
  Bell, 
  Search, 
  Plus, 
  Sun, 
  Moon,
  Maximize,
  Minimize
} from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/lib/store';
import { toggleSidebar, setTheme, toggleFullscreen, openModal } from '@/lib/store/uiSlice';
import Button from '@/components/ui/Button';
import { cn } from '@/lib/utils/helpers';

const Header = () => {
  const dispatch = useAppDispatch();
  const { sidebarOpen, theme, isFullscreen, notifications } = useAppSelector((state) => state.ui);
  const { user } = useAppSelector((state) => state.auth);

  const unreadNotifications = notifications.filter(n => Date.now() - n.timestamp < 86400000).length;

  const toggleTheme = () => {
    dispatch(setTheme(theme === 'light' ? 'dark' : 'light'));
  };

  const handleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      dispatch(toggleFullscreen());
    } else {
      document.exitFullscreen();
      dispatch(toggleFullscreen());
    }
  };

  return (
    <header className="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-6">
      {/* Left Side */}
      <div className="flex items-center gap-4">
        {/* Sidebar Toggle */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => dispatch(toggleSidebar())}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors lg:hidden"
        >
          <Menu className="w-5 h-5 text-gray-600" />
        </motion.button>

        {/* Search Bar */}
        <div className="hidden md:flex items-center relative">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search projects, scenes..."
              className="w-80 pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
            />
          </div>
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-2">
        {/* Quick Create */}
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            size="sm"
            onClick={() => dispatch(openModal('createProject'))}
            className="hidden sm:flex items-center gap-2 bg-primary hover:bg-primary-600"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden lg:inline">Create</span>
          </Button>
        </motion.div>

        {/* Theme Toggle */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={toggleTheme}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          {theme === 'light' ? (
            <Moon className="w-5 h-5 text-gray-600" />
          ) : (
            <Sun className="w-5 h-5 text-gray-600" />
          )}
        </motion.button>

        {/* Fullscreen Toggle */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handleFullscreen}
          className="hidden lg:flex p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          {isFullscreen ? (
            <Minimize className="w-5 h-5 text-gray-600" />
          ) : (
            <Maximize className="w-5 h-5 text-gray-600" />
          )}
        </motion.button>

        {/* User Avatar */}
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="relative"
        >
          <button className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center hover:from-indigo-600 hover:to-purple-600 transition-all duration-200 shadow-lg hover:shadow-xl">
            <span className="text-white font-semibold text-sm">
              {user?.firstName?.charAt(0) || 'U'}
            </span>
          </button>
        </motion.div>
      </div>
    </header>
  );
};

export default Header;