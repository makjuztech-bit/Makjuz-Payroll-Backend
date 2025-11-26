const express = require('express');
const router = express.Router();
const payrunController = require('../controllers/payrunController');
const { upload } = require('../middleware/uploadMiddleware');

// Route for uploading and processing an Excel file
router.post('/upload', upload.single('payrunFile'), payrunController.uploadPayrunExcel);

// Route for getting payrun summary
router.get('/summary', payrunController.getPayrunSummary);

// Route for generating and downloading paysheet
router.get('/paysheet', payrunController.downloadPaysheet);

// Route for downloading a template
router.get('/template', payrunController.getPayrunTemplate);

module.exports = router; 