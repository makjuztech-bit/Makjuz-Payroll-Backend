const express = require('express');
const router = express.Router();
const benefitController = require('../controllers/benefitController');
const { authorize } = require('../middleware/rbac');

// READ (Shared access for User, HR, Manager, Admin)
router.get('/', authorize('user', 'hr', 'manager', 'admin', 'superadmin', 'md'), benefitController.getBenefits);
router.get('/company/:companyId', authorize('user', 'hr', 'manager', 'admin', 'superadmin', 'md'), benefitController.getBenefits);
router.get('/:id', authorize('user', 'hr', 'manager', 'admin', 'superadmin', 'md'), benefitController.getBenefitById);

// WRITE/DELETE (Restricted to HR and Admin)
router.post('/', authorize('hr', 'admin', 'superadmin', 'md'), benefitController.createBenefit);
router.put('/:id', authorize('hr', 'admin', 'superadmin', 'md'), benefitController.updateBenefit);
router.delete('/:id', authorize('hr', 'admin', 'superadmin', 'md'), benefitController.deleteBenefit);

module.exports = router;