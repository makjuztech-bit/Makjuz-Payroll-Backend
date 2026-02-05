const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const { authorize } = require('../middleware/rbac');

// Documents are restricted to HR and Admin
router.use(authorize('hr', 'admin', 'superadmin'));

// Batch get documents (POST to send array of IDs)
router.post('/batch', documentController.getDocumentsBatch);

// Upload a document for an employee
router.post('/:employeeId', documentController.uploadDocument);

// Get documents by employee ID
router.get('/:employeeId', documentController.getDocuments);

// Delete document by ID
router.delete('/:id', documentController.deleteDocument);

module.exports = router;
