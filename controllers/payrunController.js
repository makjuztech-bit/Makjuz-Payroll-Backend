const payrunService = require('../services/payrunService');
const path = require('path');
const fs = require('fs');
const xlsx = require('xlsx');

// Upload and process payrun Excel
exports.uploadPayrunExcel = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { month, year, companyId, columnMapping } = req.body;
    if (!month || !year || !companyId) {
      return res.status(400).json({ message: 'Month, year, and company ID are required' });
    }

    let mapping = {};
    if (columnMapping) {
      try {
        mapping = JSON.parse(columnMapping);
      } catch (e) {
        console.warn('Failed to parse columnMapping:', e);
      }
    }

    // Check if data already exists logic removed/commented out previously

    const filePath = req.file.path;

    const results = await payrunService.processPayrunExcel(filePath, month, year, companyId, mapping);

    res.status(200).json(results);
  } catch (error) {
    console.error('Error uploading payrun excel:', error);

    // Clean up file if it exists
    if (req.file && req.file.path && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (unlinkError) {
        console.error('Error deleting temporary file:', unlinkError);
      }
    }

    res.status(500).json({ message: 'Error processing the uploaded file', details: error.message });
  }
};

// Get payrun summary for a specific month/year
exports.getPayrunSummary = async (req, res) => {
  try {
    const { companyId, month, year } = req.query;

    if (!companyId || !month || !year) {
      return res.status(400).json({ message: 'Company ID, month and year are required' });
    }

    const summary = await payrunService.getPayrunSummary(companyId, month, year);

    // Mask financial data for non-privileged users
    const isPrivileged = ['admin', 'hr', 'superadmin', 'manager'].includes(req.user?.role);
    if (!isPrivileged) {
      summary.totalSalary = 0;
      summary.totalBillable = 0;
      summary.totalGST = 0;
      summary.totalGrandTotal = 0;
    }

    res.status(200).json(summary);
  } catch (error) {
    console.error('Error getting payrun summary:', error);
    res.status(500).json({ message: 'Error getting payrun summary', details: error.message });
  }
};

