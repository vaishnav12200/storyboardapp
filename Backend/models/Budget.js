const mongoose = require('mongoose');

const budgetSchema = new mongoose.Schema({
  project: {
    type: mongoose.Schema.ObjectId,
    ref: 'Project',
    required: [true, 'Budget must belong to a project']
  },
  title: {
    type: String,
    required: [true, 'Budget title is required'],
    trim: true,
    maxlength: [200, 'Budget title cannot be more than 200 characters']
  },
  description: String,
  currency: {
    type: String,
    required: [true, 'Currency is required'],
    enum: ['USD', 'EUR', 'GBP', 'INR', 'CAD', 'AUD', 'JPY', 'CNY'],
    default: 'USD'
  },
  totalBudget: {
    type: Number,
    required: [true, 'Total budget is required'],
    min: [0, 'Budget cannot be negative'],
    default: 0
  },
  categories: [{
    name: {
      type: String,
      required: [true, 'Category name is required'],
      enum: [
        'pre-production',
        'cast',
        'crew',
        'equipment',
        'location',
        'transportation',
        'catering',
        'costumes',
        'makeup',
        'props',
        'set-design',
        'post-production',
        'marketing',
        'insurance',
        'permits',
        'contingency',
        'other'
      ]
    },
    budgeted: {
      type: Number,
      required: [true, 'Budgeted amount is required'],
      min: [0, 'Budgeted amount cannot be negative'],
      default: 0
    },
    spent: {
      type: Number,
      default: 0,
      min: [0, 'Spent amount cannot be negative']
    },
    remaining: {
      type: Number,
      default: function() {
        return this.budgeted - this.spent;
      }
    },
    percentage: {
      type: Number,
      default: 0,
      min: [0, 'Percentage cannot be negative'],
      max: [100, 'Percentage cannot exceed 100']
    }
  }],
  expenses: [{
    date: {
      type: Date,
      required: [true, 'Expense date is required'],
      default: Date.now
    },
    description: {
      type: String,
      required: [true, 'Expense description is required'],
      trim: true,
      maxlength: [500, 'Description cannot be more than 500 characters']
    },
    category: {
      type: String,
      required: [true, 'Expense category is required'],
      enum: [
        'pre-production',
        'cast',
        'crew',
        'equipment',
        'location',
        'transportation',
        'catering',
        'costumes',
        'makeup',
        'props',
        'set-design',
        'post-production',
        'marketing',
        'insurance',
        'permits',
        'contingency',
        'other'
      ]
    },
    amount: {
      type: Number,
      required: [true, 'Expense amount is required'],
      min: [0, 'Expense amount cannot be negative']
    },
    vendor: {
      name: String,
      contact: String,
      email: String,
      address: String
    },
    paymentMethod: {
      type: String,
      enum: ['cash', 'check', 'credit-card', 'bank-transfer', 'paypal', 'other'],
      default: 'cash'
    },
    status: {
      type: String,
      enum: ['planned', 'approved', 'paid', 'overdue', 'cancelled'],
      default: 'planned'
    },
    receipt: {
      url: String,
      fileName: String,
      uploadedAt: Date
    },
    invoiceNumber: String,
    notes: String,
    approvedBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    approvedAt: Date,
    paidAt: Date,
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: true
    }
  }],
  summary: {
    totalBudgeted: {
      type: Number,
      default: 0
    },
    totalSpent: {
      type: Number,
      default: 0
    },
    totalRemaining: {
      type: Number,
      default: 0
    },
    percentageUsed: {
      type: Number,
      default: 0
    },
    overBudget: {
      type: Boolean,
      default: false
    },
    overBudgetAmount: {
      type: Number,
      default: 0
    }
  },
  settings: {
    autoCalculate: {
      type: Boolean,
      default: true
    },
    requireApproval: {
      type: Boolean,
      default: false
    },
    approvalLimit: {
      type: Number,
      default: 1000
    },
    warningThreshold: {
      type: Number,
      default: 80 // percentage
    }
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'completed', 'archived'],
    default: 'draft'
  },
  version: {
    type: Number,
    default: 1
  },
  previousVersions: [{
    version: Number,
    data: mongoose.Schema.Types.Mixed,
    createdAt: Date,
    createdBy: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    }
  }],
  createdBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User',
    required: true
  },
  lastModifiedBy: {
    type: mongoose.Schema.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
budgetSchema.index({ project: 1 });
budgetSchema.index({ project: 1, status: 1 });
budgetSchema.index({ 'expenses.date': -1 });
budgetSchema.index({ 'expenses.category': 1 });
budgetSchema.index({ 'expenses.status': 1 });

// Virtual for total expenses count
budgetSchema.virtual('totalExpenses').get(function() {
  return this.expenses.length;
});

// Virtual for pending expenses
budgetSchema.virtual('pendingExpenses').get(function() {
  return this.expenses.filter(expense => expense.status === 'planned' || expense.status === 'approved').length;
});

// Pre-save middleware to calculate summaries
budgetSchema.pre('save', function(next) {
  if (this.settings.autoCalculate) {
    this.calculateSummary();
  }
  next();
});

// Instance method to calculate budget summary
budgetSchema.methods.calculateSummary = function() {
  // Calculate category totals
  this.categories.forEach(category => {
    const categoryExpenses = this.expenses.filter(expense => 
      expense.category === category.name && expense.status === 'paid'
    );
    
    category.spent = categoryExpenses.reduce((total, expense) => total + expense.amount, 0);
    category.remaining = category.budgeted - category.spent;
    category.percentage = category.budgeted > 0 ? (category.spent / category.budgeted) * 100 : 0;
  });

  // Calculate overall summary
  this.summary.totalBudgeted = this.categories.reduce((total, category) => total + category.budgeted, 0);
  this.summary.totalSpent = this.categories.reduce((total, category) => total + category.spent, 0);
  this.summary.totalRemaining = this.summary.totalBudgeted - this.summary.totalSpent;
  this.summary.percentageUsed = this.summary.totalBudgeted > 0 ? 
    (this.summary.totalSpent / this.summary.totalBudgeted) * 100 : 0;
  
  this.summary.overBudget = this.summary.totalSpent > this.summary.totalBudgeted;
  this.summary.overBudgetAmount = this.summary.overBudget ? 
    this.summary.totalSpent - this.summary.totalBudgeted : 0;
};

// Instance method to add expense
budgetSchema.methods.addExpense = function(expenseData) {
  this.expenses.push({
    ...expenseData,
    createdBy: expenseData.createdBy
  });
  
  if (this.settings.autoCalculate) {
    this.calculateSummary();
  }
  
  return this.save();
};

// Instance method to check if over warning threshold
budgetSchema.methods.isOverWarningThreshold = function() {
  return this.summary.percentageUsed >= this.settings.warningThreshold;
};

// Instance method to get expenses by category
budgetSchema.methods.getExpensesByCategory = function(categoryName) {
  return this.expenses.filter(expense => expense.category === categoryName);
};

// Static method to get project budget overview
budgetSchema.statics.getProjectOverview = function(projectId) {
  return this.findOne({ project: projectId, status: 'active' })
    .populate('createdBy', 'firstName lastName email')
    .populate('expenses.createdBy', 'firstName lastName email')
    .populate('expenses.approvedBy', 'firstName lastName email');
};

module.exports = mongoose.model('Budget', budgetSchema);