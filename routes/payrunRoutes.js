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

// Routes for downloading PF and ESI reports
router.get('/pf-report', payrunController.downloadPFReport);
router.get('/esi-report', payrunController.downloadESIReport);

// Route for downloading a template
router.get('/template', payrunController.getPayrunTemplate);

// Template Routes
router.post('/template/upload', upload.single('templateFile'), payrunController.uploadPayslipTemplate);

// Word Payslip
router.get('/payslip/word', payrunController.downloadWordPayslip);

// Invoice
router.get('/invoice', payrunController.downloadInvoice);

// Bank Report
router.get('/bank-report', payrunController.downloadBankReport);

module.exports = router;