const mongoose = require('mongoose');
const path = require('path');
// Fix path to .env
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });
const Employee = require('../models/Employee');

const clearPayrunData = async () => {
    try {
        console.log('Connecting to MongoDB...');
        // Correct variable name from .env file
        const uri = process.env.MONGO_URI;
        if (!uri) {
            throw new Error("MONGO_URI is undefined. Check .env path.");
        }
        console.log(`URI found: ${uri.substring(0, 15)}...`);

        await mongoose.connect(uri);
        console.log('Connected.');

        console.log('Clearing payrun_details for all employees...');
        // Set payrun_details to an empty object for all employees
        const result = await Employee.updateMany({}, { $set: { payrun_details: {} } });

        console.log(`Updated ${result.modifiedCount} employees.`);
        console.log('Payrun data cleared successfully.');

        process.exit(0);
    } catch (error) {
        console.error('Error clearing data:', error);
        process.exit(1);
    }
};

clearPayrunData();
