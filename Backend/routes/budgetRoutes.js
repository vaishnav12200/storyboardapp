const express = require('express');
const budgetController = require('../controllers/budgetController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Budget CRUD routes
router.post('/projects/:projectId/budgets', budgetController.createBudget);
router.get('/projects/:projectId/budget', budgetController.getProjectBudget);
router.get('/projects/:projectId/budgets', budgetController.getBudgets);
router.put('/budgets/:budgetId', budgetController.updateBudget);

// Expense management routes
router.post('/budgets/:budgetId/expenses', budgetController.addExpense);
router.get('/budgets/:budgetId/expenses', budgetController.getExpenses);
router.put('/budgets/:budgetId/expenses/:expenseId', budgetController.updateExpense);
router.delete('/budgets/:budgetId/expenses/:expenseId', budgetController.deleteExpense);

// Expense approval workflow
router.patch('/budgets/:budgetId/expenses/:expenseId/approve', budgetController.approveExpense);
router.patch('/budgets/:budgetId/expenses/:expenseId/paid', budgetController.markExpensePaid);

// Budget analysis routes
router.get('/budgets/:budgetId/categories', budgetController.getCategoriesSummary);
router.get('/budgets/:budgetId/report', budgetController.generateReport);

// Budget structure management
router.put('/budgets/:budgetId/categories', budgetController.updateCategories);

module.exports = router;