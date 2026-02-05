const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const { authorize } = require('../middleware/rbac');

// READ (User, HR, Admin)
router.get('/', authorize('user', 'hr', 'manager', 'admin', 'superadmin'), expenseController.getExpenses);
router.get('/:id', authorize('user', 'hr', 'manager', 'admin', 'superadmin'), expenseController.getExpenseById);

// WRITE/DELETE (HR, Admin)
router.post('/', authorize('hr', 'admin', 'superadmin'), expenseController.addExpense);
router.delete('/:id', authorize('hr', 'admin', 'superadmin'), expenseController.deleteExpense);

module.exports = router;
