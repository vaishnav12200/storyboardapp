'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'next/navigation';
import {
  Plus,
  DollarSign,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Download,
  Edit3,
  Trash2,
  Camera,
  Users,
  MapPin,
  Zap,
  Package,
  PieChart,
  BarChart3,
} from 'lucide-react';
import { useRequireAuth } from '@/hooks/useAuth';
import { useCurrentProject } from '@/hooks/useProjects';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { useAppDispatch, useAppSelector } from '@/lib/store';
import { fetchBudget, createBudgetItem, updateBudgetItem, deleteBudgetItem } from '@/lib/store/budgetSlice';
import { toast } from 'react-hot-toast';

interface BudgetItem {
  id: string;
  category: string;
  item: string;
  estimatedCost: number;
  actualCost: number;
  paid: boolean;
  notes?: string;
}

interface BudgetCategory {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  allocated: number;
  spent: number;
  remaining: number;
  items: BudgetItem[];
}

const BudgetPage = () => {
  useRequireAuth();
  const params = useParams();
  const projectId = params.projectId as string;
  const { project, isLoading } = useCurrentProject(projectId);

  // Redux hooks
  const dispatch = useAppDispatch();
  const { budget, items, isLoading: budgetLoading } = useAppSelector((state) => state.budget);

  // Fetch budget on component mount
  useEffect(() => {
    if (projectId) {
      dispatch(fetchBudget(projectId));
    }
  }, [projectId, dispatch]);

  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [viewMode, setViewMode] = useState<'overview' | 'detailed'>('overview');
  const [newItem, setNewItem] = useState({
    category: 'equipment',
    item: '',
    estimatedCost: '',
    actualCost: '',
    notes: ''
  });

  // Initialize categories
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
          items: [],
        },
        {
          id: 'crew',
          name: 'Crew',
          icon: Users,
          color: 'from-green-500 to-green-600',
          allocated: 0,
          spent: 0,
          remaining: 0,
          items: [],
        },
        {
          id: 'location',
          name: 'Locations',
          icon: MapPin,
          color: 'from-purple-500 to-purple-600',
          allocated: 0,
          spent: 0,
          remaining: 0,
          items: [],
        },
        {
          id: 'cast',
          name: 'Cast',
          icon: Users,
          color: 'from-pink-500 to-pink-600',
          allocated: 0,
          spent: 0,
          remaining: 0,
          items: [],
        },
        {
          id: 'post-production',
          name: 'Post-Production',
          icon: Zap,
          color: 'from-indigo-500 to-indigo-600',
          allocated: 0,
          spent: 0,
          remaining: 0,
          items: [],
        },
        {
          id: 'miscellaneous',
          name: 'Other',
          icon: Package,
          color: 'from-gray-500 to-gray-600',
          allocated: 0,
          spent: 0,
          remaining: 0,
          items: [],
        }
      ];
      setCategories(initialCategories);
    }
  }, [project]);

  const handleAddExpense = async () => {
    if (!newItem.item.trim() || !newItem.estimatedCost) {
      toast.error('Please enter item name and estimated cost');
      return;
    }

    const estimatedCost = parseFloat(newItem.estimatedCost);
    const actualCost = parseFloat(newItem.actualCost) || 0;

    if (isNaN(estimatedCost) || estimatedCost <= 0) {
      toast.error('Please enter a valid estimated cost');
      return;
    }

    try {
      // Map frontend categories to backend enum values
      const categoryMap: Record<string, string> = {
        'equipment': 'equipment',
        'crew': 'crew',
        'location': 'location',
        'cast': 'cast',
        'post-production': 'post-production',
        'miscellaneous': 'other'
      };

      const itemData = {
        name: newItem.item.trim(),
        description: newItem.item.trim(),
        category: categoryMap[newItem.category] || 'other' as any,
        unitType: 'flat' as const,
        quantity: 1,
        unitCost: estimatedCost,
        totalCost: estimatedCost,
        amount: estimatedCost,
        status: actualCost > 0 ? 'paid' as const : 'planned' as const,
        notes: newItem.notes.trim() || undefined,
        date: new Date().toISOString()
      };

      await dispatch(createBudgetItem({ projectId, itemData })).unwrap();

      // Update local state
      const expense: BudgetItem = {
        id: Date.now().toString(),
        category: newItem.category,
        item: newItem.item.trim(),
        estimatedCost,
        actualCost,
        paid: actualCost > 0,
        notes: newItem.notes.trim() || undefined
      };

      setCategories(categories.map(cat => {
        if (cat.id === newItem.category) {
          const newItems = [...cat.items, expense];
          const allocated = newItems.reduce((sum, item) => sum + item.estimatedCost, 0);
          const spent = newItems.reduce((sum, item) => sum + item.actualCost, 0);
          
          return {
            ...cat,
            items: newItems,
            allocated,
            spent,
            remaining: allocated - spent
          };
        }
        return cat;
      }));

      // Reset form
      setNewItem({
        category: 'equipment',
        item: '',
        estimatedCost: '',
        actualCost: '',
        notes: ''
      });
      setShowAddExpense(false);
      toast.success('Budget item added successfully!');
    } catch (error: any) {
      const errorMessage = error?.message || error || 'Failed to add budget item';
      toast.error(errorMessage);
      console.error('Budget add error:', errorMessage);
    }
  };

  const handleDeleteItem = (itemId: string, categoryId: string) => {
    setCategories(categories.map(cat => {
      if (cat.id === categoryId) {
        const newItems = cat.items.filter(item => item.id !== itemId);
        const allocated = newItems.reduce((sum, item) => sum + item.estimatedCost, 0);
        const spent = newItems.reduce((sum, item) => sum + item.actualCost, 0);
        
        return {
          ...cat,
          items: newItems,
          allocated,
          spent,
          remaining: allocated - spent
        };
      }
      return cat;
    }));
    toast.success('Budget item deleted successfully!');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getTotalSpent = () => {
    return categories.reduce((sum, cat) => sum + cat.spent, 0);
  };

  const getTotalAllocated = () => {
    return categories.reduce((sum, cat) => sum + cat.allocated, 0);
  };

  const getTotalRemaining = () => {
    return getTotalAllocated() - getTotalSpent();
  };

  const handleExportBudget = () => {
    const printWindow = window.open('', '', 'height=800,width=800');
    if (!printWindow) {
      toast.error('Failed to open print window. Please allow popups.');
      return;
    }

    const content = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${project?.title || 'Project'} - Budget Report</title>
          <style>
            @page {
              margin: 1in;
            }
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
            h1 {
              color: #4f46e5;
              border-bottom: 3px solid #4f46e5;
              padding-bottom: 10px;
              margin-bottom: 30px;
            }
            h2 {
              color: #6366f1;
              margin-top: 30px;
              margin-bottom: 15px;
              font-size: 20px;
            }
            .summary {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 20px;
              margin-bottom: 30px;
              padding: 20px;
              background: #f3f4f6;
              border-radius: 8px;
            }
            .summary-item {
              text-align: center;
            }
            .summary-value {
              font-size: 28px;
              font-weight: bold;
              color: #4f46e5;
            }
            .summary-label {
              font-size: 12px;
              color: #6b7280;
              text-transform: uppercase;
              margin-top: 5px;
            }
            .category {
              border: 1px solid #e5e7eb;
              border-radius: 8px;
              padding: 20px;
              margin-bottom: 25px;
              background: #f9fafb;
              page-break-inside: avoid;
            }
            .category-header {
              border-bottom: 2px solid #e5e7eb;
              padding-bottom: 15px;
              margin-bottom: 15px;
            }
            .category-title {
              font-size: 20px;
              font-weight: bold;
              color: #1f2937;
              margin-bottom: 8px;
            }
            .category-totals {
              display: grid;
              grid-template-columns: repeat(3, 1fr);
              gap: 10px;
              font-size: 14px;
              color: #4b5563;
            }
            .category-total-item {
              display: flex;
              flex-direction: column;
            }
            .total-label {
              font-size: 12px;
              color: #6b7280;
              margin-bottom: 2px;
            }
            .total-value {
              font-weight: 600;
              color: #1f2937;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 15px;
            }
            th {
              background: #f3f4f6;
              padding: 10px;
              text-align: left;
              font-weight: 600;
              color: #374151;
              border-bottom: 2px solid #e5e7eb;
            }
            td {
              padding: 10px;
              border-bottom: 1px solid #e5e7eb;
              color: #1f2937;
            }
            tr:last-child td {
              border-bottom: none;
            }
            .paid-badge {
              display: inline-block;
              padding: 2px 8px;
              border-radius: 12px;
              font-size: 11px;
              font-weight: 600;
            }
            .paid-yes {
              background: #d1fae5;
              color: #065f46;
            }
            .paid-no {
              background: #fee2e2;
              color: #991b1b;
            }
            .variance-positive {
              color: #059669;
            }
            .variance-negative {
              color: #dc2626;
            }
            @media print {
              .category {
                page-break-inside: avoid;
              }
            }
          </style>
        </head>
        <body>
          <h1>${project?.title || 'Project'} - Budget Report</h1>
          
          <div class="summary">
            <div class="summary-item">
              <div class="summary-value">${formatCurrency(getTotalAllocated())}</div>
              <div class="summary-label">Total Allocated</div>
            </div>
            <div class="summary-item">
              <div class="summary-value">${formatCurrency(getTotalSpent())}</div>
              <div class="summary-label">Total Spent</div>
            </div>
            <div class="summary-item">
              <div class="summary-value ${getTotalRemaining() >= 0 ? 'variance-positive' : 'variance-negative'}">${formatCurrency(getTotalRemaining())}</div>
              <div class="summary-label">Remaining</div>
            </div>
          </div>

          ${categories.map(category => `
            <div class="category">
              <div class="category-header">
                <div class="category-title">${category.name}</div>
                <div class="category-totals">
                  <div class="category-total-item">
                    <span class="total-label">Allocated</span>
                    <span class="total-value">${formatCurrency(category.allocated)}</span>
                  </div>
                  <div class="category-total-item">
                    <span class="total-label">Spent</span>
                    <span class="total-value">${formatCurrency(category.spent)}</span>
                  </div>
                  <div class="category-total-item">
                    <span class="total-label">Remaining</span>
                    <span class="total-value ${category.remaining >= 0 ? 'variance-positive' : 'variance-negative'}">${formatCurrency(category.remaining)}</span>
                  </div>
                </div>
              </div>
              
              ${category.items.length > 0 ? `
                <table>
                  <thead>
                    <tr>
                      <th>Item</th>
                      <th>Estimated</th>
                      <th>Actual</th>
                      <th>Variance</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${category.items.map(item => {
                      const variance = item.estimatedCost - item.actualCost;
                      return `
                        <tr>
                          <td>
                            <strong>${item.item}</strong>
                            ${item.notes ? `<br><small style="color: #6b7280;">${item.notes}</small>` : ''}
                          </td>
                          <td>${formatCurrency(item.estimatedCost)}</td>
                          <td>${formatCurrency(item.actualCost)}</td>
                          <td class="${variance >= 0 ? 'variance-positive' : 'variance-negative'}">
                            ${variance >= 0 ? '+' : ''}${formatCurrency(variance)}
                          </td>
                          <td>
                            <span class="paid-badge ${item.paid ? 'paid-yes' : 'paid-no'}">
                              ${item.paid ? 'Paid' : 'Unpaid'}
                            </span>
                          </td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              ` : '<p style="text-align: center; color: #6b7280; padding: 20px;">No items in this category yet.</p>'}
            </div>
          `).join('')}
        </body>
      </html>
    `;

    printWindow.document.write(content);
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 250);
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
            <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-900 mb-2">How Budget Allocation Works:</h3>
              <div className="text-sm text-blue-800 space-y-1">
                <p><strong>Allocated (Estimated):</strong> The amount you plan to spend for each item</p>
                <p><strong>Spent (Actual):</strong> The amount you've actually spent</p>
                <p><strong>Remaining:</strong> Allocated amount minus spent amount</p>
                <p><strong>Add Expense:</strong> Use this to add new budget items or record actual spending</p>
              </div>
            </div>
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
              onClick={handleExportBudget}
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
                  <p className="text-indigo-100 text-sm font-medium">Total Allocated</p>
                  <p className="text-2xl font-bold">{formatCurrency(getTotalAllocated())}</p>
                  <p className="text-indigo-100 text-xs">Planned budget</p>
                </div>
                <DollarSign className="w-8 h-8 text-white/80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-red-500 to-orange-500 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100 text-sm font-medium">Total Spent</p>
                  <p className="text-2xl font-bold">{formatCurrency(getTotalSpent())}</p>
                  <p className="text-red-100 text-xs">
                    {getTotalAllocated() > 0 ? Math.round((getTotalSpent() / getTotalAllocated()) * 100) : 0}% of allocated
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-white/80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-emerald-500 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100 text-sm font-medium">Remaining</p>
                  <p className="text-2xl font-bold">{formatCurrency(getTotalRemaining())}</p>
                  <p className="text-green-100 text-xs">
                    {getTotalAllocated() > 0 ? Math.round((getTotalRemaining() / getTotalAllocated()) * 100) : 0}% left
                  </p>
                </div>
                <TrendingDown className="w-8 h-8 text-white/80" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100 text-sm font-medium">Total Items</p>
                  <p className="text-2xl font-bold">{categories.reduce((sum, cat) => sum + cat.items.length, 0)}</p>
                  <p className="text-purple-100 text-xs">Budget items</p>
                </div>
                <CheckCircle className="w-8 h-8 text-white/80" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Budget Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category) => {
            const Icon = category.icon;
            const progress = category.allocated > 0 ? (category.spent / category.allocated) * 100 : 0;
            
            return (
              <Card key={category.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 bg-gradient-to-r ${category.color} rounded-lg flex items-center justify-center`}>
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{category.name}</h3>
                        <p className="text-sm text-gray-500">{category.items.length} items</p>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Allocated</span>
                      <span className="font-medium">{formatCurrency(category.allocated)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Spent</span>
                      <span className="font-medium text-red-600">{formatCurrency(category.spent)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Remaining</span>
                      <span className="font-medium text-green-600">{formatCurrency(category.remaining)}</span>
                    </div>
                  </div>
                  
                  <div>
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>Progress</span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <div className={`w-full bg-gray-200 rounded-full h-2`}>
                      <div 
                        className={`bg-gradient-to-r ${category.color} h-2 rounded-full transition-all duration-300`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Show recent items */}
                  {category.items.length > 0 && (
                    <div className="space-y-2">
                      {category.items.slice(0, 3).map((item) => (
                        <div key={item.id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-lg">
                          <span className="text-sm text-gray-700 truncate flex-1">{item.item}</span>
                          <div className="flex items-center gap-2 ml-2">
                            <span className="text-xs text-gray-500">{formatCurrency(item.estimatedCost)}</span>
                            {item.paid && <CheckCircle className="w-4 h-4 text-green-500" />}
                          </div>
                        </div>
                      ))}
                      {category.items.length > 3 && (
                        <p className="text-xs text-gray-500 text-center">
                          +{category.items.length - 3} more items
                        </p>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Detailed View */}
        {viewMode === 'detailed' && (
          <Card>
            <CardHeader>
              <CardTitle>Budget Items Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Item
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Allocated
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Spent
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {categories.flatMap(cat => 
                      cat.items.map(item => ({ ...item, categoryName: cat.name, categoryId: cat.id }))
                    ).map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">{item.item}</div>
                            {item.notes && (
                              <div className="text-sm text-gray-500">{item.notes}</div>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          <span className="text-sm text-gray-900">
                            {item.categoryName}
                          </span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(item.estimatedCost)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatCurrency(item.actualCost || 0)}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap">
                          {item.paid ? (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                              Paid
                            </span>
                          ) : (
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                              Pending
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteItem(item.id, item.categoryId)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Expense Modal */}
      <AnimatePresence>
        {showAddExpense && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowAddExpense(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Add New Budget Item
                </h3>
                <p className="text-sm text-gray-600 mt-2">
                  Track your production expenses and allocate budget properly
                </p>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem({...newItem, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="equipment">Equipment</option>
                    <option value="crew">Crew</option>
                    <option value="location">Location</option>
                    <option value="cast">Cast</option>
                    <option value="post-production">Post-Production</option>
                    <option value="miscellaneous">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Item Name *
                  </label>
                  <Input
                    value={newItem.item}
                    onChange={(e) => setNewItem({...newItem, item: e.target.value})}
                    placeholder="e.g., Camera rental, Actor fees"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estimated Cost (Allocated) *
                  </label>
                  <Input
                    type="number"
                    value={newItem.estimatedCost}
                    onChange={(e) => setNewItem({...newItem, estimatedCost: e.target.value})}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This is the amount you plan to spend (allocated budget)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Actual Cost (Spent)
                  </label>
                  <Input
                    type="number"
                    value={newItem.actualCost}
                    onChange={(e) => setNewItem({...newItem, actualCost: e.target.value})}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    This is the actual amount spent (leave 0 if not spent yet)
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Notes
                  </label>
                  <textarea
                    value={newItem.notes}
                    onChange={(e) => setNewItem({...newItem, notes: e.target.value})}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                    placeholder="Additional notes or details"
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200">
                <Button
                  variant="outline"
                  onClick={() => setShowAddExpense(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleAddExpense}>
                  Add Item
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardLayout>
  );
};

export default BudgetPage;