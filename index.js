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

// Required for Render/Proxies to identify client IPs for rate limiting
app.set('trust proxy', 1);

// Connect to MongoDB
connectDB();

// 1. Security Headers (Relaxed for development/local fonts)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://at.alicdn.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://makjuz-payrol.vercel.app", "http://localhost:5173", "https://makjuz-payroll-backend.onrender.com"]
    }
  },
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use('/api/', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// 2. Optimized CORS Configuration
const allowedOrigins = [
  'https://makjuz-payrol.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000'
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true,
  exposedHeaders: ['set-cookie']
}));

// 3. Payload Parsing & Cookies
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ limit: '2mb', extended: true }));
app.use(cookieParser());

// 4. Sanitization
app.use(mongoSanitize());
app.use(sanitizeInput);

// 5. Rate Limiting (Applied to API only)
app.use('/api/', speedLimiter);
app.use('/api/', apiLimiter);

// Ensure essential directories exist
const uploadsDir = path.join(__dirname, 'uploads');
const templatesDir = path.join(__dirname, 'templates');
const logsDir = path.join(__dirname, 'logs');

[uploadsDir, templatesDir, logsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Static Folders
app.use('/uploads', express.static(uploadsDir));
app.use('/templates', express.static(templatesDir));

const { responseEncryptor } = require('./utils/encryption');

// Apply Global Response Encryption (Obfuscation)
// This ensures Network Tab shows encrypted blobs instead of cleartext JSON
app.use(responseEncryptor);

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

// Production Frontend Serving
if (process.env.NODE_ENV === 'production') {
  const frontendBuildPath = path.join(__dirname, 'public');
  app.use(express.static(frontendBuildPath));

  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/') || req.path.startsWith('/templates/')) {
      return next();
    }
    const indexPath = path.join(frontendBuildPath, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.sendFile(indexPath);
    } else {
      next();
    }
  });
} else {
  app.get('/', (req, res) => {
    res.send('Levivaan Backend is Running...');
  });
}

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('SERVER_ERROR:', err.message);
  logger.error(`${req.method} ${req.path} - ${err.message}`, { stack: err.stack });

  res.status(err.status || 500).json({
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  logger.info(`Server started on port ${PORT}`);
});
