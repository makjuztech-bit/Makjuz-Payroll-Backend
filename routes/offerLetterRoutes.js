const express = require('express');
const router = express.Router();
const offerLetterController = require('../controllers/offerLetterController');
const { authorize } = require('../middleware/rbac');

// Offer letters are managed exclusively by HR or Admin
router.use(authorize('hr', 'admin', 'superadmin'));

// Candidates Management
router.get('/', offerLetterController.getCandidates);
router.post('/', offerLetterController.addCandidate);
router.post('/bulk', offerLetterController.addCandidatesBulk);
router.delete('/:id', offerLetterController.deleteCandidate);

// Generation & Sending
router.post('/send-batch', offerLetterController.sendBatchOfferLetters);
router.post('/download', offerLetterController.downloadOfferLetter);

module.exports = router;
