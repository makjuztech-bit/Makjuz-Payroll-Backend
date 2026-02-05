const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

const { authLimiter } = require('../middleware/rateLimiter');

// Public routes
router.post('/register', authLimiter, userController.register);
router.post('/login', authLimiter, userController.login);
router.post('/logout', userController.logout);

// Protected routes
router.get('/me', auth, userController.getMe);

module.exports = router;
