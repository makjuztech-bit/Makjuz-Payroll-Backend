const employeeService = require('../services/employeeService');

// Get all employees
exports.getAllEmployees = async (req, res) => {
  try {
    const { companyId } = req.query;
    const employees = await employeeService.getAllEmployees(companyId);
    res.status(200).json(employees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Get employee by ID
exports.getEmployeeById = async (req, res) => {
  try {
    const employee = await employeeService.getEmployeeById(req.params.id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.status(200).json(employee);
  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Create new employee
// Create new employee
exports.createEmployee = async (req, res) => {
  try {
    // Convert camelCase to snake_case for MongoDB, but keep schema field names as-is
    const employeeData = {
      emp_id_no: req.body.empIdNo,
      name: req.body.name,
      date_of_joining: req.body.dateOfJoining,
      department: req.body.department,
      designation: req.body.designation,
      gender: req.body.gender,
      fixed_stipend: req.body.fixedStipend,
      father_name: req.body.fatherName,
      permanent_address: req.body.permanentAddress,
      communication_address: req.body.communicationAddress,
      contact_number: req.body.contactNumber,
      emergency_contact_number: req.body.emergencyContactNumber,
      qualification: req.body.qualification,
      qualification_trade: req.body.qualificationTrade,
      blood_group: req.body.bloodGroup,
      adhar_number: req.body.adharNumber,
      pan_number: req.body.panNumber,
      bank_name: req.body.bankName,
      account_number: req.body.accountNumber,
      ifsc_code: req.body.ifscCode,
      branch: req.body.branch,
      photo: req.body.photo,
      experience: req.body.experience,
      company: req.body.company,
      uan: req.body.uan,
      esi_number: req.body.esiNumber,
      insurance_number: req.body.insuranceNumber,
      category: req.body.category,
      status: req.body.status || 'Active',
      // FIXED: Use exact schema field names
      DOB: req.body.dateOfBirth,
      salaryType: req.body.salaryType,
      employeeCategory: req.body.employeeCategory,
      // Optional fields with defaults
      location: req.body.location,
      present_days: req.body.presentDays || 0,
      total_fixed_days: req.body.totalFixedDays || 0,
      holidays: req.body.holidays || 0,
      ot_hours: req.body.otHours || 0,
      total_deductions: req.body.totalDeductions || 0,
      final_netpay: req.body.finalNetpay || 0,
      // Payrun details if provided
      payrun_details: req.body.payrunDetails || {}
    };

    const newEmployee = await employeeService.createEmployee(employeeData);
    
    // Return with camelCase field names for frontend
    res.status(201).json({
      id: newEmployee._id,
      empIdNo: newEmployee.emp_id_no,
      name: newEmployee.name,
      dateOfJoining: newEmployee.date_of_joining,
      department: newEmployee.department,
      designation: newEmployee.designation,
      gender: newEmployee.gender,
      fixedStipend: newEmployee.fixed_stipend,
      fatherName: newEmployee.father_name,
      permanentAddress: newEmployee.permanent_address,
      communicationAddress: newEmployee.communication_address,
      contactNumber: newEmployee.contact_number,
      emergencyContactNumber: newEmployee.emergency_contact_number,
      qualification: newEmployee.qualification,
      qualificationTrade: newEmployee.qualification_trade,
      bloodGroup: newEmployee.blood_group,
      adharNumber: newEmployee.adhar_number,
      panNumber: newEmployee.pan_number,
      bankName: newEmployee.bank_name,
      accountNumber: newEmployee.account_number,
      ifscCode: newEmployee.ifsc_code,
      branch: newEmployee.branch,
      photo: newEmployee.photo,
      experience: newEmployee.experience,
      company: newEmployee.company,
      uan: newEmployee.uan,
      esiNumber: newEmployee.esi_number,
      insuranceNumber: newEmployee.insurance_number,
      category: newEmployee.category,
      status: newEmployee.status,
      // FIXED: Use exact schema field names in response
      dateOfBirth: newEmployee.DOB,
      salaryType: newEmployee.salaryType,
      employeeCategory: newEmployee.employeeCategory,
      location: newEmployee.location,
      presentDays: newEmployee.present_days,
      totalFixedDays: newEmployee.total_fixed_days,
      holidays: newEmployee.holidays,
      otHours: newEmployee.ot_hours,
      totalDeductions: newEmployee.total_deductions,
      finalNetpay: newEmployee.final_netpay,
      payrunDetails: newEmployee.payrun_details
    });
  } catch (error) {
    console.error('Error creating employee:', error);
    if (error.code === 11000) {
      // MongoDB duplicate key error
      return res.status(400).json({ message: 'Employee ID already exists' });
    }
    res.status(500).json({ 
      message: 'Server Error',
      details: error.message 
    });
  }
};
// Update employee
exports.updateEmployee = async (req, res) => {
  try {
    const updatedEmployee = await employeeService.updateEmployee(req.params.id, req.body);
    if (!updatedEmployee) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    res.status(200).json(updatedEmployee);
  } catch (error) {
    console.error('Error updating employee:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Delete employee
exports.deleteEmployee = async (req, res) => {
  try {
    await employeeService.deleteEmployee(req.params.id);
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting employee:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Get employee count
exports.getEmployeeCount = async (req, res) => {
  try {
    const { companyId } = req.query;
    if (companyId && !companyId.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: 'Invalid company ID format' });
    }
    console.log('Getting employee count for companyId:', companyId);
    const count = await employeeService.getEmployeeCount(companyId);
    console.log('Employee count:', count);
    res.status(200).json({ count });
  } catch (error) {
    console.error('Detailed error in getEmployeeCount:', {
      error: error.toString(),
      stack: error.stack,
      name: error.name,
      message: error.message
    });
    if (error.name === 'CastError' && error.kind === 'ObjectId') {
      return res.status(400).json({ message: 'Invalid company ID format' });
    }
    res.status(500).json({ message: 'Server Error', details: error.message });
  }
};

// Get employee payrun details
exports.getEmployeePayrunDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { month, year } = req.query;
    const payrunDetails = await employeeService.getEmployeePayrunDetails(id, month, year);
    
    if (!payrunDetails) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    res.status(200).json(payrunDetails);
  } catch (error) {
    console.error('Error fetching employee payrun details:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Update employee payrun details
exports.updatePayrunDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { month, year } = req.query;
    const payrunDetails = await employeeService.updatePayrunDetails(id, month, year, req.body);
    
    if (!payrunDetails) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    res.status(200).json(payrunDetails);
  } catch (error) {
    console.error('Error updating employee payrun details:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Find employee by ID with various formats
exports.findEmployeeById = async (req, res) => {
  try {
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ message: 'Employee ID is required' });
    }
    
    // Clean the ID
    const cleanId = id.toString().trim();
    
    // Try different formats
    const formats = [
      cleanId,
      cleanId.replace(/-/g, ''),
      cleanId.toUpperCase().startsWith('LIV') ? cleanId : `LIV${cleanId}`,
      cleanId.toLowerCase(),
      cleanId.toUpperCase()
    ];
    
    const results = await Promise.all(
      formats.map(async (format) => {
        const employee = await employeeService.findEmployeeByIdFormat(format);
        return {
          format,
          found: !!employee,
          employee: employee
        };
      })
    );
    
    const foundEmployee = results.find(r => r.found);
    
    if (foundEmployee) {
      res.status(200).json({
        message: `Employee found with format: ${foundEmployee.format}`,
        employee: foundEmployee.employee,
        allFormats: results.map(r => ({ format: r.format, found: r.found }))
      });
    } else {
      res.status(404).json({ 
        message: 'Employee not found with any format',
        formatsChecked: results.map(r => r.format)
      });
    }
  } catch (error) {
    console.error('Error in findEmployeeById:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Get employee payslip
exports.getEmployeePayslip = async (req, res) => {
  try {
    const { id } = req.params;
    const { month, year } = req.query;
    
    if (!month || !year) {
      return res.status(400).json({ message: 'Month and year are required' });
    }
    
    // Get employee data with payrun details
    const employeeWithPayrun = await employeeService.getEmployeePayrunDetails(id, month, year);
    
    if (!employeeWithPayrun) {
      return res.status(404).json({ message: 'Employee not found' });
    }
    
    // Format the data for the payslip response
    const payslipData = {
      // Employee details
      id: employeeWithPayrun._id,
      emp_id_no: employeeWithPayrun.emp_id_no,
      name: employeeWithPayrun.name,
      department: employeeWithPayrun.department,
      designation: employeeWithPayrun.designation,
      location: employeeWithPayrun.communication_address,
      accountNumber: employeeWithPayrun.account_number,
      
      // Pay period
      month,
      year,
      
      // Attendance details
      totalFixedDays: employeeWithPayrun.totalFixedDays,
      presentDays: employeeWithPayrun.presentDays,
      holidays: employeeWithPayrun.holidays,
      otHours: employeeWithPayrun.otHours,
      totalPayableDays: employeeWithPayrun.totalPayableDays,
      
      // Earnings
      fixedStipend: employeeWithPayrun.fixedStipend,
      specialAllowance: employeeWithPayrun.specialAllowance,
      earnedStipend: employeeWithPayrun.earnedStipend,
      earnedSpecialAllowance: employeeWithPayrun.earnedSpecialAllowance,
      earningsOt: employeeWithPayrun.earningsOt,
      attendanceIncentive: employeeWithPayrun.attendanceIncentive,
      transport: employeeWithPayrun.transport,
      
      // Deductions
      managementFee: employeeWithPayrun.managementFee,
      insurance: employeeWithPayrun.insurance,
      canteen: employeeWithPayrun.canteen,
      lop: employeeWithPayrun.lop,
      
      // Totals
      totalEarning: employeeWithPayrun.totalEarning,
      totalDeductions: employeeWithPayrun.totalDeductions,
      finalNetpay: employeeWithPayrun.finalNetpay,
      netEarning: employeeWithPayrun.netEarning || employeeWithPayrun.finalNetpay,
      
      // Billing
      billableTotal: employeeWithPayrun.billableTotal,
      gst: employeeWithPayrun.gst,
      grandTotal: employeeWithPayrun.grandTotal,
      dbt: employeeWithPayrun.dbt,
      remarks: employeeWithPayrun.remarks,
      bankAccount: employeeWithPayrun.bankAccount
    };
    
    res.status(200).json(payslipData);
  } catch (error) {
    console.error('Error generating employee payslip:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};
