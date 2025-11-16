'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'next/navigation';
import {
  Plus,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Upload,
  Edit3,
  Trash2,
  Filter,
  Search,
  FileText,
  Camera,
  Users,
  MapPin,
  Zap,
  Package,
  Car,
  Home,
  Utensils,
  Shirt,
  Music,
  Palette,
  Calendar,
  CreditCard,
  PieChart,
  BarChart3,
  Eye,
} from 'lucide-react';
import { useRequireAuth } from '@/hooks/useAuth';
import { useCurrentProject } from '@/hooks/useProjects';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { toast } from 'react-hot-toast';

interface BudgetCategory {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  allocated: number;
  spent: number;
  remaining: number;
  expenses: Expense[];
}

interface Expense {
  id: string;
  title: string;
  description: string;
  amount: number;
  date: string;
  status: 'pending' | 'approved' | 'paid' | 'rejected';
  category: string;
  vendor?: string;
  receiptUrl?: string;
  approvedBy?: string;
  paidDate?: string;
}

const BudgetPage = () => {
  useRequireAuth();
  const params = useParams();
  const projectId = params.projectId as string;
  const { project, isLoading } = useCurrentProject(projectId);

  const [totalBudget, setTotalBudget] = useState(0);
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'overview' | 'detailed'>('overview');
  const [newExpenseTitle, setNewExpenseTitle] = useState('');
  const [newExpenseDescription, setNewExpenseDescription] = useState('');
  const [newExpenseAmount, setNewExpenseAmount] = useState('');
  const [newExpenseCategory, setNewExpenseCategory] = useState('equipment');
  const [newExpenseVendor, setNewExpenseVendor] = useState('');
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [viewingExpense, setViewingExpense] = useState<Expense | null>(null);

  // Initialize budget categories
  useEffect(() => {
    if (project) {
      const initialCategories: BudgetCategory[] = [
        {
          id: 'equipment',
          name: 'Equipment',
          icon: Camera,
          color: 'from-blue-500 to-blue-600',
          allocated: 0,
          spent: 0,
          remaining: 0,
          expenses: [],
        },
        {
          id: 'crew',
          name: 'Crew',
          icon: Users,
          color: 'from-green-500 to-green-600',
          allocated: 0,
          spent: 0,
          remaining: 0,
          expenses: [],
        },
        {
          id: 'locations',
          name: 'Locations',
          icon: MapPin,
          color: 'from-purple-500 to-purple-600',
          allocated: 0,
          spent: 0,
          remaining: 0,
          expenses: [],
        },
        {
          id: 'props',
          name: 'Props & Costumes',
          icon: Shirt,
          color: 'from-pink-500 to-pink-600',
          allocated: 0,
          spent: 0,
          remaining: 0,
          expenses: [],
        },
        {
          id: 'post',
          name: 'Post-Production',
          icon: Palette,
          color: 'from-indigo-500 to-indigo-600',
          allocated: 0,
          spent: 0,
          remaining: 0,
          expenses: [],
        },
        {
          id: 'other',
          name: 'Other',
          icon: Package,
          color: 'from-gray-500 to-gray-600',
          allocated: 0,
          spent: 0,
          remaining: 0,
          expenses: [],
        },
      ];
      setCategories(initialCategories);
    }
  }, [project]);

  const totalSpent = categories.reduce((sum, cat) => sum + cat.spent, 0);
  const totalRemaining = totalBudget - totalSpent;
  const spentPercentage = (totalSpent / totalBudget) * 100;

  const allExpenses = categories.flatMap(cat => cat.expenses);
  const filteredExpenses = allExpenses.filter(expense => {
    const matchesSearch = expense.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         expense.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || expense.status === statusFilter;
    const matchesCategory = !selectedCategory || expense.category === selectedCategory;
    
    return matchesSearch && matchesStatus && matchesCategory;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'approved':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'pending':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'rejected':
        return <Trash2 className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'approved':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleAddExpense = () => {
    if (newExpenseTitle.trim() && newExpenseAmount) {
      const amount = parseFloat(newExpenseAmount);
      if (isNaN(amount) || amount <= 0) {
        toast.error('Please enter a valid amount');
        return;
      }

      if (editingExpense) {
        // Update existing expense
        const updatedCategories = categories.map(cat => ({
          ...cat,
          expenses: cat.expenses.map(exp =>
            exp.id === editingExpense.id
              ? {
                  ...exp,
                  title: newExpenseTitle.trim(),
                  description: newExpenseDescription.trim(),
                  amount,
                  category: newExpenseCategory,
                  vendor: newExpenseVendor.trim() || undefined
                }
              : exp
          ),
          spent: cat.expenses
            .map(exp => exp.id === editingExpense.id 
              ? { ...exp, amount } 
              : exp
            )
            .reduce((sum, exp) => sum + exp.amount, 0)
        }));
        
        setCategories(updatedCategories);
        setEditingExpense(null);
        toast.success('Expense updated successfully!');
      } else {
        // Add new expense
        const newExpense: Expense = {
          id: Date.now().toString(),
          title: newExpenseTitle.trim(),
          description: newExpenseDescription.trim(),
          amount,
          date: new Date().toISOString().split('T')[0],
          status: 'pending',
          category: newExpenseCategory,
          vendor: newExpenseVendor.trim() || undefined
        };

        // Update the category
        const updatedCategories = categories.map(cat => {
          if (cat.id === newExpenseCategory) {
            return {
              ...cat,
              expenses: [...cat.expenses, newExpense],
              spent: cat.spent + amount,
              remaining: cat.remaining - amount
            };
          }
          return cat;
        });

        setCategories(updatedCategories);
        toast.success('Expense added successfully!');
      }

      // Reset form
      setNewExpenseTitle('');
      setNewExpenseDescription('');
      setNewExpenseAmount('');
      setNewExpenseCategory('equipment');
      setNewExpenseVendor('');
      setShowAddExpense(false);
    }
  };

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense);
    setNewExpenseTitle(expense.title);
    setNewExpenseDescription(expense.description);
    setNewExpenseAmount(expense.amount.toString());
    setNewExpenseCategory(expense.category);
    setNewExpenseVendor(expense.vendor || '');
    setShowAddExpense(true);
  };

  const handleViewExpense = (expense: Expense) => {
    setViewingExpense(expense);
  };

  const handleDeleteExpense = (expenseId: string) => {
    const updatedCategories = categories.map(cat => ({
      ...cat,
      expenses: cat.expenses.filter(exp => exp.id !== expenseId),
      spent: cat.expenses.filter(exp => exp.id !== expenseId).reduce((sum, exp) => sum + exp.amount, 0)
    }));
    
    setCategories(updatedCategories);
    toast.success('Expense deleted successfully!');
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
            <h1 className="text-3xl font-bold text-gray-900">Budget Management</h1>
            <p className="text-gray-600">{project?.title}</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-gray-100 rounded-lg p-1">
              <Button
                variant={viewMode === 'overview' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('overview')}
                leftIcon={<PieChart className="w-4 h-4" />}
              >
                Overview
              </Button>
              <Button
                variant={viewMode === 'detailed' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('detailed')}
                leftIcon={<BarChart3 className="w-4 h-4" />}
              >
                Detailed
              </Button>
            </div>
            
            <Button
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => setShowAddExpense(true)}
            >
              Add Expense
            </Button>
            
            <Button
              variant="outline"
              leftIcon={<Download className="w-4 h-4" />}
            >
              Export Report
            </Button>
          </div>
        </div>

        {/* Budget Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-indigo-100 text-sm font-medium">Total Budget</p>
                  <p className="text-2xl font-bold">${totalBudget.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Total Spent</p>
                  <p className="text-2xl font-bold">${totalSpent.toLocaleString()}</p>
                  <p className="text-green-100 text-xs">{spentPercentage.toFixed(1)}% of budget</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100 text-sm font-medium">Remaining</p>
                  <p className="text-2xl font-bold">${totalRemaining.toLocaleString()}</p>
                  <p className="text-blue-100 text-xs">{(100 - spentPercentage).toFixed(1)}% left</p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <TrendingDown className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-100 text-sm font-medium">Pending Approval</p>
                  <p className="text-2xl font-bold">
                    ${allExpenses
                      .filter(e => e.status === 'pending')
                      .reduce((sum, e) => sum + e.amount, 0)
                      .toLocaleString()}
                  </p>
                  <p className="text-yellow-100 text-xs">
                    {allExpenses.filter(e => e.status === 'pending').length} expenses
                  </p>
                </div>
                <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {viewMode === 'overview' ? (
          /* Category Overview */
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {categories.map((category) => {
              const Icon = category.icon;
              const spentPercentage = (category.spent / category.allocated) * 100;
              
              return (
                <motion.div
                  key={category.id}
                  whileHover={{ scale: 1.02 }}
                  className="cursor-pointer"
                  onClick={() => {
                    setSelectedCategory(category.id);
                    setViewMode('detailed');
                  }}
                >
                  <Card className="h-full hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-3">
                          <div className={`w-10 h-10 bg-gradient-to-r ${category.color} rounded-lg flex items-center justify-center`}>
                            <Icon className="w-5 h-5 text-white" />
                          </div>
                          {category.name}
                        </CardTitle>
                        <span className="text-sm text-gray-500">
                          {category.expenses.length} expenses
                        </span>
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Allocated</span>
                          <span className="font-semibold">${category.allocated.toLocaleString()}</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Spent</span>
                          <span className="font-semibold text-red-600">${category.spent.toLocaleString()}</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600">Remaining</span>
                          <span className="font-semibold text-green-600">${category.remaining.toLocaleString()}</span>
                        </div>
                        
                        {/* Progress Bar */}
                        <div className="pt-2">
                          <div className="flex justify-between text-sm text-gray-600 mb-1">
                            <span>Progress</span>
                            <span>{spentPercentage.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`bg-gradient-to-r ${category.color} h-2 rounded-full transition-all duration-300`}
                              style={{ width: `${Math.min(spentPercentage, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        ) : (
          /* Detailed Expense View */
          <div className="space-y-6">
            {/* Filters */}
            <Card>
              <CardHeader>
                <CardTitle>Expense Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Search expenses..."
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
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="paid">Paid</option>
                    <option value="rejected">Rejected</option>
                  </select>
                  
                  <select
                    value={selectedCategory || 'all'}
                    onChange={(e) => setSelectedCategory(e.target.value === 'all' ? null : e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="all">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </CardContent>
            </Card>

            {/* Expense List */}
            <div className="space-y-4">
              {filteredExpenses.map((expense) => {
                const category = categories.find(cat => cat.id === expense.category);
                const Icon = category?.icon || Package;
                
                return (
                  <motion.div
                    key={expense.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4 flex-1">
                            <div className={`w-12 h-12 bg-gradient-to-r ${category?.color || 'from-gray-500 to-gray-600'} rounded-lg flex items-center justify-center flex-shrink-0`}>
                              <Icon className="w-6 h-6 text-white" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="text-lg font-semibold text-gray-900 truncate">
                                  {expense.title}
                                </h3>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(expense.status)}`}>
                                  {expense.status}
                                </span>
                              </div>
                              
                              <p className="text-gray-600 mb-2">{expense.description}</p>
                              
                              <div className="flex items-center gap-4 text-sm text-gray-500">
                                <span>📅 {new Date(expense.date).toLocaleDateString()}</span>
                                {expense.vendor && <span>🏢 {expense.vendor}</span>}
                                <span>📁 {category?.name}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <p className="text-2xl font-bold text-gray-900">
                                ${expense.amount.toLocaleString()}
                              </p>
                              {expense.status === 'paid' && expense.paidDate && (
                                <p className="text-xs text-green-600">
                                  Paid {new Date(expense.paidDate).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-1">
                              {getStatusIcon(expense.status)}
                              <Button
                                size="icon-sm"
                                variant="ghost"
                                onClick={() => handleViewExpense(expense)}
                                title="View details"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon-sm"
                                variant="ghost"
                                onClick={() => handleEditExpense(expense)}
                                title="Edit expense"
                              >
                                <Edit3 className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon-sm"
                                variant="ghost"
                                onClick={() => handleDeleteExpense(expense.id)}
                                title="Delete expense"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
              
              {filteredExpenses.length === 0 && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No expenses found</h3>
                    <p className="text-gray-600">Try adjusting your search or filter criteria</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      <AnimatePresence>
        {showAddExpense && (
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
                  {editingExpense ? 'Edit Budget Expense' : 'Add Budget Expense'}
                </h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowAddExpense(false)}
                >
                  ×
                </Button>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expense Title
                    </label>
                    <Input
                      value={newExpenseTitle}
                      onChange={(e) => setNewExpenseTitle(e.target.value)}
                      placeholder="Enter expense title"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Category
                    </label>
                    <select
                      value={newExpenseCategory}
                      onChange={(e) => setNewExpenseCategory(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary"
                    >
                      {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Amount ($)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={newExpenseAmount}
                      onChange={(e) => setNewExpenseAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={newExpenseDescription}
                      onChange={(e) => setNewExpenseDescription(e.target.value)}
                      placeholder="Enter description (optional)"
                      rows={3}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-primary focus:border-primary resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Vendor (Optional)
                    </label>
                    <Input
                      value={newExpenseVendor}
                      onChange={(e) => setNewExpenseVendor(e.target.value)}
                      placeholder="Enter vendor name"
                      className="w-full"
                    />
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setShowAddExpense(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddExpense}
                      className="flex-1 bg-primary"
                    >
                      {editingExpense ? 'Update Expense' : 'Add Expense'}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* View Expense Modal */}
      <AnimatePresence>
        {viewingExpense && (
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
                <h3 className="text-lg font-semibold text-gray-900">Expense Details</h3>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setViewingExpense(null)}
                >
                  ×
                </Button>
              </div>
              
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                    <p className="text-gray-900">{viewingExpense.title}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <p className="text-gray-900 capitalize">{viewingExpense.category}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                    <p className="text-gray-900 text-2xl font-bold">${viewingExpense.amount.toLocaleString()}</p>
                  </div>
                  {viewingExpense.description && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                      <p className="text-gray-900">{viewingExpense.description}</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                    <p className="text-gray-900">{new Date(viewingExpense.date).toLocaleDateString()}</p>
                  </div>
                  {viewingExpense.vendor && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
                      <p className="text-gray-900">{viewingExpense.vendor}</p>
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize ${getStatusColor(viewingExpense.status)}`}>
                      {viewingExpense.status}
                    </span>
                  </div>
                </div>
                <div className="flex gap-3 pt-6">
                  <Button
                    onClick={() => {
                      setViewingExpense(null);
                      handleEditExpense(viewingExpense);
                    }}
                    className="flex-1"
                  >
                    Edit Expense
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setViewingExpense(null)}
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

export default BudgetPage;
