const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');
const { authorize } = require('../middleware/rbac');

// READ (User, HR, Manager, Admin)
router.get('/', authorize('user', 'hr', 'manager', 'admin', 'superadmin', 'md'), companyController.getAllCompanies);
router.get('/:id', authorize('user', 'hr', 'manager', 'admin', 'superadmin', 'md'), companyController.getCompanyById);
router.get('/:companyId/employees', authorize('user', 'hr', 'manager', 'admin', 'superadmin', 'md'), companyController.getEmployeesByCompanyId);

// WRITE/DELETE (Admin only)
router.post('/', authorize('admin', 'superadmin', 'md'), companyController.createCompany);
router.put('/:id', authorize('admin', 'superadmin', 'md'), companyController.updateCompany);
router.delete('/:id', authorize('admin', 'superadmin', 'md'), companyController.deleteCompany);

module.exports = router;
