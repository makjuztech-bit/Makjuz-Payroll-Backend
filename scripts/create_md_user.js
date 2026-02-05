
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
require('dotenv').config();

const createAdminUser = async () => {
    try {
        console.log('Connecting to MongoDB...');
        const mongoURI = process.env.MONGO_URI || 'mongodb+srv://madhavan:EgFHpkXVWLxZmube@levivaan.xns2kil.mongodb.net/levivaan?retryWrites=true&w=majority&appName=levivaan';
        await mongoose.connect(mongoURI, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        console.log('Connected to MongoDB');

        const userData = {
            username: 'md user',
            email: 'mduser@levivaan.com', // Placeholder email, can be anything unique
            password: 'password123', // Default password
            role: 'admin'
        };

        // Check if user exists
        const existingUser = await User.findOne({ username: userData.username });
        if (existingUser) {
            console.log('User "md user" already exists. Updating role to admin...');
            existingUser.role = 'admin';
            await existingUser.save();
            console.log('User updated successfully.');
        } else {
            console.log('Creating new user "md user"...');
            // Hash password
            const salt = await bcrypt.genSalt(10);
            userData.password = await bcrypt.hash(userData.password, salt);

            const newUser = new User(userData);
            await newUser.save();
            console.log(`User "md user" created successfully with password "password123" and role "admin".`);
        }

        mongoose.disconnect();
    } catch (error) {
        console.error('Error creating user:', error);
        process.exit(1);
    }
};

createAdminUser();
