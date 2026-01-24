const mongoose = require('mongoose');
const Employee = require('./models/Employee');
const Company = require('./models/Company');

const MONGODB_URI = 'mongodb+srv://madhavan:EgFHpkXVWLxZmube@levivaan.xns2kil.mongodb.net/levivaan?retryWrites=true&w=majority&appName=levivaan';

const check = async () => {
    await mongoose.connect(MONGODB_URI);
    const employees = await Employee.find().populate('company');
    console.log(`Total Employees: ${employees.length}`);
    employees.forEach(e => {
        console.log(`- ${e.name} (ID: ${e.emp_id_no}) in Company: ${e.company ? e.company.name : 'NONE'}`);
    });
    process.exit(0);
};

check();
