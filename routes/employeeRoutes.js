const express = require('express');
const router = express.Router();
const employeeController = require('../controllers/employeeController');
const { authorize, verifyCompanyAccess } = require('../middleware/rbac');

// READ routes (Shared access for User, HR, Manager, Admin)
router.get('/', authorize('user', 'hr', 'manager', 'admin', 'superadmin'), employeeController.getAllEmployees);
router.get('/count', authorize('user', 'hr', 'manager', 'admin', 'superadmin'), employeeController.getEmployeeCount);
router.get('/find-by-id', authorize('user', 'hr', 'manager', 'admin', 'superadmin'), employeeController.findEmployeeById);
router.get('/:id', authorize('user', 'hr', 'manager', 'admin', 'superadmin'), employeeController.getEmployeeById);
router.get('/:id/payrun', authorize('user', 'hr', 'manager', 'admin', 'superadmin'), employeeController.getEmployeePayrunDetails);

// WRITE routes (Restricted to HR and Admin)
router.post('/', authorize('hr', 'admin', 'superadmin'), employeeController.createEmployee);
router.put('/:id', authorize('hr', 'admin', 'superadmin'), employeeController.updateEmployee);
router.put('/:id/payrun', authorize('hr', 'admin', 'superadmin'), employeeController.updatePayrunDetails);
router.get('/:id/payslip', authorize('hr', 'admin', 'superadmin'), employeeController.getEmployeePayslip);

// CRITICAL routes (Admin only)
router.delete('/delete-all', authorize('admin', 'superadmin'), employeeController.deleteAllEmployees);
router.delete('/:id', authorize('admin', 'superadmin'), employeeController.deleteEmployee);

module.exports = router;
