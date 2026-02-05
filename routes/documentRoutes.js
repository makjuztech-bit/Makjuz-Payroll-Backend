const express = require('express');
const router = express.Router();
const documentController = require('../controllers/documentController');
const { authorize } = require('../middleware/rbac');

// Documents are restricted to HR and Admin

// READ (User, HR, Admin)
router.post('/batch', authorize('user', 'hr', 'admin', 'superadmin'), documentController.getDocumentsBatch);
router.get('/:employeeId', authorize('user', 'hr', 'admin', 'superadmin'), documentController.getDocuments);

// WRITE (HR, Admin)
router.post('/:employeeId', authorize('hr', 'admin', 'superadmin'), documentController.uploadDocument);
router.delete('/:id', authorize('hr', 'admin', 'superadmin'), documentController.deleteDocument);

module.exports = router;
