const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
  emp_id_no: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  date_of_joining: {
    type: String,
    required: true
  },
  department: {
    type: String,
    required: true
  },
  designation: {
    type: String,
    required: true
  },
  gender: {
    type: String,
    required: true
  },
  fixed_stipend: {
    type: Number,
    required: true
  },
  father_name: {
    type: String,
    required: true
  },
  permanent_address: {
    type: String,
    required: true
  },
  communication_address: {
    type: String,
    required: true
  },
  contact_number: {
    type: String,
    required: true
  },
  emergency_contact_number: {
    type: String,
    required: true
  },
  qualification: {
    type: String,
    required: true
  },
  qualification_trade: {
    type: String
  },
  blood_group: {
    type: String,
    required: true
  },
  adhar_number: {
    type: String,
    required: true
  },
  pan_number: {
    type: String,
    required: true
  },
  bank_name: {
    type: String,
    required: true
  },
  account_number: {
    type: String,
    required: true
  },
  ifsc_code: {
    type: String,
    required: true
  },
  branch: {
    type: String,
    required: true
  },
  photo: {
    type: String
  },
  experience: {
    type: String
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  uan: {
    type: String
  },
  esi_number: {
    type: String
  },
  insurance_number: {
    type: String
  },
  category: {
    type: String,
    required: true
  },
  status: {
    type: String,
    default: 'Active'
  },
  payrun_details: {
    type: Map,
    of: {
      presentDays: Number,
      holidays: Number,
      otHours: Number,
      totalFixedDays: Number,
      earnedStipend: Number,
      earningsOt: Number,
      earnedSpecialAllowance: Number,
      specialAllowance: Number,
      transport: Number,
      managementFee: Number,
      insurance: Number,
      canteen: Number,
      lop: Number,
      totalEarning: Number,
      totalDeductions: Number,
      finalNetpay: Number,
      billableTotal: Number,
      gst: Number,
      grandTotal: Number
    }
  },
  DOB: {
    type: Date,
    required: true,
    validate: {
      validator: function(v) {
        // Ensure employee is at least 18 years old
        const dob = new Date(v);
        const today = new Date();
        const age = today.getFullYear() - dob.getFullYear();
        const monthDiff = today.getMonth() - dob.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
          return age - 1 >= 18;
        }
        return age >= 18;
      },
      message: 'Employee must be at least 18 years old'
    }
  },
  salaryType: {
    type: String,
    enum: ['Wages', 'Salary'],
    required: true
  },
  employeeCategory: {
    type: String,
    enum: ['NAPS', 'NON-NAPS', 'NATS', 'NON-NATS'],
    required: true
  }
}, {
  timestamps: true
});

const Employee = mongoose.model('Employee', employeeSchema);

module.exports = Employee;