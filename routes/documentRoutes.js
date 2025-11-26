const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const auth = require('../middleware/auth');

// Protect all routes with authentication
router.use(auth);

// Upload a document for an employee
router.post('/:employeeId', documentController.uploadDocument);

// Get document by employee ID
router.get('/:employeeId', documentController.getDocument);

// Delete document by employee ID
router.delete('/:employeeId', documentController.deleteDocument);

module.exports = router;
