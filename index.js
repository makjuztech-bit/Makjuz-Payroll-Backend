const express = require('express');
const cors = require('cors');
require('dotenv').config();
const connectDB = require('./db');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Create templates directory if it doesn't exist
const templatesDir = path.join(__dirname, 'templates');
if (!fs.existsSync(templatesDir)) {
  fs.mkdirSync(templatesDir, { recursive: true });
}

// Routes
const userRoutes = require('./routes/userRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const companyRoutes = require('./routes/companyRoute');
const campaignRoutes = require('./routes/campaignRoutes');
const benefitRoutes = require('./routes/benefitRoutes');
const documentRoutes = require('./routes/documentRoutes');
const payrunRoutes = require('./routes/payrunRoutes');
const auth = require('./middleware/auth');

// Public routes
app.use('/api/auth', userRoutes);

// Protected routes
app.use('/api/employees', auth, employeeRoutes);
app.use('/api/companies', auth, companyRoutes);
app.use('/api/campaigns', auth, campaignRoutes);
app.use('/api/benefits', auth, benefitRoutes);
app.use('/api/documents', auth, documentRoutes);
app.use('/api/payruns', auth, payrunRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('Welcome to the Levivaan Server!');
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
