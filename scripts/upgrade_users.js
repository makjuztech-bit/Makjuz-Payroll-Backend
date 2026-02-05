const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const upgradeUsers = async () => {
    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb+srv://madhavan:EgFHpkXVWLxZmube@levivaan.xns2kil.mongodb.net/levivaan?retryWrites=true&w=majority&appName=levivaan';
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');

        // Upgrade all 'user' roles to 'admin'
        const result = await User.updateMany({ role: 'user' }, { role: 'admin' });
        console.log(`\n✅ Success: ${result.modifiedCount} accounts upgraded to 'admin' role.`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error during upgrade:', error);
        process.exit(1);
    }
};

upgradeUsers();
