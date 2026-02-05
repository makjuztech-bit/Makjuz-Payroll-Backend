const employeeService = require('../services/employeeService');

// Get all employees
exports.getAllEmployees = async (req, res) => {
  try {
    let { companyId, status } = req.query;

    // Enforce Company Isolation for non-superadmins
    if (req.user.role !== 'superadmin' && req.user.company) {
      if (companyId && companyId !== req.user.company.toString()) {
        return res.status(403).json({ message: 'Access denied to other company data' });
      }
      companyId = req.user.company;
    }

    const employees = await employeeService.getAllEmployees(companyId, status);
    res.status(200).json(employees);
  } catch (error) {
    console.error('Error fetching employees:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

// Get employee by ID
exports.getEmployeeById = async (req, res) => {
  try {
    const maskPII = !['admin', 'hr', 'superadmin'].includes(req.user?.role);
    const employee = await employeeService.getEmployeeById(req.params.id, maskPII);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Verify company access
    if (req.user.role !== 'superadmin' && req.user.company && employee.company) {
      // Handle populated company object or ID string
      const employeeCompanyId = employee.company._id ? employee.company._id.toString() : employee.company.toString();
      if (employeeCompanyId !== req.user.company.toString()) {
        return res.status(403).json({ message: 'Access denied: Employee belongs to another company' });
      }
    }

    res.status(200).json(employee);
  } catch (error) {
    console.error('Error fetching employee:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};

const { filterFields, getAllowedFields } = require('../utils/fieldFilter');
const { sanitizeString } = require('../middleware/sanitization');

// Create new employee
exports.createEmployee = async (req, res) => {
  try {
    const role = req.user?.role || 'user';
    const allowedFields = getAllowedFields(role, 'create');
    const filteredData = filterFields(req.body, allowedFields);

    // Map frontend keys to schema keys
    const employeeData = {
      emp_id_no: req.body.empIdNo || `TEMP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      name: sanitizeString(filteredData.name || 'Unknown Employee', 100),
      date_of_joining: filteredData.date_of_joining || req.body.dateOfJoining,
      department: filteredData.department,
      designation: filteredData.designation,
      gender: filteredData.gender,
      fixed_stipend: filteredData.fixed_stipend || req.body.fixedStipend,
      father_name: filteredData.father_name || req.body.fatherName,
      permanent_address: filteredData.permanent_address || req.body.permanentAddress,
      communication_address: filteredData.communication_address || req.body.communicationAddress,
      contact_number: filteredData.contact_number || req.body.contactNumber,
      emergency_contact_number: filteredData.emergency_contact_number || req.body.emergencyContactNumber,
      qualification: filteredData.qualification,
      qualification_trade: filteredData.qualification_trade || req.body.qualificationTrade,
      blood_group: filteredData.blood_group || req.body.bloodGroup,
      adhar_number: filteredData.adhar_number || req.body.adharNumber,
      pan_number: filteredData.pan_number || req.body.panNumber,
      bank_name: filteredData.bank_name || req.body.bankName,
      account_number: filteredData.account_number || req.body.accountNumber,
      ifsc_code: filteredData.ifsc_code || req.body.ifscCode,
      branch: filteredData.branch,
      photo: filteredData.photo,
      experience: filteredData.experience,
      company: filteredData.company || req.body.company,
      uan: filteredData.uan,
      esi_number: filteredData.esi_number || req.body.esiNumber,
      insurance_number: filteredData.insurance_number || req.body.insuranceNumber,
      category: filteredData.category,
      status: filteredData.status || req.body.status || 'Active',
      DOB: filteredData.DOB || req.body.dateOfBirth,
      salaryType: filteredData.salaryType || req.body.salaryType,
      employeeCategory: filteredData.employeeCategory || req.body.employeeCategory,
      location: filteredData.location,
      present_days: req.body.presentDays || 0,
      total_fixed_days: req.body.totalFixedDays || 0,
      holidays: req.body.holidays || 0,
      ot_hours: req.body.otHours || 0,
      total_deductions: req.body.totalDeductions || 0,
      final_netpay: req.body.finalNetpay || 0,
      payrun_details: filteredData.payrun_details || req.body.payrunDetails || {}
    };

    const newEmployee = await employeeService.createEmployee(employeeData);
    res.status(201).json(newEmployee);
  } catch (error) {
    console.error('Error creating employee:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Employee ID already exists' });
    }
    res.status(500).json({ message: 'Server Error', details: error.message });
  }
};

// Update employee
exports.updateEmployee = async (req, res) => {
  try {
    const role = req.user?.role || 'user';
    const allowedFields = getAllowedFields(role, 'update');
    const filteredData = filterFields(req.body, allowedFields);

    const updatedEmployee = await employeeService.updateEmployee(req.params.id, filteredData);
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

// Delete ALL employees (Danger Zone)
exports.deleteAllEmployees = async (req, res) => {
  try {
    const { companyId } = req.query;
    let query = {};
    if (companyId) {
      query.company = new require('mongoose').Types.ObjectId(companyId);
    }

    await require('../models/Employee').deleteMany(query);
    res.status(200).json({ message: 'All employees deleted successfully' });
  } catch (error) {
    console.error('Error deleting all employees:', error);
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
    // console.log('Getting employee count for companyId:', companyId);
    const count = await employeeService.getEmployeeCount(companyId);
    // console.log('Employee count:', count);
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

    // Security: Only Admin/HR/Manager can view detailed pay info
    // LEGACY FIX: Allow 'user' for now
    const allowedRoles = ['user', 'admin', 'hr', 'manager', 'superadmin'];
    if (!allowedRoles.includes(req.user?.role)) {
      return res.status(403).json({ message: 'Access denied to payrun details' });
    }

    const payrunDetails = await employeeService.getEmployeePayrunDetails(id, month, year);

    if (!payrunDetails) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Security: Company Isolation Check
    if (req.user.role !== 'superadmin' && req.user.company && payrunDetails.company) {
      const employeeCompanyId = payrunDetails.company._id ? payrunDetails.company._id.toString() : payrunDetails.company.toString();
      if (employeeCompanyId !== req.user.company.toString()) {
        // Silently return 404 to avoid leaking existence of employee in other company
        return res.status(404).json({ message: 'Employee not found' });
      }
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
