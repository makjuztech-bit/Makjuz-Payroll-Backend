const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
const Employee = require('../models/Employee');
const mongoose = require('mongoose');

// Process the uploaded excel file
exports.processPayrunExcel = async (filePath, month, year) => {
  try {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    // Validation results
    const results = {
      success: [],
      errors: [],
      totalProcessed: data.length
    };

    // Process each row from the Excel file
    for (const row of data) {
      try {
        // Validate required fields
        if (!row.ID) {
          results.errors.push({
            row: row,
            error: 'Missing employee ID',
          });
          continue;
        }

        // Clean up the employee ID by removing spaces and standardizing format
        let employeeId = row.ID.toString().trim();
        
        // Find the employee in the database - try multiple formats
        let employee = await Employee.findOne({ emp_id_no: employeeId });
        
        // If not found, try removing dashes
        if (!employee) {
          const idWithoutDash = employeeId.replace(/-/g, '');
          employee = await Employee.findOne({ emp_id_no: idWithoutDash });
        }
        
        // If still not found, try adding LIV prefix if not already there
        if (!employee && !employeeId.toUpperCase().startsWith('LIV')) {
          employee = await Employee.findOne({ emp_id_no: `LIV${employeeId}` });
        }
        
        // If still not found, try case-insensitive search
        if (!employee) {
          const empIdRegex = new RegExp(`^${employeeId}$`, 'i');
          employee = await Employee.findOne({ emp_id_no: empIdRegex });
        }

        if (!employee) {
          console.log(`Employee not found with ID: ${employeeId}`);
          results.errors.push({
            row: row,
            error: `Employee with ID ${employeeId} not found in database`,
          });
          continue;
        }

        // Calculate all the payrun fields
        const calculatedPayrun = calculatePayrun(row, employee);

        // Store the calculated payrun details in the database
        const key = `${month}_${year}`;
        const update = { $set: { [`payrun_details.${key}`]: calculatedPayrun } };
        await Employee.findByIdAndUpdate(employee._id, update);

        // Add to success results
        results.success.push({
          employeeId: employee.emp_id_no,
          name: employee.name,
          calculatedPayrun
        });

      } catch (error) {
        console.error('Error processing row:', error);
        results.errors.push({
          row: row,
          error: error.message
        });
      }
    }

    // Clean up the uploaded file after processing
    fs.unlinkSync(filePath);

    return results;
  } catch (error) {
    console.error('Error processing payrun excel:', error);
    throw error;
  }
};

// Calculate payrun details from excel data
const calculatePayrun = (row, employee) => {
  // Extract values from the Excel row with proper parsing and defaults
  const presentDays = parseFloat(row["PRESENT DAYS"] || 0);
  const holidays = parseFloat(row["HOLIDAYS"] || 0);
  const otHours = parseFloat(row["OT HOURS"] || 0);
  const totalFixedDays = parseFloat(row["TOTAL FIXED DAYS"] || 0) || 24; // Default to 24 if not specified
  const totalPayableDays = presentDays + holidays;
  
  // Base values - either from employee record or excel data
  const fixedStipend = parseFloat(row["FIXED STIPEND"] || employee.fixed_stipend || 0);
  const specialAllowance = parseFloat(row["SPECIAL ALLOWANCE"] || 0);
  
  // Calculate per day rates
  const perDayStipend = fixedStipend / totalFixedDays;
  const perDaySpecialAllowance = specialAllowance / totalFixedDays;
  
  // Calculate earnings
  const earnedStipend = parseFloat(row["EARNED STIPEND"] || 0) || Math.round(perDayStipend * presentDays);
  const earnedSpecialAllowance = parseFloat(row["EARNED SPECIAL ALLOWANCE"] || 0) || Math.round(perDaySpecialAllowance * presentDays);
  const earningsOt = parseFloat(row["EARNINGS OF OT"] || 0);
  const attendanceIncentive = parseFloat(row["ATTENDANCE INCENTIVE"] || 0);
  const transport = parseFloat(row["TRANSPORT"] || 0);
  
  // Calculate deductions
  const canteen = parseFloat(row["CANTEEN"] || 0);
  const managementFee = parseFloat(row["MANAGEMENT FEE"] || 0);
  const insurance = parseFloat(row["INSURANCE"] || 0);
  const lop = parseFloat(row["LOP"] || 0);
  
  // Calculate totals
  const totalEarning = parseFloat(row["TOTAL EARNING"] || 0) || 
    (earnedStipend + earnedSpecialAllowance + earningsOt + attendanceIncentive + transport);
  const totalDeductions = parseFloat(row["TOTAL DEDUCTIONS"] || 0) || 
    (canteen + managementFee + insurance + lop);
  const netEarning = parseFloat(row["NET EARNING"] || 0) || 
    (totalEarning - totalDeductions);
  
  // Calculate billing details
  const billableTotal = parseFloat(row["BILLABLE TOTAL"] || 0) || netEarning + managementFee + insurance;
  const gst = parseFloat(row["GST@ 18%"] || 0) || billableTotal * 0.18;
  const grandTotal = parseFloat(row["GRAND TOTAL"] || 0) || billableTotal + gst;
  const dbt = parseFloat(row["DBT"] || 0) || netEarning;
  const finalNetpay = parseFloat(row["final netpay"] || 0) || dbt || netEarning;
  const remarks = row["Remarks"] || "";
  const bankAccount = row["Bank Accout"] || employee.account_number || "";

  // Return the calculated values
  return {
    // Attendance details
    presentDays,
    holidays,
    otHours,
    totalFixedDays,
    totalPayableDays,
    
    // Base values
    fixedStipend,
    specialAllowance,
    
    // Earnings
    earnedStipend,
    earnedSpecialAllowance,
    earningsOt,
    attendanceIncentive,
    transport,
    
    // Deductions
    managementFee,
    insurance,
    canteen,
    lop,
    
    // Totals
    totalEarning,
    totalDeductions,
    netEarning,
    finalNetpay,
    
    // Billing
    billableTotal,
    gst,
    grandTotal,
    dbt,
    remarks,
    bankAccount
  };
};

