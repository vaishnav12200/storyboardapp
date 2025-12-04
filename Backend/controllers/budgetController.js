const Budget = require('../models/Budget');
const Project = require('../models/Project');
const { validationResult } = require('express-validator');

class BudgetController {
  // Create new budget
  async createBudget(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { projectId } = req.params;

      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }

      // Check if user has write permission
      const hasAccess = project.hasPermission(req.user.userId, 'write');
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Check if active budget already exists
      const existingBudget = await Budget.findOne({ 
        project: projectId, 
        status: 'active' 
      });

      if (existingBudget) {
        return res.status(400).json({
          success: false,
          message: 'Project already has an active budget. Archive the current budget to create a new one.'
        });
      }

      const budgetData = {
        ...req.body,
        project: projectId,
        createdBy: req.user.userId
      };

      const budget = new Budget(budgetData);
      await budget.save();

      await budget.populate([
        { path: 'project', select: 'title' },
        { path: 'createdBy', select: 'firstName lastName email' }
      ]);

      res.status(201).json({
        success: true,
        message: 'Budget created successfully',
        data: budget
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get project budget
  async getProjectBudget(req, res) {
    try {
      const { projectId } = req.params;

      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }

      // Check if user has read permission
      const hasAccess = project.hasPermission(req.user.userId, 'read');
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const budget = await Budget.getProjectOverview(projectId);

      if (!budget) {
        return res.status(404).json({
          success: false,
          message: 'No budget found for this project'
        });
      }

      res.status(200).json({
        success: true,
        data: budget
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get all budgets for a project
  async getBudgets(req, res) {
    try {
      const { projectId } = req.params;
      const { page = 1, limit = 10, status } = req.query;
      const skip = (page - 1) * limit;

      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }

      // Check if user has read permission
      const hasAccess = project.hasPermission(req.user.userId, 'read');
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const query = { project: projectId };
      if (status) query.status = status;

      const budgets = await Budget.find(query)
        .populate([
          { path: 'createdBy', select: 'firstName lastName email' },
          { path: 'lastModifiedBy', select: 'firstName lastName email' }
        ])
        .sort({ version: -1 })
        .skip(skip)
        .limit(parseInt(limit));

      const total = await Budget.countDocuments(query);

      res.status(200).json({
        success: true,
        data: {
          budgets,
          pagination: {
            current: parseInt(page),
            pages: Math.ceil(total / limit),
            total
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Update budget
  async updateBudget(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { budgetId } = req.params;

      const budget = await Budget.findById(budgetId).populate('project');
      if (!budget) {
        return res.status(404).json({
          success: false,
          message: 'Budget not found'
        });
      }

      // Check if user has write permission
      const hasAccess = budget.project.hasPermission(req.user.userId, 'write');
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Store previous version if significant changes
      if (req.body.categories || req.body.totalBudget) {
        budget.previousVersions.push({
          version: budget.version,
          data: budget.toObject(),
          createdAt: new Date(),
          createdBy: req.user.userId
        });
        budget.version += 1;
      }

      const updateData = {
        ...req.body,
        lastModifiedBy: req.user.userId
      };

      Object.assign(budget, updateData);
      await budget.save();

      await budget.populate([
        { path: 'createdBy', select: 'firstName lastName email' },
        { path: 'lastModifiedBy', select: 'firstName lastName email' }
      ]);

      res.status(200).json({
        success: true,
        message: 'Budget updated successfully',
        data: budget
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Add expense
  async addExpense(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const { budgetId } = req.params;

      const budget = await Budget.findById(budgetId).populate('project');
      if (!budget) {
        return res.status(404).json({
          success: false,
          message: 'Budget not found'
        });
      }

      // Check if user has write permission
      const hasAccess = budget.project.hasPermission(req.user.userId, 'write');
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Check if expense requires approval
      const expenseData = {
        ...req.body,
        createdBy: req.user.userId
      };

      if (budget.settings.requireApproval && 
          req.body.amount > budget.settings.approvalLimit) {
        expenseData.status = 'planned';
      }

      await budget.addExpense(expenseData);

      const addedExpense = budget.expenses[budget.expenses.length - 1];

      res.status(201).json({
        success: true,
        message: 'Expense added successfully',
        data: {
          expense: addedExpense,
          summary: budget.summary,
          isOverWarning: budget.isOverWarningThreshold()
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get expenses
  async getExpenses(req, res) {
    try {
      const { budgetId } = req.params;
      const { page = 1, limit = 10, category, status, startDate, endDate } = req.query;
      const skip = (page - 1) * limit;

      const budget = await Budget.findById(budgetId).populate('project');
      if (!budget) {
        return res.status(404).json({
          success: false,
          message: 'Budget not found'
        });
      }

      // Check if user has read permission
      const hasAccess = budget.project.hasPermission(req.user.userId, 'read');
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      let expenses = budget.expenses;

      // Apply filters
      if (category) {
        expenses = expenses.filter(expense => expense.category === category);
      }
      if (status) {
        expenses = expenses.filter(expense => expense.status === status);
      }
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        expenses = expenses.filter(expense => 
          expense.date >= start && expense.date <= end
        );
      }

      // Sort by date (newest first)
      expenses.sort((a, b) => new Date(b.date) - new Date(a.date));

      const total = expenses.length;
      const paginatedExpenses = expenses.slice(skip, skip + parseInt(limit));

      // Populate user references
      await Budget.populate(budget, {
        path: 'expenses.createdBy expenses.approvedBy',
        select: 'firstName lastName email'
      });

      res.status(200).json({
        success: true,
        data: {
          expenses: paginatedExpenses,
          pagination: {
            current: parseInt(page),
            pages: Math.ceil(total / limit),
            total
          },
          summary: budget.summary
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Update expense
  async updateExpense(req, res) {
    try {
      const { budgetId, expenseId } = req.params;

      const budget = await Budget.findById(budgetId).populate('project');
      if (!budget) {
        return res.status(404).json({
          success: false,
          message: 'Budget not found'
        });
      }

      // Check if user has write permission
      const hasAccess = budget.project.hasPermission(req.user.userId, 'write');
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const expense = budget.expenses.id(expenseId);
      if (!expense) {
        return res.status(404).json({
          success: false,
          message: 'Expense not found'
        });
      }

      Object.assign(expense, req.body);
      budget.lastModifiedBy = req.user.userId;
      
      await budget.save();

      res.status(200).json({
        success: true,
        message: 'Expense updated successfully',
        data: {
          expense,
          summary: budget.summary
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Delete expense
  async deleteExpense(req, res) {
    try {
      const { budgetId, expenseId } = req.params;

      const budget = await Budget.findById(budgetId).populate('project');
      if (!budget) {
        return res.status(404).json({
          success: false,
          message: 'Budget not found'
        });
      }

      // Check if user has delete permission
      const hasAccess = budget.project.hasPermission(req.user.userId, 'delete');
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      budget.expenses.id(expenseId).remove();
      budget.lastModifiedBy = req.user.userId;
      
      await budget.save();

      res.status(200).json({
        success: true,
        message: 'Expense deleted successfully',
        data: {
          summary: budget.summary,
          remainingExpenses: budget.expenses.length
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Approve expense
  async approveExpense(req, res) {
    try {
      const { budgetId, expenseId } = req.params;

      const budget = await Budget.findById(budgetId).populate('project');
      if (!budget) {
        return res.status(404).json({
          success: false,
          message: 'Budget not found'
        });
      }

      // Check if user has admin permission
      const hasAccess = budget.project.hasPermission(req.user.userId, 'admin');
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. Admin permission required to approve expenses.'
        });
      }

      const expense = budget.expenses.id(expenseId);
      if (!expense) {
        return res.status(404).json({
          success: false,
          message: 'Expense not found'
        });
      }

      expense.status = 'approved';
      expense.approvedBy = req.user.userId;
      expense.approvedAt = new Date();
      budget.lastModifiedBy = req.user.userId;

      await budget.save();

      res.status(200).json({
        success: true,
        message: 'Expense approved successfully',
        data: {
          expense,
          summary: budget.summary
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Mark expense as paid
  async markExpensePaid(req, res) {
    try {
      const { budgetId, expenseId } = req.params;

      const budget = await Budget.findById(budgetId).populate('project');
      if (!budget) {
        return res.status(404).json({
          success: false,
          message: 'Budget not found'
        });
      }

      // Check if user has write permission
      const hasAccess = budget.project.hasPermission(req.user.userId, 'write');
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const expense = budget.expenses.id(expenseId);
      if (!expense) {
        return res.status(404).json({
          success: false,
          message: 'Expense not found'
        });
      }

      expense.status = 'paid';
      expense.paidAt = new Date();
      budget.lastModifiedBy = req.user.userId;

      await budget.save();

      res.status(200).json({
        success: true,
        message: 'Expense marked as paid',
        data: {
          expense,
          summary: budget.summary
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Get budget categories summary
  async getCategoriesSummary(req, res) {
    try {
      const { budgetId } = req.params;

      const budget = await Budget.findById(budgetId).populate('project');
      if (!budget) {
        return res.status(404).json({
          success: false,
          message: 'Budget not found'
        });
      }

      // Check if user has read permission
      const hasAccess = budget.project.hasPermission(req.user.userId, 'read');
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const categoriesWithExpenses = budget.categories.map(category => {
        const categoryExpenses = budget.getExpensesByCategory(category.name);
        
        return {
          ...category.toObject(),
          expenses: categoryExpenses.length,
          pendingAmount: categoryExpenses
            .filter(exp => exp.status === 'planned' || exp.status === 'approved')
            .reduce((sum, exp) => sum + exp.amount, 0),
          paidAmount: categoryExpenses
            .filter(exp => exp.status === 'paid')
            .reduce((sum, exp) => sum + exp.amount, 0)
        };
      });

      res.status(200).json({
        success: true,
        data: {
          categories: categoriesWithExpenses,
          summary: budget.summary,
          isOverWarning: budget.isOverWarningThreshold()
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Generate budget report
  async generateReport(req, res) {
    try {
      const { budgetId } = req.params;
      const { format = 'json', startDate, endDate, category } = req.query;

      const budget = await Budget.findById(budgetId)
        .populate('project', 'title type')
        .populate('expenses.createdBy', 'firstName lastName')
        .populate('expenses.approvedBy', 'firstName lastName');

      if (!budget) {
        return res.status(404).json({
          success: false,
          message: 'Budget not found'
        });
      }

      // Check if user has read permission
      const hasAccess = budget.project.hasPermission(req.user.userId, 'read');
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      let filteredExpenses = budget.expenses;

      // Apply filters
      if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        filteredExpenses = filteredExpenses.filter(expense => 
          expense.date >= start && expense.date <= end
        );
      }

      if (category) {
        filteredExpenses = filteredExpenses.filter(expense => 
          expense.category === category
        );
      }

      const report = {
        project: budget.project,
        budget: {
          id: budget._id,
          title: budget.title,
          totalBudget: budget.totalBudget,
          currency: budget.currency,
          version: budget.version,
          status: budget.status
        },
        summary: budget.summary,
        categories: budget.categories,
        expenses: filteredExpenses,
        filters: {
          startDate,
          endDate,
          category
        },
        generatedAt: new Date(),
        generatedBy: req.user.userId
      };

      if (format === 'csv') {
        // Convert to CSV format (simplified)
        let csv = 'Date,Description,Category,Amount,Status,Vendor\n';
        filteredExpenses.forEach(expense => {
          csv += `${expense.date.toISOString().split('T')[0]},${expense.description},${expense.category},${expense.amount},${expense.status},"${expense.vendor?.name || ''}"\n`;
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="budget-report-${budget._id}.csv"`);
        return res.send(csv);
      }

      res.status(200).json({
        success: true,
        data: report
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Update budget categories
  async updateCategories(req, res) {
    try {
      const { budgetId } = req.params;
      const { categories } = req.body;

      const budget = await Budget.findById(budgetId).populate('project');
      if (!budget) {
        return res.status(404).json({
          success: false,
          message: 'Budget not found'
        });
      }

      // Check if user has write permission
      const hasAccess = budget.project.hasPermission(req.user.userId, 'write');
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Store previous version
      budget.previousVersions.push({
        version: budget.version,
        data: budget.toObject(),
        createdAt: new Date(),
        createdBy: req.user.userId
      });

      budget.categories = categories;
      budget.version += 1;
      budget.lastModifiedBy = req.user.userId;

      await budget.save();

      res.status(200).json({
        success: true,
        message: 'Budget categories updated successfully',
        data: {
          categories: budget.categories,
          summary: budget.summary,
          version: budget.version
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Add expense to project budget (frontend-compatible)
  async addExpenseToProject(req, res) {
    try {
      const { projectId } = req.params;

      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }

      const hasAccess = project.hasPermission(req.user.userId, 'write');
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      // Get or create budget for project
      let budget = await Budget.findOne({ project: projectId });
      
      if (!budget) {
        // Create default budget if none exists
        budget = new Budget({
          project: projectId,
          title: `${project.title} Budget`,
          currency: 'USD',
          totalBudget: 0,
          categories: [
            { name: 'pre-production', budgeted: 0, spent: 0 },
            { name: 'cast', budgeted: 0, spent: 0 },
            { name: 'crew', budgeted: 0, spent: 0 },
            { name: 'equipment', budgeted: 0, spent: 0 },
            { name: 'location', budgeted: 0, spent: 0 },
            { name: 'post-production', budgeted: 0, spent: 0 },
            { name: 'other', budgeted: 0, spent: 0 }
          ],
          createdBy: req.user.userId,
          status: 'active'
        });
        await budget.save();
      }

      const expenseData = {
        ...req.body,
        createdBy: req.user.userId,
        date: req.body.date || new Date(),
        status: req.body.status || 'planned'
      };

      budget.expenses.push(expenseData);
      await budget.save();

      const addedExpense = budget.expenses[budget.expenses.length - 1];

      res.status(201).json({
        success: true,
        message: 'Budget item added successfully',
        data: addedExpense
      });
    } catch (error) {
      console.error('Add expense error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to add expense'
      });
    }
  }

  // Update expense in project budget (frontend-compatible)
  async updateExpenseInProject(req, res) {
    try {
      const { projectId, itemId } = req.params;

      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }

      const hasAccess = project.hasPermission(req.user.userId, 'write');
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const budget = await Budget.findOne({ project: projectId });
      if (!budget) {
        return res.status(404).json({
          success: false,
          message: 'Budget not found'
        });
      }

      const expense = budget.expenses.id(itemId);
      if (!expense) {
        return res.status(404).json({
          success: false,
          message: 'Expense not found'
        });
      }

      Object.assign(expense, req.body);
      await budget.save();

      res.status(200).json({
        success: true,
        message: 'Expense updated successfully',
        data: expense
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Delete expense from project budget (frontend-compatible)
  async deleteExpenseFromProject(req, res) {
    try {
      const { projectId, itemId } = req.params;

      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }

      const hasAccess = project.hasPermission(req.user.userId, 'delete');
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const budget = await Budget.findOne({ project: projectId });
      if (!budget) {
        return res.status(404).json({
          success: false,
          message: 'Budget not found'
        });
      }

      budget.expenses.id(itemId).remove();
      await budget.save();

      res.status(200).json({
        success: true,
        message: 'Expense deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  // Update project budget (frontend-compatible)
  async updateProjectBudget(req, res) {
    try {
      const { projectId } = req.params;

      const project = await Project.findById(projectId);
      if (!project) {
        return res.status(404).json({
          success: false,
          message: 'Project not found'
        });
      }

      const hasAccess = project.hasPermission(req.user.userId, 'write');
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          message: 'Access denied'
        });
      }

      const budget = await Budget.findOne({ project: projectId });
      if (!budget) {
        return res.status(404).json({
          success: false,
          message: 'Budget not found'
        });
      }

      Object.assign(budget, req.body);
      await budget.save();

      res.status(200).json({
        success: true,
        message: 'Budget updated successfully',
        data: budget
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = new BudgetController();