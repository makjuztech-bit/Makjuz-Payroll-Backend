const express = require('express');
const router = express.Router();
const companyController = require('../controllers/companyController');
const { authorize } = require('../middleware/rbac');

// READ (User, HR, Manager, Admin)
router.get('/', authorize('user', 'hr', 'manager', 'admin', 'superadmin'), companyController.getAllCompanies);
router.get('/:id', authorize('user', 'hr', 'manager', 'admin', 'superadmin'), companyController.getCompanyById);
router.get('/:companyId/employees', authorize('user', 'hr', 'manager', 'admin', 'superadmin'), companyController.getEmployeesByCompanyId);

// WRITE/DELETE (Admin only)
router.post('/', authorize('admin', 'superadmin'), companyController.createCompany);
router.put('/:id', authorize('admin', 'superadmin'), companyController.updateCompany);
router.delete('/:id', authorize('admin', 'superadmin'), companyController.deleteCompany);

module.exports = router;
