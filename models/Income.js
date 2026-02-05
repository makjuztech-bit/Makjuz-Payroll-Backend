
const mongoose = require('mongoose');

const incomeSchema = new mongoose.Schema({
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company',
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    source: {
        type: String, // e.g., 'Client Payment', 'Service Revenue', 'Consulting'
        required: true
    },
    description: {
        type: String
    },
    referenceParams: {
        type: String // Invoice number, Transaction ID, etc.
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Income', incomeSchema);
