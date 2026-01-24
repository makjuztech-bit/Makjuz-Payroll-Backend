const mongoose = require('mongoose');
const employeeController = require('./controllers/employeeController');
const Employee = require('./models/Employee');

const MONGODB_URI = 'mongodb+srv://madhavan:EgFHpkXVWLxZmube@levivaan.xns2kil.mongodb.net/levivaan?retryWrites=true&w=majority&appName=levivaan';

const testApi = async () => {
    await mongoose.connect(MONGODB_URI);
    const companyId = '6971e5dfd644af86307d085a'; // wittur

    // Mock req/res
    const req = { query: { companyId } };
    const res = {
        json: (data) => console.log(`API Return length: ${data.length}`),
        status: () => ({ json: (err) => console.error(err) })
    };

    await employeeController.getAllEmployees(req, res);

    process.exit(0);
};

testApi();
