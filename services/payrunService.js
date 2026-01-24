const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
const Employee = require('../models/Employee');
const Company = require('../models/Company');
const mongoose = require('mongoose');

// Helper to find value from row using multiple possible key names (case/symbol insensitive)
const getValue = (row, aliases, defaultValue = 0) => {
  if (!row || typeof row !== 'object') return defaultValue;

  const rowKeys = Object.keys(row);
  const normalizedRowKeys = rowKeys.reduce((acc, key) => {
    // "Present Days" -> "presentdays"
    acc[key.toLowerCase().replace(/[^a-z0-9]/g, '')] = key;
    return acc;
  }, {});

  for (const alias of aliases) {
    const cleanAlias = alias.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (normalizedRowKeys[cleanAlias]) {
      const originalKey = normalizedRowKeys[cleanAlias];
      if (row[originalKey] !== undefined && row[originalKey] !== null && row[originalKey] !== '') {
        return row[originalKey];
      }
    }
  }

  return defaultValue;
};

// Process the uploaded excel file
exports.processPayrunExcel = async (filePath, month, year, companyId, columnMapping = {}) => {
  try {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Read as array of arrays to find the header row
    const rawData = xlsx.utils.sheet_to_json(worksheet, { header: 1, defval: "" });

    // Validation results
    const results = {
      success: [],
      errors: [],
      totalProcessed: 0
    };

    if (!rawData || rawData.length === 0) {
      throw new Error("Excel sheet is empty");
    }

    // Smart Header Detection
    let headerRowIndex = -1;
    let headerMap = {}; // Map of normalized column name -> index

    const requiredKeywords = ['id', 'emp', 'code', 'no'];

    for (let i = 0; i < Math.min(rawData.length, 20); i++) { // Scan first 20 rows
      const row = rawData[i];
      if (!Array.isArray(row)) continue;

      const rowStr = row.join(' ').toLowerCase();
      // Check if row has keywords resembling an ID column
      const hasIdColumn = row.some(cell => {
        if (!cell) return false;
        const val = cell.toString().toLowerCase().replace(/[^a-z0-9]/g, '');
        return ['id', 'empid', 'employeeid', 'empno', 'code', 'empcode', 'srno'].includes(val);
      });

      if (hasIdColumn) {
        headerRowIndex = i;
        // Build header map
        row.forEach((cell, index) => {
          if (cell) {
            const normalized = cell.toString().toLowerCase().replace(/[^a-z0-9]/g, '');
            headerMap[normalized] = index;
            // Also store exact text for loose matching if needed
            headerMap[cell.toString()] = index;
          }
        });
        console.log(`DEBUG: Found header at row ${i}:`, Object.keys(headerMap));
        break;
      }
    }

    if (headerRowIndex === -1) {
      // Fallback: Assume row 0 is header if we couldn't find one
      console.log("DEBUG: Could not detect header row, defaulting to row 0");
      headerRowIndex = 0;
      if (rawData[0]) {
        rawData[0].forEach((cell, index) => {
          if (cell) {
            const normalized = cell.toString().toLowerCase().replace(/[^a-z0-9]/g, '');
            headerMap[normalized] = index;
          }
        });
      }
    }

    // Process data rows
    const dataRows = rawData.slice(headerRowIndex + 1);
    results.totalProcessed = dataRows.length;

    // Helper to get value
    const getValueByIndex = (rowArray, aliases, key, defaultValue = 0) => {
      if (!rowArray) return defaultValue;

      // 1. Check strict mapping if provided
      if (key && columnMapping && columnMapping[key]) {
        const mappedHeader = columnMapping[key].toString().toLowerCase().replace(/[^a-z0-9]/g, '');
        // Try strict map first
        let idx = headerMap[mappedHeader];
        // If not found in normalized map, maybe user typed exact header? 
        // We stored normalized keys in headerMap, so we normalize user input.

        if (idx !== undefined) {
          const val = rowArray[idx];
          if (val !== undefined && val !== null && val !== '') return val;
        }
      }

      // 2. Fallback to Alias Search
      if (Array.isArray(aliases)) {
        for (const alias of aliases) {
          const cleanAlias = alias.toLowerCase().replace(/[^a-z0-9]/g, '');
          let colIndex = headerMap[cleanAlias];

          if (colIndex !== undefined) {
            const val = rowArray[colIndex];
            if (val !== undefined && val !== null && val !== '') return val;
          }
        }
      }
      return defaultValue;
    };

    // Helper to reconstruct row object for frontend
    const reconstructRowObject = (rowArray) => {
      const obj = {};
      if (headerRowIndex > -1 && rawData[headerRowIndex]) {
        rawData[headerRowIndex].forEach((headerName, idx) => {
          if (headerName && idx < rowArray.length) {
            obj[headerName] = rowArray[idx];
          }
        });
      } else {
        // Fallback if no header row found (should cover index 0 case)
        rowArray.forEach((val, idx) => {
          obj[`Column${idx}`] = val;
        });
      }

      // Ensure standard keys exist for frontend validation/display
      const standardId = getValueByIndex(rowArray, ['ID', 'Employee ID', 'Emp ID', 'EMP_ID', 'Emp No', 'Employee No', 'Code'], null);
      if (standardId) obj['ID'] = standardId;

      const standardName = getValueByIndex(rowArray, ['TRAINEE NAME', 'Name', 'Employee Name', 'Full Name'], null);
      if (standardName) obj['TRAINEE NAME'] = standardName;

      return obj;
    };

    for (const row of dataRows) {
      // Skip empty rows
      if (!row || row.length === 0 || row.every(cell => !cell)) continue;

      // Reconstruct object for frontend display
      const rowObject = reconstructRowObject(row);

      try {
        // Validate required fields
        const rawId = getValueByIndex(row, ['ID', 'Employee ID', 'Emp ID', 'EMP_ID', 'Emp No', 'Employee No', 'Code'], null);

        if (!rawId) {
          // Only log error if the row looks like it should have data
          const hasName = getValueByIndex(row, ['Name', 'Trainee Name', 'Employee Name'], null);
          if (hasName) {
            results.errors.push({
              row: rowObject,
              error: 'Missing employee ID',
            });
          }
          continue;
        }

        // Clean up the employee ID
        let employeeId = rawId.toString().trim();

        // Find the employee in the database - try multiple formats
        let employee = await Employee.findOne({ emp_id_no: employeeId });

        // If not found, try removing all non-alphanumeric characters (dashes, spaces, etc.)
        if (!employee) {
          const cleanId = employeeId.replace(/[^a-zA-Z0-9]/g, '');
          if (cleanId !== employeeId) {
            employee = await Employee.findOne({ emp_id_no: cleanId });
          }
        }

        // If still not found, try case-insensitive search
        if (!employee) {
          const empIdRegex = new RegExp(`^${employeeId}$`, 'i');
          employee = await Employee.findOne({ emp_id_no: empIdRegex });
        }

        // If still not found, try adding LIV prefix if not already there (legacy support)
        if (!employee && !employeeId.toUpperCase().startsWith('LIV')) {
          employee = await Employee.findOne({ emp_id_no: `LIV${employeeId}` });
        }

        // Deep Search: Match based on numeric value (handles LSPL00157 -> LIV157, 00123 -> 123, etc.)
        if (!employee) {
          const inputDigits = employeeId.replace(/\D/g, ''); // Extract all digits "00157"
          if (inputDigits.length > 0) {
            const inputNumVal = parseInt(inputDigits, 10); // 157

            // Find candidates that end with numbers
            // We perform a broad regex search first to get potential matches
            const candidates = await Employee.find({
              emp_id_no: { $regex: /[0-9]+$/ }
            });

            // Create a more robust matching function
            const isMatch = (dbId) => {
              const dbDigits = dbId.replace(/\D/g, '');
              if (!dbDigits) return false;
              return parseInt(dbDigits, 10) === inputNumVal;
            };

            const matches = candidates.filter(c => isMatch(c.emp_id_no));

            if (matches.length === 1) {
              employee = matches[0];
              console.log(`DEBUG: Numeric matched ${employeeId} (${inputNumVal}) to ${employee.emp_id_no}`);
            } else if (matches.length > 1) {
              // If multiple matches, prefer LIV prefix
              const livMatch = matches.find(c => c.emp_id_no.toUpperCase().startsWith('LIV'));
              // If no LIV match, try finding one that ends with exact string match (e.g. 00157)
              const exactSuffixMatch = matches.find(c => c.emp_id_no.endsWith(inputDigits));

              employee = livMatch || exactSuffixMatch || matches[0];
              console.log(`DEBUG: Numeric matched ${employeeId} (${inputNumVal}) to ${employee.emp_id_no} (from ${matches.length} candidates)`);
            }
          }
        }

        if (!employee) {
          console.log(`Employee not found with ID: ${employeeId}`);
          results.errors.push({
            row: row,
            error: `Employee with ID ${employeeId} not found in database`,
          });
          continue;
        }

        // Calculate payrun fields using the new index-based getter
        const calculatedPayrun = calculatePayrunFromRowArray(row, employee, getValueByIndex);

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
          row: rowObject,
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

// Updated calculation function for Array rows
const calculatePayrunFromRowArray = (row, employee, getValue) => {
  // Extract values using flexible alias matching
  const presentDays = parseFloat(getValue(row, ['PRESENT DAYS', 'Present', 'P Days', 'Days Present', 'PD', 'Actual Days', 'Paid Days', 'Days Worked', 'Attendance'], 'presentDays', 0));
  const holidays = parseFloat(getValue(row, ['HOLIDAYS', 'Holiday', 'Leaves', 'Leave Days', 'H', 'HD', 'Week Off', 'WO', 'Off Days'], 'holidays', 0));
  const otHours = parseFloat(getValue(row, ['OT HOURS', 'OT', 'Overtime', 'Overtime Hours', 'OT Hrs', 'Extra Hours'], 'otHours', 0));
  const totalFixedDays = parseFloat(getValue(row, ['TOTAL FIXED DAYS', 'Fixed Days', 'Month Days', 'Days in Month', 'Total Days', 'Working Days'], 'totalFixedDays', 24));
  const totalPayableDays = presentDays + holidays;

  // Base values
  const fixedStipend = parseFloat(getValue(row, ['FIXED STIPEND', 'Fixed Salary', 'Stipend', 'Basic', 'CTC', 'Gross Salary', 'Basic Salary', 'Rate', 'Salary'], 'fixedStipend', employee.fixed_stipend || 0));
  const specialAllowance = parseFloat(getValue(row, ['SPECIAL ALLOWANCE', 'Active Allowance', 'Special', 'Other Allowance', 'Allowance', 'Spcl Allow'], 'specialAllowance', 0));

  // Calculate per day rates
  const perDayStipend = totalFixedDays > 0 ? fixedStipend / totalFixedDays : 0;
  const perDaySpecialAllowance = totalFixedDays > 0 ? specialAllowance / totalFixedDays : 0;

  // Calculate earnings
  const earnedStipend = parseFloat(getValue(row, ['EARNED STIPEND', 'Earned Basic'], 'earnedStipend', Math.round(perDayStipend * presentDays)));
  const earnedSpecialAllowance = parseFloat(getValue(row, ['EARNED SPECIAL ALLOWANCE', 'Earned Special'], 'earnedSpecialAllowance', Math.round(perDaySpecialAllowance * presentDays)));
  const earningsOt = parseFloat(getValue(row, ['EARNINGS OF OT', 'OT Payment', 'OT Amount'], 'earningsOt', 0));
  const attendanceIncentive = parseFloat(getValue(row, ['ATTENDANCE INCENTIVE', 'Incentive', 'Bonus'], 'attendanceIncentive', 0));
  const transport = parseFloat(getValue(row, ['TRANSPORT', 'Travel', 'Conveyance'], 'transport', 0));

  // Calculate deductions
  const canteen = parseFloat(getValue(row, ['CANTEEN', 'Food', 'Mess'], 'canteen', 0));
  const managementFee = parseFloat(getValue(row, ['MANAGEMENT FEE', 'Fee', 'Admin Fee'], 'managementFee', 0));
  const insurance = parseFloat(getValue(row, ['INSURANCE', 'Medical', 'Health', 'Ins'], 'insurance', 0));
  const lop = parseFloat(getValue(row, ['LOP', 'Loss of Pay'], 'lop', 0));

  // Calculate totals
  const totalEarning = parseFloat(getValue(row, ['TOTAL EARNING', 'Gross Earning', 'Total Earnings'], 'totalEarning', earnedStipend + earnedSpecialAllowance + earningsOt + attendanceIncentive + transport));
  const totalDeductions = parseFloat(getValue(row, ['TOTAL DEDUCTIONS', 'Total Deduction'], 'totalDeductions', canteen + managementFee + insurance + lop));

  // Net earning calculation
  const calculatedNet = totalEarning - totalDeductions;
  const netEarning = parseFloat(getValue(row, ['NET EARNING', 'Net Salary', 'In Hand'], 'netEarning', calculatedNet));

  // Billing details
  const billableTotal = parseFloat(getValue(row, ['BILLABLE TOTAL', 'Total Billable'], 'billableTotal', netEarning + managementFee + insurance));
  const gst = parseFloat(getValue(row, ['GST@ 18%', 'GST', 'Tax'], 'gst', billableTotal * 0.18));
  const grandTotal = parseFloat(getValue(row, ['GRAND TOTAL', 'Total Invoice'], 'grandTotal', billableTotal + gst));
  const dbt = parseFloat(getValue(row, ['DBT', 'Transfer Amount'], 'dbt', netEarning));
  const finalNetpay = parseFloat(getValue(row, ['final netpay', 'Final Pay', 'Payment'], 'finalNetpay', dbt || netEarning));

  // Non-numeric fields
  const remarks = getValue(row, ['Remarks', 'Note', 'Comment'], 'remarks', "");
  // For Bank Account, we default to employee's account number if not in sheet
  const bankAccount = getValue(row, ['Bank Accout', 'Bank Account', 'Account Number', 'Acc No'], 'bankAccount', employee.account_number || "");

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