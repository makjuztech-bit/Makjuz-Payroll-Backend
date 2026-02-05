const Employee = require('../models/Employee');
const Company = require('../models/Company'); // Register Company model for populate
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

// Fetch all employees
exports.getAllEmployees = async (companyId, status) => {
  try {
    let query = {};
    if (companyId) {
      if (!mongoose.Types.ObjectId.isValid(companyId)) {
        throw new Error('Invalid company ID format');
      }
      query.company = new ObjectId(companyId);
    }

    // Add status filter if provided
    if (status) {
      query.status = status;
    }
    return await Employee.find(query)
      .select('-adhar_number -pan_number -account_number -permanent_address')
      .populate('company');
  } catch (error) {
    console.error('Error in getAllEmployees:', error);
    throw error;
  }
};

const { validateRegexPattern, sanitizeString } = require('../middleware/sanitization');

// Find employee by ID format
exports.findEmployeeByIdFormat = async (idFormat) => {
  try {
    const sanitizedFormat = sanitizeString(idFormat, 50);
    if (!sanitizedFormat) return null;

    // Validate pattern (throws on invalid)
    const safePattern = validateRegexPattern(sanitizedFormat);

    // Try exact match first (Performance & Security)
    let employee = await Employee.findOne({ emp_id_no: sanitizedFormat });

    // Try case-insensitive match if not found
    if (!employee) {
      const regex = new RegExp(`^${safePattern}$`, 'i');
      employee = await Employee.findOne({ emp_id_no: regex }).maxTimeMS(5000);
    }

    return employee;
  } catch (error) {
    console.error('Error in findEmployeeByIdFormat:', error);
    throw new Error('Invalid search pattern');
  }
};

// Fetch employee by ID
exports.getEmployeeById = async (id) => {
  return await Employee.findById(id).populate('company');
};

// Create a new employee
exports.createEmployee = async (employeeData) => {
  const employee = new Employee(employeeData);
  return await employee.save();
};

// Update an employee
exports.updateEmployee = async (id, employeeData) => {
  return await Employee.findByIdAndUpdate(id, employeeData, { new: true });
};

// Delete an employee
exports.deleteEmployee = async (id) => {
  return await Employee.findByIdAndDelete(id);
};

// Get total employee count for a company
exports.getEmployeeCount = async (companyId) => {
  try {
    console.log('employeeService.getEmployeeCount - Input companyId:', companyId);
    let query = {};

    if (companyId) {
      try {
        query.company = new ObjectId(companyId);
        console.log('Created ObjectId:', query.company);
      } catch (err) {
        console.error('Error creating ObjectId:', err);
        throw err;
      }
    }

    console.log('Final query:', JSON.stringify(query));
    const count = await Employee.countDocuments(query);
    console.log('Count result:', count);
    return count;
  } catch (error) {
    console.error('Error in getEmployeeCount:', {
      error: error.toString(),
      stack: error.stack,
      message: error.message
    });
    throw error;
  }
};

// Get employee payrun details
exports.getEmployeePayrunDetails = async (id, month, year) => {
  try {
    const employee = await Employee.findById(id);
    if (!employee) return null;

    // Check if payrun details exist for the given month/year
    const key = `${month}_${year}`;
    if (employee.payrun_details && employee.payrun_details.get(key)) {
      const payrunDetails = employee.payrun_details.get(key);
      console.log('Found existing payrun details:', payrunDetails);

      // Ensure all required fields are present
      const result = {
        ...employee.toObject(),
        // Map the fields explicitly to ensure they're all present
        fixed_stipend: employee.fixed_stipend,
        totalFixedDays: payrunDetails.totalFixedDays || 24,
        presentDays: payrunDetails.presentDays || 0,
        holidays: payrunDetails.holidays || 0,
        otHours: payrunDetails.otHours || 0,
        totalPayableDays: payrunDetails.totalPayableDays || 0,
        fixedStipend: payrunDetails.fixedStipend || employee.fixed_stipend || 0,
        specialAllowance: payrunDetails.specialAllowance || 0,
        earnedStipend: payrunDetails.earnedStipend || 0,
        earnedSpecialAllowance: payrunDetails.earnedSpecialAllowance || 0,
        earningsOt: payrunDetails.earningsOt || 0,
        attendanceIncentive: payrunDetails.attendanceIncentive || 0,
        transport: payrunDetails.transport || 0,
        managementFee: payrunDetails.managementFee || 0,
        insurance: payrunDetails.insurance || 0,
        canteen: payrunDetails.canteen || 0,
        lop: payrunDetails.lop || 0,
        totalEarning: payrunDetails.totalEarning || 0,
        totalDeductions: payrunDetails.totalDeductions || 0,
        netEarning: payrunDetails.netEarning || 0,
        finalNetpay: payrunDetails.finalNetpay || payrunDetails.netEarning || 0,
        billableTotal: payrunDetails.billableTotal || 0,
        gst: payrunDetails.gst || 0,
        grandTotal: payrunDetails.grandTotal || 0,
        dbt: payrunDetails.dbt || 0,
        remarks: payrunDetails.remarks || "",
        bankAccount: payrunDetails.bankAccount || employee.account_number || ""
      };

      console.log('Returning structured payrun data:', result);
      return result;
    }

    // If no stored details, return default empty structure (DO NOT SAVE TO DB)
    const result = {
      ...employee.toObject(),
      // Payrun defaults
      fixed_stipend: employee.fixed_stipend,
      totalFixedDays: 0,
      presentDays: 0,
      holidays: 0,
      otHours: 0,
      totalPayableDays: 0,
      fixedStipend: employee.fixed_stipend || 0,
      specialAllowance: 0,
      earnedStipend: 0,
      earnedSpecialAllowance: 0,
      earningsOt: 0,
      attendanceIncentive: 0,
      transport: 0,
      managementFee: 0,
      insurance: 0,
      canteen: 0,
      lop: 0,
      totalEarning: 0,
      totalDeductions: 0,
      netEarning: 0,
      finalNetpay: 0,
      billableTotal: 0,
      gst: 0,
      grandTotal: 0,
      dbt: 0,
      remarks: "",
      bankAccount: employee.account_number || ""
    };

    console.log('Returning default empty payrun data (not saved):', result.emp_id_no);
    return result;
  } catch (error) {
    console.error('Error in getEmployeePayrunDetails:', error);
    throw error;
  }
};

// Update employee payrun details
exports.updatePayrunDetails = async (id, month, year, payrunDetails) => {
  try {
    const employee = await Employee.findById(id);
    if (!employee) return null;

    const key = `payrun_details.${month}_${year}`;
    const update = { $set: { [key]: payrunDetails } };

    const updatedEmployee = await Employee.findByIdAndUpdate(
      id,
      update,
      { new: true, upsert: true }
    );

    return {
      ...updatedEmployee.toObject(),
      ...payrunDetails
    };
  } catch (error) {
    console.error('Error in updatePayrunDetails:', error);
    throw error;
  }
};
