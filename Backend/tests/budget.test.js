const mongoose = require('mongoose');
const Budget = require('../models/Budget');
const Project = require('../models/Project');
const User = require('../models/User');

// Mock data
const mockUser = {
  _id: new mongoose.Types.ObjectId(),
  firstName: 'Test',
  lastName: 'User',
  email: 'test@example.com',
  password: 'password123'
};

const mockProject = {
  _id: new mongoose.Types.ObjectId(),
  title: 'Test Project',
  owner: mockUser._id,
  type: 'short-film'
};

const mockBudget = {
  project: mockProject._id,
  title: 'Test Budget',
  currency: 'USD',
  totalBudget: 10000,
  categories: [
    { name: 'equipment', budgeted: 3000, spent: 0 },
    { name: 'crew', budgeted: 4000, spent: 0 },
    { name: 'location', budgeted: 2000, spent: 0 },
    { name: 'catering', budgeted: 1000, spent: 0 }
  ],
  createdBy: mockUser._id
};

describe('Budget Model', () => {
  beforeAll(async () => {
    // Connect to test database
    const mongoUri = process.env.TEST_MONGODB_URI || 'mongodb://localhost:27017/storyboard_test';
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    // Clean up and close connection
    await mongoose.connection.db.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear collections before each test
    await Budget.deleteMany({});
    await Project.deleteMany({});
    await User.deleteMany({});
    
    // Create test user and project
    await User.create(mockUser);
    await Project.create(mockProject);
  });

  describe('Budget Creation', () => {
    it('should create a budget successfully', async () => {
      const budget = new Budget(mockBudget);
      const savedBudget = await budget.save();

      expect(savedBudget._id).toBeDefined();
      expect(savedBudget.title).toBe(mockBudget.title);
      expect(savedBudget.totalBudget).toBe(mockBudget.totalBudget);
      expect(savedBudget.categories).toHaveLength(4);
    });

    it('should require project field', async () => {
      const budget = new Budget({ ...mockBudget, project: undefined });
      
      await expect(budget.save()).rejects.toThrow(/project.*required/i);
    });

    it('should require title field', async () => {
      const budget = new Budget({ ...mockBudget, title: undefined });
      
      await expect(budget.save()).rejects.toThrow(/title.*required/i);
    });

    it('should require currency field', async () => {
      const budget = new Budget({ ...mockBudget, currency: undefined });
      
      await expect(budget.save()).rejects.toThrow(/currency.*required/i);
    });

    it('should not allow negative total budget', async () => {
      const budget = new Budget({ ...mockBudget, totalBudget: -1000 });
      
      await expect(budget.save()).rejects.toThrow(/Budget cannot be negative/i);
    });

    it('should validate currency enum', async () => {
      const budget = new Budget({ ...mockBudget, currency: 'INVALID' });
      
      await expect(budget.save()).rejects.toThrow(/not a valid enum value/i);
    });
  });

  describe('Budget Categories', () => {
    it('should validate category names', async () => {
      const budget = new Budget({
        ...mockBudget,
        categories: [{ name: 'invalid-category', budgeted: 1000 }]
      });
      
      await expect(budget.save()).rejects.toThrow(/not a valid enum value/i);
    });

    it('should not allow negative budgeted amounts', async () => {
      const budget = new Budget({
        ...mockBudget,
        categories: [{ name: 'equipment', budgeted: -1000 }]
      });
      
      await expect(budget.save()).rejects.toThrow(/Budgeted amount cannot be negative/i);
    });

    it('should calculate remaining amount correctly', async () => {
      const budget = new Budget({
        ...mockBudget,
        categories: [{ name: 'equipment', budgeted: 1000, spent: 300 }]
      });
      
      const savedBudget = await budget.save();
      expect(savedBudget.categories[0].remaining).toBe(700);
    });
  });

  describe('Budget Expenses', () => {
    let budget;

    beforeEach(async () => {
      budget = new Budget(mockBudget);
      await budget.save();
    });

    it('should add expense successfully', async () => {
      const expenseData = {
        description: 'Camera rental',
        category: 'equipment',
        amount: 500,
        createdBy: mockUser._id
      };

      await budget.addExpense(expenseData);
      
      expect(budget.expenses).toHaveLength(1);
      expect(budget.expenses[0].description).toBe('Camera rental');
      expect(budget.expenses[0].amount).toBe(500);
    });

    it('should require expense description', async () => {
      const expenseData = {
        category: 'equipment',
        amount: 500,
        createdBy: mockUser._id
      };

      const budget = new Budget({
        ...mockBudget,
        expenses: [expenseData]
      });

      await expect(budget.save()).rejects.toThrow(/description.*required/i);
    });

    it('should require expense category', async () => {
      const expenseData = {
        description: 'Camera rental',
        amount: 500,
        createdBy: mockUser._id
      };

      const budget = new Budget({
        ...mockBudget,
        expenses: [expenseData]
      });

      await expect(budget.save()).rejects.toThrow(/category.*required/i);
    });

    it('should not allow negative expense amounts', async () => {
      const expenseData = {
        description: 'Camera rental',
        category: 'equipment',
        amount: -500,
        createdBy: mockUser._id
      };

      const budget = new Budget({
        ...mockBudget,
        expenses: [expenseData]
      });

      await expect(budget.save()).rejects.toThrow(/Expense amount cannot be negative/i);
    });
  });

  describe('Budget Calculations', () => {
    let budget;

    beforeEach(async () => {
      budget = new Budget(mockBudget);
      await budget.save();
    });

    it('should calculate summary correctly', async () => {
      // Add some expenses
      await budget.addExpense({
        description: 'Camera rental',
        category: 'equipment',
        amount: 1000,
        status: 'paid',
        createdBy: mockUser._id
      });

      await budget.addExpense({
        description: 'Crew payment',
        category: 'crew',
        amount: 2000,
        status: 'paid',
        createdBy: mockUser._id
      });

      budget.calculateSummary();

      expect(budget.summary.totalBudgeted).toBe(10000);
      expect(budget.summary.totalSpent).toBe(3000);
      expect(budget.summary.totalRemaining).toBe(7000);
      expect(budget.summary.percentageUsed).toBe(30);
      expect(budget.summary.overBudget).toBe(false);
    });

    it('should detect over budget situation', async () => {
      // Add expenses that exceed budget
      await budget.addExpense({
        description: 'Expensive equipment',
        category: 'equipment',
        amount: 12000,
        status: 'paid',
        createdBy: mockUser._id
      });

      budget.calculateSummary();

      expect(budget.summary.overBudget).toBe(true);
      expect(budget.summary.overBudgetAmount).toBe(2000);
    });

    it('should check warning threshold correctly', async () => {
      budget.settings.warningThreshold = 50;
      
      await budget.addExpense({
        description: 'Equipment',
        category: 'equipment',
        amount: 6000,
        status: 'paid',
        createdBy: mockUser._id
      });

      budget.calculateSummary();
      
      expect(budget.isOverWarningThreshold()).toBe(true);
    });
  });

  describe('Budget Methods', () => {
    let budget;

    beforeEach(async () => {
      budget = new Budget(mockBudget);
      await budget.save();
    });

    it('should get expenses by category', async () => {
      await budget.addExpense({
        description: 'Camera rental',
        category: 'equipment',
        amount: 1000,
        createdBy: mockUser._id
      });

      await budget.addExpense({
        description: 'Lights rental',
        category: 'equipment',
        amount: 500,
        createdBy: mockUser._id
      });

      await budget.addExpense({
        description: 'Catering',
        category: 'catering',
        amount: 300,
        createdBy: mockUser._id
      });

      const equipmentExpenses = budget.getExpensesByCategory('equipment');
      const cateringExpenses = budget.getExpensesByCategory('catering');

      expect(equipmentExpenses).toHaveLength(2);
      expect(cateringExpenses).toHaveLength(1);
      expect(equipmentExpenses[0].description).toBe('Camera rental');
    });

    it('should get project overview', async () => {
      const overview = await Budget.getProjectOverview(mockProject._id);
      
      expect(overview).toBeDefined();
      expect(overview.project.toString()).toBe(mockProject._id.toString());
    });
  });

  describe('Budget Versioning', () => {
    it('should increment version on significant changes', async () => {
      const budget = new Budget(mockBudget);
      await budget.save();

      expect(budget.version).toBe(1);
      
      // Make significant change
      budget.categories[0].budgeted = 5000;
      budget.previousVersions.push({
        version: budget.version,
        data: budget.toObject(),
        createdAt: new Date(),
        createdBy: mockUser._id
      });
      budget.version += 1;
      
      await budget.save();
      
      expect(budget.version).toBe(2);
      expect(budget.previousVersions).toHaveLength(1);
    });
  });
});

// Helper functions for testing
const createTestBudget = async (overrides = {}) => {
  const budget = new Budget({ ...mockBudget, ...overrides });
  return await budget.save();
};

const createTestExpense = (overrides = {}) => {
  return {
    description: 'Test expense',
    category: 'equipment',
    amount: 100,
    createdBy: mockUser._id,
    ...overrides
  };
};

module.exports = {
  createTestBudget,
  createTestExpense,
  mockUser,
  mockProject,
  mockBudget
};