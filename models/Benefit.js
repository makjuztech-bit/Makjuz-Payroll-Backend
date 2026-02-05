const mongoose = require('mongoose');

const benefitSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },

  type: {
    type: String,
    required: true,
    enum: ['WC', 'Transportation', 'Housing', 'Canteen']
  },
  amount: {
    type: Number,
    required: true
  },
  active: {
    type: Boolean,
    default: true
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true
  },
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Benefit', benefitSchema);