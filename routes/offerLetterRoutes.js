const express = require('express');
const router = express.Router();
const offerLetterController = require('../controllers/offerLetterController');
const { authorize } = require('../middleware/rbac');

// READ (User, HR, Admin)
router.get('/', authorize('user', 'hr', 'manager', 'admin', 'superadmin', 'md'), offerLetterController.getCandidates);

// WRITE/DELETE (Restricted to HR and Admin)
router.post('/', authorize('hr', 'admin', 'superadmin', 'md'), offerLetterController.addCandidate);
router.post('/bulk', authorize('hr', 'admin', 'superadmin', 'md'), offerLetterController.addCandidatesBulk);
router.delete('/:id', authorize('hr', 'admin', 'superadmin', 'md'), offerLetterController.deleteCandidate);

// Generation & Sending (HR, Admin)
router.post('/send-batch', authorize('hr', 'admin', 'superadmin', 'md'), offerLetterController.sendBatchOfferLetters);
router.post('/download', authorize('user', 'hr', 'admin', 'superadmin', 'md'), offerLetterController.downloadOfferLetter);

module.exports = router;
