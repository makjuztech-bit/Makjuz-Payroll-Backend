const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const { authorize } = require('../middleware/rbac');

// Documents are restricted to HR and Admin

// READ (User, HR, Admin)
router.post('/batch', authorize('user', 'hr', 'admin', 'superadmin', 'md'), documentController.getDocumentsBatch);
router.get('/:employeeId', authorize('user', 'hr', 'admin', 'superadmin', 'md'), documentController.getDocuments);

// WRITE (HR, Admin)
router.post('/:employeeId', authorize('hr', 'admin', 'superadmin', 'md'), documentController.uploadDocument);
router.delete('/:id', authorize('hr', 'admin', 'superadmin', 'md'), documentController.deleteDocument);

module.exports = router;
