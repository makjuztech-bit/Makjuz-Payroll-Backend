const express = require('express');
const router = express.Router();
const payrunController = require('../controllers/payrunController');
const { upload } = require('../middleware/uploadMiddleware');
const { authorize } = require('../middleware/rbac');

// Public-ish Summary (Shared access for User, HR, Manager, Admin)
router.get('/summary', authorize('user', 'hr', 'manager', 'admin', 'superadmin'), payrunController.getPayrunSummary);

// Restricted Operations (Restricted to HR and Admin roles)
router.use(authorize('hr', 'admin', 'superadmin'));

// Uploading
router.post('/upload', upload.single('payrunFile'), payrunController.uploadPayrunExcel);

// Template
router.get('/template', payrunController.getPayrunTemplate);
router.post('/template/upload', upload.single('templateFile'), payrunController.uploadPayslipTemplate);

// Multi-format Reports (PDF/Excel/Word/TXT)
router.get('/paysheet', payrunController.downloadPaysheet);
router.get('/pf-report', payrunController.downloadPFReport);
router.get('/esi-report', payrunController.downloadESIReport);
router.get('/payslip/word', payrunController.downloadWordPayslip);
router.get('/invoice', payrunController.downloadInvoice);
router.get('/bank-report', payrunController.downloadBankReport);

module.exports = router;