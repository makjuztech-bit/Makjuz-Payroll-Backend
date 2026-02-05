
const mongoose = require('mongoose');

const candidateSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true // Prevent duplicate candidates by email
    },
    role: {
        type: String,
        required: true
    },
    joinDate: {
        type: String, // Storing as string YYYY-MM-DD for simplicity or Date
        required: true
    },
    salary: {
        type: String, // String to handle currency symbols or formatting if needed, or Number
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Sent', 'Accepted', 'Rejected'],
        default: 'Pending'
    },
    company: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Company'
        // required: true // Make true later if strict
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const Candidate = mongoose.model('Candidate', candidateSchema);

module.exports = Candidate;