// Get payrun summary for a specific month/year
exports.getPayrunSummary = async (companyId, month, year) => {
  try {
    const key = `${month}_${year}`;
    const query = { company: new mongoose.Types.ObjectId(companyId), [`payrun_details.${key}`]: { $exists: true } };
    const employees = await Employee.find(query);

    if (employees.length === 0) {
      return {
        month,
        year,
        totalEmployees: 0,
        totalSalary: 0,
        totalBillable: 0,
        totalGST: 0,
        totalGrandTotal: 0
      };
    }

    // Calculate summary statistics
    const totalEmployees = employees.length;
    let totalSalary = 0;
    let totalBillable = 0;
    let totalGST = 0;
    let totalGrandTotal = 0;

    for (const employee of employees) {
      const payrunDetails = employee.payrun_details.get(key);
      totalSalary += payrunDetails.finalNetpay || 0;
      totalBillable += payrunDetails.billableTotal || 0;
      totalGST += payrunDetails.gst || 0;
      totalGrandTotal += payrunDetails.grandTotal || 0;
    }

    return {
      month,
      year,
      totalEmployees,
      totalSalary,
      totalBillable,
      totalGST,
      totalGrandTotal
    };
  } catch (error) {
    console.error('Error getting payrun summary:', error);
    throw error;
  }
};

