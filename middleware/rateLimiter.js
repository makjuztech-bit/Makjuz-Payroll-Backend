const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const logger = require('../utils/logger');

// General API rate limiter
const apiLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
        logger.warn({
            message: 'Rate limit exceeded',
            ip: req.ip,
            path: req.path
        });

        res.status(429).json({
            error: 'Too many requests, please try again later.'
        });
    }
});

// Strict limiter for auth
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: parseInt(process.env.AUTH_RATE_LIMIT_MAX) || 5,
    skipSuccessfulRequests: true,
    handler: (req, res) => {
        logger.warn({
            message: 'Auth rate limit exceeded',
            ip: req.ip,
            path: req.path
        });

        res.status(429).json({
            error: 'Too many failed attempts, please try again in 15 minutes.'
        });
    }
});

// Speed limiter (slows down responses after 50 requests)
const speedLimiter = slowDown({
    windowMs: 15 * 60 * 1000,
    delayAfter: 50,
    delayMs: () => 500
});

module.exports = {
    apiLimiter,
    authLimiter,
    speedLimiter
};