// Download paysheet for a specific month/year
exports.downloadPaysheet = async (req, res) => {
  try {
    const { companyId, month, year } = req.query;

    if (!companyId || !month || !year) {
      return res.status(400).json({ message: 'Company ID, month and year are required' });
    }

    // Validate month and year format
    if (!/^(January|February|March|April|May|June|July|August|September|October|November|December)$/.test(month)) {
      return res.status(400).json({ message: 'Invalid month format. Expected full month name (e.g., January)' });
    }

    if (!/^\d{4}$/.test(year) || parseInt(year) < 2000 || parseInt(year) > 2100) {
      return res.status(400).json({ message: 'Invalid year format. Expected 4-digit year (e.g., 2023)' });
    }

    // Check if company exists
    const Company = require('../models/Company');
    const company = await Company.findById(companyId);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    console.log(`Generating paysheet for company ${company.name}, ${month} ${year}`);
    const paysheetInfo = await payrunService.generatePaysheet(companyId, month, year);

    if (!paysheetInfo || !paysheetInfo.path) {
      throw new Error('Failed to generate paysheet file');
    }

    // Set proper headers for Excel file
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=${paysheetInfo.filename}`);

    // Get file stats
    const stats = fs.statSync(paysheetInfo.path);
    res.setHeader('Content-Length', stats.size);

    // Create read stream
    const fileStream = fs.createReadStream(paysheetInfo.path);

    // Handle stream errors
    fileStream.on('error', (err) => {
      console.error('Error streaming paysheet file:', err);
      if (!res.headersSent) {
        res.status(500).json({ message: 'Error sending file', details: err.message });
      }
    });

    // Handle stream end
    fileStream.on('end', () => {
      console.log(`Paysheet downloaded successfully: ${paysheetInfo.filename}`);
      // Delete the file after sending
      try {
        fs.unlinkSync(paysheetInfo.path);
      } catch (unlinkErr) {
        console.error('Error deleting temporary file:', unlinkErr);
      }
    });

    // Pipe the file to the response
    fileStream.pipe(res);
  } catch (error) {
    console.error('Error downloading paysheet:', error);
    if (!res.headersSent) {
      res.status(500).json({
        message: 'Error generating paysheet',
        details: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    }
  }
};

// Get payrun template
exports.getPayrunTemplate = async (req, res) => {
  try {
    // Create a workbook
    const workbook = xlsx.utils.book_new();

    // Create template data with headers and example data
    const templateData = [
      {
        'Sr-No-': 1,
        'ID*': 'EMP1001',
        'TRAINEE NAME-*': 'JOHN DOE',
        'PRESENT DAYS*': 21.5,
        'HOLIDAYS': 1,
        'OT HOURS': 0,
        'TOTAL FIXED DAYS*': 24,
        'FIXED STIPEND*': 15000,
        'SPECIAL ALLOWANCE': 1200,
        'TRANSPORT': 175,
        'CANTEEN': 600,
        'MANAGEMENT FEE': 700,
        'INSURANCE': 150,
        'PF AMOUNT': 1000,
        'ESI AMOUNT': 200,
        'LOP': 0,
        'Remarks': '',
        'Bank Account': '1234567890'
      }
    ];

    // Create a worksheet with the template data
    const worksheet = xlsx.utils.json_to_sheet(templateData);

    // Add column widths for better readability
    const colWidths = [
      { wch: 6 },   // SR.NO
      { wch: 8 },   // ID
      { wch: 20 },  // TRAINEE NAME
      { wch: 12 },  // PRESENT DAYS
      { wch: 10 },  // HOLIDAYS
      { wch: 10 },  // OT HOURS
      { wch: 15 },  // TOTAL FIXED DAYS
      { wch: 15 },  // FIXED STIPEND
      { wch: 18 },  // SPECIAL ALLOWANCE
      { wch: 12 },  // TRANSPORT
      { wch: 10 },  // CANTEEN
      { wch: 15 },  // MANAGEMENT FEE
      { wch: 12 },  // INSURANCE
      { wch: 12 },  // PF AMOUNT
      { wch: 12 },  // ESI AMOUNT
      { wch: 8 },   // LOP
      { wch: 20 },  // Remarks
      { wch: 20 }   // Bank Accout
    ];
    worksheet['!cols'] = colWidths;

    // Add the worksheet to the workbook
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Payrun Template');

    // Generate a temporary file
    const filename = `payrun_template_${Date.now()}.xlsx`;
    const filePath = path.join(__dirname, '..', 'uploads', filename);

    // Ensure the uploads directory exists
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Write the workbook to a file
    xlsx.writeFile(workbook, filePath);

    // Send the file
    res.download(filePath, 'payrun_template.xlsx', (err) => {
      if (err) {
        console.error('Error sending template file:', err);
      } else {
        // Delete the file after sending
        try {
          fs.unlinkSync(filePath);
        } catch (unlinkErr) {
          console.error('Error deleting temporary template file:', unlinkErr);
        }
      }
    });
  } catch (error) {
    console.error('Error generating payrun template:', error);
    res.status(500).json({ message: 'Error generating template', details: error.message });
  }
};

// Download PF Report
exports.downloadPFReport = async (req, res) => {
  try {
    const { companyId, month, year, format = 'xlsx' } = req.query;
    if (!companyId || !month || !year) {
      return res.status(400).json({ message: 'Company ID, month and year are required' });
    }

    const reportInfo = await payrunService.generatePFReport(companyId, month, year, format);

    if (format === 'xlsx') {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    } else {
      res.setHeader('Content-Type', 'text/plain');
    }

    res.setHeader('Content-Disposition', `attachment; filename=${reportInfo.filename}`);

    const fileStream = fs.createReadStream(reportInfo.path);
    fileStream.pipe(res);

    fileStream.on('end', () => {
      try { fs.unlinkSync(reportInfo.path); } catch (e) { console.error('Error cleaning up:', e); }
    });
  } catch (error) {
    console.error('Error downloading PF report:', error);
    res.status(500).json({ message: error.message });
  }
};

// Download ESI Report
exports.downloadESIReport = async (req, res) => {
  try {
    const { companyId, month, year, format = 'xlsx' } = req.query;
    if (!companyId || !month || !year) {
      return res.status(400).json({ message: 'Company ID, month and year are required' });
    }

    const reportInfo = await payrunService.generateESIReport(companyId, month, year, format);

    if (format === 'xlsx') {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    } else {
      res.setHeader('Content-Type', 'text/plain');
    }

    res.setHeader('Content-Disposition', `attachment; filename=${reportInfo.filename}`);

    const fileStream = fs.createReadStream(reportInfo.path);
    fileStream.pipe(res);

    fileStream.on('end', () => {
      try { fs.unlinkSync(reportInfo.path); } catch (e) { console.error('Error cleaning up:', e); }
    });
  } catch (error) {
    console.error('Error downloading ESI report:', error);
    res.status(500).json({ message: error.message });
  }
};
// Upload Payslip Template (Word)
exports.uploadPayslipTemplate = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No template file uploaded' });
    }

    const templatesDir = path.join(__dirname, '..', 'templates');
    if (!fs.existsSync(templatesDir)) {
      fs.mkdirSync(templatesDir, { recursive: true });
    }

    const targetPath = path.join(templatesDir, 'payslip_template.docx');

    // Move/Rename file
    fs.renameSync(req.file.path, targetPath);

    res.status(200).json({ message: 'Payslip template uploaded successfully' });
  } catch (error) {
    console.error('Error uploading template:', error);
    res.status(500).json({ message: 'Error uploading template', details: error.message });
  }
};

// Download Word Payslip
exports.downloadWordPayslip = async (req, res) => {
  try {
    const { companyId, month, year, employeeId } = req.query;
    if (!companyId || !month || !year || !employeeId) {
      return res.status(400).json({ message: 'Company ID, Employee ID, month and year are required' });
    }

    const result = await payrunService.generateWordPayslip(companyId, employeeId, month, year);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename=${result.filename}`);

    const fileStream = fs.createReadStream(result.path);
    fileStream.pipe(res);

    fileStream.on('end', () => {
      try { fs.unlinkSync(result.path); } catch (e) { console.error('Cleanup error:', e); }
    });

  } catch (error) {
    console.error('Error downloading Word payslip:', error);
    res.status(500).json({ message: error.message });
  }
};

