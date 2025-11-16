'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Film, Calendar, DollarSign, User } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/lib/store';
import { closeModal } from '@/lib/store/uiSlice';
import { createProject } from '@/lib/store/projectsSlice';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { CreateProjectData } from '@/types/project';
import toast from 'react-hot-toast';

const CreateProjectModal = () => {
  const dispatch = useAppDispatch();
  const { modals } = useAppSelector((state) => state.ui);
  const { isLoading } = useAppSelector((state) => state.projects);
  const isOpen = modals.createProject;

  const [formData, setFormData] = useState<CreateProjectData>({
    title: '',
    description: '',
    director: '',
    producer: '',
    genre: '',
    startDate: '',
    endDate: '',
    budget: undefined,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const genres = [
    'Action', 'Adventure', 'Animation', 'Comedy', 'Crime', 'Documentary', 
    'Drama', 'Fantasy', 'Horror', 'Mystery', 'Romance', 'Sci-Fi', 
    'Thriller', 'Western', 'Other'
  ];

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Project title is required';
    }

    if (!formData.director.trim()) {
      newErrors.director = 'Director name is required';
    }

    if (formData.budget && formData.budget < 0) {
      newErrors.budget = 'Budget cannot be negative';
    }

    if (formData.startDate && formData.endDate) {
      const start = new Date(formData.startDate);
      const end = new Date(formData.endDate);
      if (end <= start) {
        newErrors.endDate = 'End date must be after start date';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      const projectData = {
        ...formData,
        budget: formData.budget || undefined,
      };

      await dispatch(createProject(projectData)).unwrap();
      toast.success('Project created successfully!');
      handleClose();
    } catch (error: any) {
      toast.error(error || 'Failed to create project');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const processedValue = name === 'budget' ? (value ? parseFloat(value) : undefined) : value;
    
    setFormData(prev => ({ ...prev, [name]: processedValue }));

    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleClose = () => {
    setFormData({
      title: '',
      description: '',
      director: '',
      producer: '',
      genre: '',
      startDate: '',
      endDate: '',
      budget: undefined,
    });
    setErrors({});
    dispatch(closeModal('createProject'));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
                  <Film className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">Create New Project</h2>
                  <p className="text-gray-600">Start bringing your story to life</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Project Title */}
              <Input
                label="Project Title *"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                error={errors.title}
                placeholder="Enter your project title"
                icon={<Film className="w-4 h-4" />}
              />

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <motion.textarea
                  whileFocus={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="Describe your project..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                />
              </div>

              {/* Director and Producer */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Director *"
                  name="director"
                  value={formData.director}
                  onChange={handleInputChange}
                  error={errors.director}
                  placeholder="Director name"
                  icon={<User className="w-4 h-4" />}
                />

                <Input
                  label="Producer"
                  name="producer"
                  value={formData.producer}
                  onChange={handleInputChange}
                  placeholder="Producer name"
                  icon={<User className="w-4 h-4" />}
                />
              </div>

              {/* Genre and Budget */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Genre
                  </label>
                  <motion.select
                    whileFocus={{ scale: 1.02 }}
                    transition={{ duration: 0.2 }}
                    name="genre"
                    value={formData.genre}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  >
                    <option value="">Select genre</option>
                    {genres.map(genre => (
                      <option key={genre} value={genre.toLowerCase()}>{genre}</option>
                    ))}
                  </motion.select>
                </div>

                <Input
                  label="Budget"
                  name="budget"
                  type="number"
                  value={formData.budget || ''}
                  onChange={handleInputChange}
                  error={errors.budget}
                  placeholder="0"
                  icon={<DollarSign className="w-4 h-4" />}
                />
              </div>

              {/* Start and End Dates */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Start Date"
                  name="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={handleInputChange}
                  icon={<Calendar className="w-4 h-4" />}
                />

                <Input
                  label="End Date"
                  name="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={handleInputChange}
                  error={errors.endDate}
                  icon={<Calendar className="w-4 h-4" />}
                />
              </div>

              {/* Actions */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  loading={isLoading}
                  className="flex-1 bg-primary hover:bg-primary-600"
                >
                  Create Project
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default CreateProjectModal;