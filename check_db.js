const mongoose = require('mongoose');
const Employee = require('./models/Employee');
const Company = require('./models/Company');
const User = require('./models/User');

const MONGODB_URI = 'mongodb+srv://madhavan:EgFHpkXVWLxZmube@levivaan.xns2kil.mongodb.net/levivaan?retryWrites=true&w=majority&appName=levivaan';

const checkDB = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to MongoDB');

        const companyCount = await Company.countDocuments();
        const employeeCount = await Employee.countDocuments();
        const userCount = await User.countDocuments();

        console.log(`Companies: ${companyCount}`);
        console.log(`Employees: ${employeeCount}`);
        console.log(`Users: ${userCount}`);

        const companies = await Company.find().limit(5);
        console.log('Sample Companies:', companies.map(c => ({ id: c._id, name: c.name })));

        const users = await User.find().limit(5);
        console.log('Sample Users:', users.map(u => ({ id: u._id, email: u.email, role: u.role })));

        process.exit(0);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

checkDB();
