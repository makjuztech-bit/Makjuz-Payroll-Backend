const express = require('express');
const router = express.Router();
const benefitController = require('../controllers/benefitController');
const auth = require('../middleware/auth');

// Protect all routes with authentication
router.use(auth);

// Create a new benefit
router.post('/', benefitController.createBenefit);

// Get all benefits for a company
router.get('/company/:companyId', benefitController.getBenefits);

// Get a single benefit
router.get('/:id', benefitController.getBenefitById);

// Update a benefit
router.put('/:id', benefitController.updateBenefit);

// Delete a benefit
router.delete('/:id', benefitController.deleteBenefit);

module.exports = router;