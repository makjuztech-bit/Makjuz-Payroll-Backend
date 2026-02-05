const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const connectDB = require('./db');
const logger = require('./utils/logger');
const { apiLimiter, speedLimiter } = require('./middleware/rateLimiter');
const { sanitizeInput } = require('./middleware/sanitization');

const app = express();
const PORT = process.env.PORT || 3000;

// Connect to MongoDB
connectDB();

// 1. Security Headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", process.env.FRONTEND_URL || 'http://localhost:5173']
    }
  }
}));

// 2. CORS setup
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',')
  : ['http://localhost:5173', 'http://localhost:3000'];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true
}));

// 3. Payload Limits & Parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ limit: '1mb', extended: true }));
app.use(cookieParser());

// 4. Sanitization
app.use(mongoSanitize());
app.use(sanitizeInput);

// 5. Rate Limiting
app.use('/api/', speedLimiter);
app.use('/api/', apiLimiter);

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

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

// Production Static Files
if (process.env.NODE_ENV === 'production') {
  const frontendBuildPath = path.join(__dirname, '..', 'Makjuz-payroll', 'dist');
  app.use(express.static(frontendBuildPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) return next();
    res.sendFile(path.join(frontendBuildPath, 'index.html'));
  });
}

// Global Error Handler
app.use((err, req, res, next) => {
  logger.error(`${req.method} ${req.path} - Error: ${err.message}`, { stack: err.stack });
  res.status(err.status || 500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, () => {
  logger.info(`Server running at http://localhost:${PORT}`);
});
