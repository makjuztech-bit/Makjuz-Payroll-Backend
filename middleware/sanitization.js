const validator = require('validator');
const mongoSanitize = require('express-mongo-sanitize');

// Escape regex special characters to prevent ReDoS/NoSQL Injection
const escapeRegex = (str) => {
    if (typeof str !== 'string') return '';
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

// Validate and sanitize regex patterns
const validateRegexPattern = (pattern) => {
    // Whitelist: only allow alphanumeric and common chars for IDs
    const safePattern = /^[a-zA-Z0-9\s\-_]+$/;

    if (!safePattern.test(pattern)) {
        throw new Error('Invalid pattern: contains unsafe characters');
    }

    // Limit length to prevent ReDoS
    if (pattern.length > 100) {
        throw new Error('Pattern too long');
    }

    return escapeRegex(pattern);
};

// Sanitize all user input against MongoDB operators
const sanitizeInput = (req, res, next) => {
    mongoSanitize.sanitize(req.body);
    mongoSanitize.sanitize(req.query);
    mongoSanitize.sanitize(req.params);
    next();
};

const sanitizeString = (str, maxLength = 255) => {
    if (typeof str !== 'string') return '';
    str = str.replace(/\0/g, ''); // Remove null bytes
    return validator.trim(str).substring(0, maxLength);
};

module.exports = {
    escapeRegex,
    validateRegexPattern,
    sanitizeInput,
    sanitizeString
};
