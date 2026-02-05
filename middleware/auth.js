const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');
require('dotenv').config();

// NEVER allow fallbacks
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if (!JWT_SECRET) {
  logger.error('FATAL: JWT_SECRET not configured');
  throw new Error('FATAL ERROR: JWT_SECRET must be defined in environment variables');
}

// Validate secret strength (minimum 64 characters for HS256/512)
if (JWT_SECRET.length < 64) {
  logger.warn('WARNING: JWT_SECRET is too short (should be 64+ characters)');
}

const auth = async (req, res, next) => {
  try {
    // Extract token from cookie (preferred) or Authorization header
    let token = req.cookies?.token;

    if (!token && req.headers.authorization) {
      const authHeader = req.headers.authorization;
      if (authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      logger.warn({
        message: 'Authentication attempt without token',
        ip: req.ip,
        path: req.path,
        userAgent: req.get('user-agent')
      });
      return res.status(401).json({
        error: 'Authentication required',
        code: 'NO_TOKEN'
      });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET, {
      algorithms: ['HS256', 'HS512'],
      maxAge: process.env.JWT_EXPIRE || '1h'
    });

    // Add user info to request
    req.user = {
      id: decoded.id || decoded.userId,
      username: decoded.username,
      email: decoded.email,
      role: decoded.role || 'user',
      company: decoded.company,
      tokenIssued: decoded.iat,
      tokenExpires: decoded.exp
    };

    next();
  } catch (error) {
    logger.warn({
      message: 'Token verification failed',
      error: error.message,
      ip: req.ip,
      path: req.path
    });

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expired',
        code: 'TOKEN_EXPIRED',
        expiredAt: error.expiredAt
      });
    }

    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid token',
        code: 'INVALID_TOKEN'
      });
    }

    res.status(401).json({
      error: 'Authentication failed',
      code: 'AUTH_FAILED'
    });
  }
};

const refreshAuth = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        error: 'Refresh token required',
        code: 'NO_REFRESH_TOKEN'
      });
    }

    if (!JWT_REFRESH_SECRET) {
      throw new Error('JWT_REFRESH_SECRET not configured');
    }

    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET, {
      algorithms: ['HS256', 'HS512']
    });

    req.user = decoded;
    next();
  } catch (error) {
    logger.warn('Refresh token verification failed', { error: error.message });
    res.status(401).json({
      error: 'Invalid refresh token',
      code: 'INVALID_REFRESH_TOKEN'
    });
  }
};

module.exports = auth;
module.exports.refreshAuth = refreshAuth;