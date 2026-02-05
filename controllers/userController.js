const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');
const { sanitizeString } = require('../middleware/sanitization');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Cookie options
const getCookieOptions = (maxAge) => ({
  httpOnly: true,
  secure: NODE_ENV === 'production',
  sameSite: NODE_ENV === 'production' ? 'none' : 'lax', // Use 'none' for cross-domain cookies in production
  maxAge,
  path: '/'
});

exports.register = async (req, res) => {
  try {
    const { username, password, email } = req.body;

    if (!username || !password || !email) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ username: username.trim() }, { email: email.toLowerCase().trim() }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }

    // Hash password with Argon2 (with safety catch)
    let hashedPassword;
    try {
      hashedPassword = await argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: 2 ** 14, // Lower memory cost for limited environments like Render free tier
        timeCost: 2
      });
    } catch (hashError) {
      logger.error('Encryption failed (Argon2):', hashError);
      return res.status(500).json({ message: 'Security module initialization failed' });
    }

    // Create user
    const user = new User({
      username: sanitizeString(username.trim()),
      password: hashedPassword,
      email: email.toLowerCase().trim()
    });

    await user.save();

    // Generate tokens
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const refreshToken = jwt.sign(
      { id: user._id },
      JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // Set cookies
    res.cookie('token', token, getCookieOptions(24 * 60 * 60 * 1000));
    res.cookie('refreshToken', refreshToken, getCookieOptions(7 * 24 * 60 * 60 * 1000));

    res.status(201).json({
      message: 'User registered successfully',
      user: user.toJSON()
    });
  } catch (error) {
    logger.error('Registration Exception:', {
      message: error.message,
      stack: error.stack,
      body: { ...req.body, password: '***' }
    });
    res.status(500).json({ message: 'Error registering user', details: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Find user and include password
    const user = await User.findOne({ username: username.trim() }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check if locked
    if (user.isLocked) {
      return res.status(423).json({
        message: 'Account is locked due to too many failed attempts. Try again in 2 hours.',
        lockUntil: user.lockUntil
      });
    }

    // Verify password
    const isValidPassword = await argon2.verify(user.password, password);
    if (!isValidPassword) {
      await user.incLoginAttempts();
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Reset login attempts
    await user.resetLoginAttempts();

    // Generate tokens
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const refreshToken = jwt.sign(
      { id: user._id },
      JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    // Set cookies
    res.cookie('token', token, getCookieOptions(24 * 60 * 60 * 1000));
    res.cookie('refreshToken', refreshToken, getCookieOptions(7 * 24 * 60 * 60 * 1000));

    res.json({
      message: 'Login successful',
      user: user.toJSON()
    });
  } catch (error) {
    logger.error('Login Exception:', error);
    res.status(500).json({ message: 'Error logging in' });
  }
};

exports.logout = async (req, res) => {
  res.clearCookie('token', { path: '/' });
  res.clearCookie('refreshToken', { path: '/' });
  res.json({ message: 'Logged out successfully' });
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user data' });
  }
};
