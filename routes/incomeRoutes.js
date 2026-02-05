
const express = require('express');
const router = express.Router();
const incomeController = require('../controllers/incomeController');
const auth = require('../middleware/auth');

router.post('/', auth, incomeController.addIncome);
router.get('/', auth, incomeController.getIncomes);
router.delete('/:id', auth, incomeController.deleteIncome);

module.exports = router;
