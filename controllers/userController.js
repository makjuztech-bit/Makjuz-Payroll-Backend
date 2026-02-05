const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

// Fetch secrets inside the function to ensure they are loaded after dotenv
const getSecrets = () => ({
  jwtSecret: process.env.JWT_SECRET,
  refreshSecret: process.env.JWT_REFRESH_SECRET
});

// Cookie options
const getCookieOptions = (maxAge) => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge,
  path: '/'
});

exports.register = async (req, res) => {
  const { jwtSecret, refreshSecret } = getSecrets();

  try {
    const { username, password, email } = req.body;

    // 1. Basic Validation
    if (!username || !password || !email) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    if (!jwtSecret || !refreshSecret) {
      console.error('SYSTEM_ERROR: JWT Secrets missing from environment');
      return res.status(500).json({ message: 'Server configuration error: Missing secrets' });
    }

    // 2. Existing User Check
    const existingUser = await User.findOne({
      $or: [{ username: username.trim() }, { email: email.toLowerCase().trim() }]
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }

    // 3. Argon2 Hashing (Optimized for low-RAM containers)
    let hashedPassword;
    try {
      hashedPassword = await argon2.hash(password, {
        type: argon2.argon2id,
        memoryCost: 16384, // 16MB
        timeCost: 2,
        parallelism: 1
      });
    } catch (hashError) {
      console.error('ARGON2_ERROR:', hashError);
      return res.status(500).json({ message: 'Encryption failed' });
    }

    // 4. Save User
    const user = new User({
      username: username.trim(),
      password: hashedPassword,
      email: email.toLowerCase().trim(),
      role: 'user' // Changed from admin to user for security
    });

    try {
      await user.save();
    } catch (dbError) {
      console.error('MONGO_SAVE_ERROR:', dbError);
      return res.status(400).json({ message: 'Database validation failed', details: dbError.message });
    }

    // 5. Token Generation
    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRE || '1h' }
    );

    const refreshToken = jwt.sign(
      { id: user._id },
      refreshSecret,
      { expiresIn: '7d' }
    );

    // 6. Set Cookies
    res.cookie('token', token, getCookieOptions(24 * 60 * 60 * 1000));
    res.cookie('refreshToken', refreshToken, getCookieOptions(7 * 24 * 60 * 60 * 1000));

    res.status(201).json({
      message: 'User registered successfully',
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('GLOBAL_REGISTER_ERROR:', error);
    res.status(500).json({
      message: 'Critical error during registration',
      details: error.message
    });
  }
};

exports.login = async (req, res) => {
  const { jwtSecret, refreshSecret } = getSecrets();

  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username: username.trim() }).select('+password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    if (user.isLocked) {
      return res.status(423).json({ message: 'Account locked. Try again later.' });
    }

    const isValidPassword = await argon2.verify(user.password, password);
    if (!isValidPassword) {
      await user.incLoginAttempts();
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    await user.resetLoginAttempts();

    const token = jwt.sign(
      { id: user._id, username: user.username, role: user.role },
      jwtSecret,
      { expiresIn: process.env.JWT_EXPIRE || '1h' }
    );

    const refreshToken = jwt.sign(
      { id: user._id },
      refreshSecret,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, getCookieOptions(24 * 60 * 60 * 1000));
    res.cookie('refreshToken', refreshToken, getCookieOptions(7 * 24 * 60 * 60 * 1000));

    res.json({
      message: 'Login successful',
      user: user.toJSON()
    });
  } catch (error) {
    console.error('LOGIN_ERROR:', error);
    res.status(500).json({ message: 'Internal server error during login' });
  }
};

exports.logout = async (req, res) => {
  res.clearCookie('token', { path: '/', sameSite: 'none', secure: true });
  res.clearCookie('refreshToken', { path: '/', sameSite: 'none', secure: true });
  res.json({ message: 'Logged out successfully' });
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching user profile' });
  }
};
