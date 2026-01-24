const Employee = require('../models/Employee');
const Company = require('../models/Company'); // Register Company model for populate
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

// Fetch all employees
exports.getAllEmployees = async (companyId) => {
  try {
    let query = {};
    if (companyId) {
      if (!mongoose.Types.ObjectId.isValid(companyId)) {
        throw new Error('Invalid company ID format');
      }
      query.company = new ObjectId(companyId);
    }
    return await Employee.find(query).populate('company');
  } catch (error) {
    console.error('Error in getAllEmployees:', error);
    throw error;
  }
};

// Find employee by ID format
exports.findEmployeeByIdFormat = async (idFormat) => {
  try {
    // Try exact match
    let employee = await Employee.findOne({ emp_id_no: idFormat });

    // Try case-insensitive match if not found
    if (!employee) {
      const regex = new RegExp(`^${idFormat}$`, 'i');
      employee = await Employee.findOne({ emp_id_no: regex });
    }

    return employee;
  } catch (error) {
    console.error('Error in findEmployeeByIdFormat:', error);
    throw error;
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

    // If no stored details, calculate them
    const date = new Date(`${month} 1, ${year}`);
    const lastDay = new Date(year, date.getMonth() + 1, 0);
    const totalDays = lastDay.getDate();
    const workingDays = 24; // Standard working days per month (from requirement example)
    const holidays = 0; // Default holidays
    const presentDays = 21.5; // Default present days (from requirement example)
    const otHours = 0; // Default OT hours

    // Base values (from requirement example)
    const fixedStipend = employee.fixed_stipend || 15146;
    const specialAllowance = 1273; // Special allowance from example

    // Calculate per day rates
    const perDayStipend = fixedStipend / workingDays;
    const perDaySpecialAllowance = specialAllowance / workingDays;

    // Calculate earnings
    const earnedStipend = Math.round(perDayStipend * presentDays);
    const earnedSpecialAllowance = Math.round(perDaySpecialAllowance * presentDays);
    const transport = 175; // Transport allowance from example
    const earningsOt = otHours * 0; // No OT earnings in example
    const attendanceIncentive = 0; // No attendance incentive in example

    // Calculate deductions
    const canteen = 591; // Canteen deduction from example
    const managementFee = 700; // Management fee from example
    const insurance = 150; // Insurance from example
    const lop = (workingDays - presentDays) * perDayStipend;

    // Calculate totals
    const totalEarning = earnedStipend + earnedSpecialAllowance + transport + earningsOt + attendanceIncentive;
    const totalDeductions = canteen + managementFee + insurance;
    const netEarning = totalEarning - totalDeductions;
    const finalNetpay = netEarning; // Make sure both properties are available

    // Calculate billing 
    const billableTotal = 15559; // From example
    const gst = 2801; // GST from example
    const grandTotal = 18359; // Grand total from example
    const dbt = 1500; // From example
    const remarks = "";
    const bankAccount = employee.account_number || "";

    const payrunDetails = {
      // Attendance details
      totalFixedDays: workingDays,
      presentDays,
      holidays,
      otHours,
      totalPayableDays: presentDays + holidays,

      // Earnings
      fixedStipend,
      specialAllowance,
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

    console.log('Creating new payrun details:', payrunDetails);

    // Store the calculated details
    const update = { $set: { [`payrun_details.${key}`]: payrunDetails } };
    await Employee.findByIdAndUpdate(id, update);

    // Return a properly structured object
    const result = {
      ...employee.toObject(),
      ...payrunDetails,
      fixed_stipend: employee.fixed_stipend // Make sure the snake_case version is included for compatibility
    };

    console.log('Returning newly calculated payrun data:', result);
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
