
const express = require('express');
const router = express.Router();
const offerLetterController = require('../controllers/offerLetterController');
const auth = require('../middleware/auth');

// Get all
router.get('/', auth, offerLetterController.getCandidates);

// Add single
router.post('/', auth, offerLetterController.addCandidate);

// Bulk add
router.post('/bulk', auth, offerLetterController.addCandidatesBulk);

// Delete
router.delete('/:id', auth, offerLetterController.deleteCandidate);

// Send batch emails
router.post('/send-batch', auth, offerLetterController.sendBatchOfferLetters);

// Download PDF
router.post('/download', auth, offerLetterController.downloadOfferLetter);

module.exports = router;
