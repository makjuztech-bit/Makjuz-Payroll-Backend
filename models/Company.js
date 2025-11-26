const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true
  },
  type: {
    type: String,
    required: [true, 'Company type is required'],
    enum: ['LLC', 'Corporation', 'Partnership', 'Sole Proprietorship']
  },
  active: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

const Company = mongoose.model('Company', companySchema);

module.exports = Company;