// Generate paysheet for a specific month/year
exports.generatePaysheet = async (companyId, month, year) => {
  try {
    const key = `${month}_${year}`;
    const query = { company: new mongoose.Types.ObjectId(companyId), [`payrun_details.${key}`]: { $exists: true } };
    const employees = await Employee.find(query).populate('company');

    if (employees.length === 0) {
      throw new Error('No payrun data found for the selected month and year');
    }

    // Create a workbook
    const workbook = xlsx.utils.book_new();
    
    // Prepare data for the paysheet - include more employee details
    const paysheetData = employees.map((employee, index) => {
      const payrun = employee.payrun_details.get(key);
      
      // Ensure payrun data exists and has values or use defaults
      if (!payrun) {
        console.error(`No payrun data for employee ${employee.name} (${employee.emp_id_no})`);
        return null; // Skip this employee
      }
      
      return {
        'SR.NO': index + 1,
        'ID': employee.emp_id_no,
        'TRAINEE NAME': employee.name,
        'Designation': employee.designation || '',
        'Department': employee.department || '',
        'Joining Date': employee.joining_date ? new Date(employee.joining_date).toLocaleDateString() : '',
        'PRESENT DAYS': payrun.presentDays || 0,
        'HOLIDAYS': payrun.holidays || 0,
        'LEAVE DAYS': payrun.leaveDays || 0,
        'OT HOURS': payrun.otHours || 0,
        'EARNINGS OF OT': payrun.earningsOt || 0,
        'TOTAL FIXED DAYS': payrun.totalFixedDays || 24,
        'TOTAL PAYABLE DAYS': payrun.totalPayableDays || 0,
        'FIXED STIPEND': payrun.fixedStipend || employee.fixed_stipend || 0,
        'SPECIAL ALLOWANCE': payrun.specialAllowance || 0,
        'EARNED STIPEND': payrun.earnedStipend || 0,
        'EARNED SPECIAL ALLOWANCE': payrun.earnedSpecialAllowance || 0,
        'EARNINGS OF OT': payrun.earningsOt || 0,
        'ATTENDANCE INCENTIVE': payrun.attendanceIncentive || 0,
        'TRANSPORT': payrun.transport || 0,
        'CANTEEN': payrun.canteen || 0,
        'TOTAL EARNING': payrun.totalEarning || 0,
        'TOTAL DEDUCTIONS': payrun.totalDeductions || 0,
        'NET EARNING': payrun.netEarning || 0,
        'MANAGEMENT FEE': payrun.managementFee || 0,
        'INSURANCE': payrun.insurance || 0,
        'BILLABLE TOTAL': payrun.billableTotal || 0,
        'GST@ 18%': payrun.gst || 0,
        'GRAND TOTAL': payrun.grandTotal || 0,
        'DBT': payrun.dbt || 0,
        'FINAL NETPAY': payrun.finalNetpay || 0,
        'LOP': payrun.lop || 0,
        'PAYMENT STATUS': payrun.paymentStatus || 'pending',
        'PAYMENT DATE': payrun.paymentDate ? new Date(payrun.paymentDate).toLocaleDateString() : '',
        'Remarks': payrun.remarks || '',
        'Bank Account': payrun.bankAccount || employee.account_number || '',
        'Bank Name': employee.bank_name || '',
        'IFSC Code': employee.ifsc_code || '',
        'UAN': employee.uan || '',
        'PF Number': employee.pf_number || '',
        'ESI Number': employee.esi_number || '',
        'Aadhar Number': employee.aadhar_number || ''
      };
    }).filter(Boolean); // Remove null entries
    
    // Define column widths for better readability
    const colWidths = [
      { wch: 6 },   // SR.NO
      { wch: 12 },  // ID
      { wch: 25 },  // TRAINEE NAME
      { wch: 20 },  // Designation
      { wch: 20 },  // Department
      { wch: 15 },  // Joining Date
      { wch: 12 },  // PRESENT DAYS
      { wch: 10 },  // HOLIDAYS
      { wch: 12 },  // LEAVE DAYS
      { wch: 10 },  // OT HOURS
      { wch: 15 },  // EARNINGS OF OT
      { wch: 15 },  // TOTAL FIXED DAYS
      { wch: 18 },  // TOTAL PAYABLE DAYS
      { wch: 15 },  // FIXED STIPEND
      { wch: 18 },  // SPECIAL ALLOWANCE
      { wch: 15 },  // EARNED STIPEND
      { wch: 25 },  // EARNED SPECIAL ALLOWANCE
      { wch: 15 },  // EARNINGS OF OT
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
      { wch: 13 },  // FINAL NETPAY
      { wch: 8 },   // LOP
      { wch: 15 },  // PAYMENT STATUS
      { wch: 15 },  // PAYMENT DATE
      { wch: 20 },  // Remarks
      { wch: 20 },  // Bank Account
      { wch: 20 },  // Bank Name
      { wch: 15 },  // IFSC Code
      { wch: 15 },  // UAN
      { wch: 15 },  // PF Number
      { wch: 15 },  // ESI Number
      { wch: 15 }   // Aadhar Number
    ];

    // Create a worksheet with the data
    const worksheet = xlsx.utils.json_to_sheet(paysheetData);
    
    // Apply column widths
    worksheet['!cols'] = colWidths;
    
    // Add the worksheet to the workbook
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Paysheet');
    
    // Add company summary sheet
    try {
      const company = employees[0].company;
      const summaryData = [{
        'Company Name': company.name,
        'Month': month,
        'Year': year,
        'Total Employees': employees.length,
        'Generated On': new Date().toLocaleString()
      }];
      
      const summaryWorksheet = xlsx.utils.json_to_sheet(summaryData);
      xlsx.utils.book_append_sheet(workbook, summaryWorksheet, 'Summary');
    } catch (error) {
      console.error('Error adding summary sheet:', error);
      // Continue without the summary sheet
    }
    
    // Generate a unique filename
    const filename = `paysheet_${month}_${year}_${Date.now()}.xlsx`;
    const filePath = path.join(__dirname, '..', 'uploads', filename);
    
    // Ensure the uploads directory exists
    const uploadsDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    // Write the workbook to a file
    xlsx.writeFile(workbook, filePath);
    
    return {
      filename,
      path: filePath
    };
  } catch (error) {
    console.error('Error generating paysheet:', error);
    throw error;
  }
}; 