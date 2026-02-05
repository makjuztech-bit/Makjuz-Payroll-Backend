
const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const auth = require('../middleware/auth');

router.post('/', auth, expenseController.addExpense);
router.get('/', auth, expenseController.getExpenses);
router.get('/:id', auth, expenseController.getExpenseById);
router.delete('/:id', auth, expenseController.deleteExpense);

module.exports = router;
