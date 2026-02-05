
const mongoose = require('mongoose');

const expenseSchema = new mongoose.Schema({
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
    category: {
        type: String,
        required: true
    },
    description: {
        type: String
    },
    merchant: {
        type: String
    },
    paymentMethod: {
        type: String, // 'Cash', 'Card', 'Bank Transfer', etc.
        default: 'Cash'
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending'
    },
    receiptUrl: {
        type: String // URL or path to uploaded file
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Expense', expenseSchema);