// Download Invoice (Word)
exports.downloadInvoice = async (req, res) => {
  try {
    const { companyId, month, year } = req.query;
    if (!companyId || !month || !year) {
      return res.status(400).json({ message: 'Company ID, month and year are required' });
    }

    const result = await payrunService.generateInvoice(companyId, month, year);

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    res.setHeader('Content-Disposition', `attachment; filename=${result.filename}`);

    const fileStream = fs.createReadStream(result.path);
    fileStream.pipe(res);

    fileStream.on('end', () => {
      try { fs.unlinkSync(result.path); } catch (e) { console.error('Cleanup error:', e); }
    });

  } catch (error) {
    console.error('Error downloading Invoice:', error);
    res.status(500).json({ message: error.message });
  }
};

// Download Bank Report (IOB or Non-IOB, Excel or TXT)
exports.downloadBankReport = async (req, res) => {
  try {
    const { companyId, month, year, type, format } = req.query;
    if (!companyId || !month || !year || !type || !format) {
      return res.status(400).json({ message: 'Company ID, month, year, type and format are required' });
    }

    const reportInfo = await payrunService.generateBankReport(companyId, month, year, type, format);

    if (format === 'xlsx') {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    } else {
      res.setHeader('Content-Type', 'text/plain');
    }

    res.setHeader('Content-Disposition', `attachment; filename=${reportInfo.filename}`);

    const fileStream = fs.createReadStream(reportInfo.path);
    fileStream.pipe(res);

    fileStream.on('end', () => {
      try {
        fs.unlinkSync(reportInfo.path);
      } catch (err) {
        console.error('Error deleting bank report file:', err);
      }
    });

  } catch (error) {
    console.error('Error downloading bank report:', error);
    res.status(500).json({ message: error.message });
  }
};