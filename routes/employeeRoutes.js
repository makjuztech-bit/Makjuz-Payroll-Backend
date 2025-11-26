const express = require('express');
const router = express.Router();

// Import employeeController
const employeeController = require('../controllers/employeeController');

// Routes
router.get('/', employeeController.getAllEmployees); // This will handle ?companyId query param
router.get('/count', employeeController.getEmployeeCount); // New route for employee count
router.get('/find-by-id', employeeController.findEmployeeById); // New route to help debug ID formats
router.get('/:id', employeeController.getEmployeeById);
router.get('/:id/payrun', employeeController.getEmployeePayrunDetails); // Add the new payrun route
router.get('/:id/payslip', employeeController.getEmployeePayslip); // Route for generating payslip
router.put('/:id/payrun', employeeController.updatePayrunDetails); // Add PUT endpoint for updating payrun details
router.post('/', employeeController.createEmployee);
router.put('/:id', employeeController.updateEmployee);
router.delete('/:id', employeeController.deleteEmployee);

module.exports = router;
