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
  },
  department: {
    type: String,
  },
  designation: {
    type: String,
  },
  gender: {
    type: String,
  },
  fixed_stipend: {
    type: Number,
  },
  father_name: {
    type: String,
  },
  permanent_address: {
    type: String,
  },
  communication_address: {
    type: String,
  },
  contact_number: {
    type: String,
  },
  emergency_contact_number: {
    type: String,
    validate: {
      validator: function (v) {
        if (!v) return true; // Allow empty
        return v !== this.contact_number;
      },
      message: 'Emergency contact number cannot be the same as contact number'
    }
  },
  qualification: {
    type: String,
  },
  qualification_trade: {
    type: String
  },
  blood_group: {
    type: String,
  },
  adhar_number: {
    type: String,
  },
  pan_number: {
    type: String,
    validate: {
      validator: function (v) {
        if (!v) return true; // Allow empty
        return /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(v);
      },
      message: 'Invalid PAN number format'
    }
  },
  bank_name: {
    type: String,
  },
  account_number: {
    type: String,
  },
  ifsc_code: {
    type: String,
    validate: {
      validator: function (v) {
        if (!v) return true; // Allow empty
        return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(v);
      },
      message: 'Invalid IFSC code format'
    }
  },
  branch: {
    type: String,
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
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive', 'Recycled'],
    default: 'Active'
  },
  payrun_details: {
    type: Map,
    of: {
      presentDays: Number,
      holidays: Number,
      otHours: Number,
      totalFixedDays: Number,
      totalPayableDays: Number,
      fixedStipend: Number,
      earnedStipend: Number,
      earningsOt: Number,
      earnedSpecialAllowance: Number,
      specialAllowance: Number,
      attendanceIncentive: Number,
      transport: Number,
      managementFee: Number,
      insurance: Number,
      canteen: Number,
      lop: Number,
      totalEarning: Number,
      totalDeductions: Number,
      netEarning: Number,
      finalNetpay: Number,
      billableTotal: Number,
      gst: Number,
      grandTotal: Number,
      dbt: Number,
      remarks: String,
      bankAccount: String,
      pfAmount: Number,
      esiAmount: Number
    }
  },
  DOB: {
    type: Date,
    validate: {
      validator: function (v) {
        if (!v) return true; // Allow empty
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
    enum: ['Wages', 'Salary', 'Stipend'],
  },
  employeeCategory: {
    type: String,
    enum: ['NAPS', 'NON-NAPS', 'NATS', 'NON-NATS'],
  },
  customFields: {
    type: Map,
    of: String
  }
}, {
  timestamps: true
});

const Employee = mongoose.model('Employee', employeeSchema);

module.exports = Employee;