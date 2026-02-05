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
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// CORS setup
app.use(cors({
  origin: process.env.FRONTEND_URL ? [process.env.FRONTEND_URL, 'http://localhost:5173', 'http://localhost:3000'] : '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true
}));

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Make uploads folder publicly accessible
app.use('/uploads', express.static(uploadsDir));

// Create templates directory if it doesn't exist
const templatesDir = path.join(__dirname, 'templates');
if (!fs.existsSync(templatesDir)) {
  fs.mkdirSync(templatesDir, { recursive: true });
}

// Publicly serve templates (optional)
app.use('/templates', express.static(templatesDir));

// Routes
const userRoutes = require('./routes/userRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const companyRoutes = require('./routes/companyRoute');
const campaignRoutes = require('./routes/campaignRoutes');
const benefitRoutes = require('./routes/benefitRoutes');
const documentRoutes = require('./routes/documentRoutes');
const payrunRoutes = require('./routes/payrunRoutes');
const offerLetterRoutes = require('./routes/offerLetterRoutes');
const expenseRoutes = require('./routes/expenseRoutes');
const incomeRoutes = require('./routes/incomeRoutes');
const aiRoutes = require('./routes/aiRoutes');
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
app.use('/api/offer-letters', auth, offerLetterRoutes);
app.use('/api/expenses', auth, expenseRoutes);
app.use('/api/incomes', auth, incomeRoutes);
app.use('/api/ai', aiRoutes);

// Serve static files from the React frontend app
if (process.env.NODE_ENV === 'production') {
  const frontendBuildPath = path.join(__dirname, 'public');
  app.use(express.static(frontendBuildPath));

  // Any route that doesn't match an API route or static file should serve the frontend index.html
  app.get('*', (req, res, next) => {
    // Skip if it's an API route
    if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/') || req.path.startsWith('/templates/')) {
      return next();
    }
    res.sendFile(path.join(frontendBuildPath, 'index.html'));
  });
} else {
  // Root route for development
  app.get('/', (req, res) => {
    res.send('Welcome to the Levivaan Server! (Development Mode)');
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
