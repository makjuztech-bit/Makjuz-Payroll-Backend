const mongoose = require('mongoose');
const employeeController = require('./controllers/employeeController');
const Employee = require('./models/Employee');
const Company = require('./models/Company');

const MONGODB_URI = 'mongodb+srv://madhavan:EgFHpkXVWLxZmube@levivaan.xns2kil.mongodb.net/levivaan?retryWrites=true&w=majority&appName=levivaan';

const testApi = async () => {
    await mongoose.connect(MONGODB_URI);
    const companyId = '6971e5dfd644af86307d085a'; // wittur

    // Mock req/res
    const req = { query: { companyId } };
    const res = {
        status: (code) => {
            console.log(`Status Code: ${code}`);
            return {
                json: (data) => {
                    if (Array.isArray(data)) {
                        console.log(`API Success: Returned ${data.length} employees`);
                    } else {
                        console.log('API Error/Message:', data);
                    }
                }
            };
        }
    };

    await employeeController.getAllEmployees(req, res);

    process.exit(0);
};

testApi();
