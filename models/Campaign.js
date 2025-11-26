const mongoose = require('mongoose');

const campaignSchema = new mongoose.Schema({
    campaignName: {
        type: String,
        required: true
    },
    targetIndustry: {
        type: String,
        required: true
    },
    channel: {
        type: [String],
        enum: ['Facebook', 'WhatsApp', 'LinkedIn'],
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    salary: {
        type: Number,
        required: true
    },
    serviceCharge: {
        type: Number,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Campaign', campaignSchema);