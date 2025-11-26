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

    const { month, year, companyId } = req.body;
    if (!month || !year || !companyId) {
      return res.status(400).json({ message: 'Month, year, and company ID are required' });
    }

    // Check if data already exists for this month and year
    // try {
    //   const existingData = await payrunService.getPayrunSummary(companyId, month, year);
      
    //   // If data exists and has employees, prevent duplicate import
    //   if (existingData && existingData.totalEmployees > 0) {
    //     // Delete the uploaded file
    //     if (req.file.path && fs.existsSync(req.file.path)) {
    //       fs.unlinkSync(req.file.path);
    //     }
        
    //     return res.status(409).json({ 
    //       message: `Payrun data already exists for ${month} ${year}. Please use a different month or year.`,
    //       existingData
    //     });
    //   }
    // } catch (error) {
    //   // If error is not due to missing data, log it but continue
    //   if (error.message !== 'No payrun data found for the selected month and year') {
    //     console.warn('Error checking existing payrun data:', error);
    //   }
    //   // Continue with import - no existing data found
    // }

    const filePath = req.file.path;

    const results = await payrunService.processPayrunExcel(filePath, month, year, companyId);
 
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
        'SR.NO': 1,
        'ID': 'LEV001',
        'TRAINEE NAME': 'JOHN DOE',
        'PRESENT DAYS': 21.5,
        'HOLIDAYS': 0,
        'OT HOURS': 0,
        'EARNINGS OF OT': 0,
        'TOTAL FIXED DAYS': 24,
        'TOTAL PAYABLE DAYS': 21.5,
        'FIXED STIPEND': 15000,
        'SPECIAL ALLOWANCE': 1200,
        'EARNED STIPEND': 13125,
        'EARNED SPECIAL ALLOWANCE': 1050,
        'ATTENDANCE INCENTIVE': 0,
        'TRANSPORT': 175,
        'CANTEEN': 600,
        'TOTAL EARNING': 14350,
        'TOTAL DEDUCTIONS': 600,
        'NET EARNING': 13750,
        'MANAGEMENT FEE': 700,
        'INSURANCE': 150,
        'BILLABLE TOTAL': 14600,
        'GST@ 18%': 2628,
        'GRAND TOTAL': 17228,
        'DBT': 13750,
        'final netpay': 13750,
        'LOP': 0,
        'Remarks': '',
        'Bank Accout': '1234567890'
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
      { wch: 15 },  // EARNINGS OF OT
      { wch: 15 },  // TOTAL FIXED DAYS
      { wch: 18 },  // TOTAL PAYABLE DAYS
      { wch: 15 },  // FIXED STIPEND
      { wch: 18 },  // SPECIAL ALLOWANCE
      { wch: 15 },  // EARNED STIPEND
      { wch: 25 },  // EARNED SPECIAL ALLOWANCE
      { wch: 20 },  // ATTENDANCE INCENTIVE
      { wch: 12 },  // TRANSPORT
      { wch: 10 },  // CANTEEN
      { wch: 15 },  // TOTAL EARNING
      { wch: 18 },  // TOTAL DEDUCTIONS
      { wch: 13 },  // NET EARNING
      { wch: 15 },  // MANAGEMENT FEE
      { wch: 12 },  // INSURANCE
      { wch: 15 },  // BILLABLE TOTAL
      { wch: 10 },  // GST@ 18%
      { wch: 13 },  // GRAND TOTAL
      { wch: 8 },   // DBT
      { wch: 13 },  // final netpay
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