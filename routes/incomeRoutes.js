const express = require('express');
const router = express.Router();
const incomeController = require('../controllers/incomeController');
const { authorize } = require('../middleware/rbac');

// READ (User, HR, Admin)
router.get('/', authorize('user', 'hr', 'manager', 'admin', 'superadmin', 'md'), incomeController.getIncomes);

// WRITE/DELETE (HR, Admin)
router.post('/', authorize('hr', 'admin', 'superadmin', 'md'), incomeController.addIncome);
router.delete('/:id', authorize('hr', 'admin', 'superadmin', 'md'), incomeController.deleteIncome);

module.exports = router;
