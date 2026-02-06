const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const auth = require('../middleware/auth');
const { trackAIUsage } = require('../middleware/aiCostControl');
const { authorize } = require('../middleware/rbac');

// Protect AI route: require auth, check role, and track/limit usage
router.post('/chat',
    auth,
    authorize('hr', 'manager', 'admin', 'superadmin', 'md'),
    trackAIUsage,
    aiController.handleChat
);

module.exports = router;
