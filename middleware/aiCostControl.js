const logger = require('../utils/logger');

// Track AI usage per user (In-memory for now, use Redis in production)
const usageTracker = new Map();

const AI_LIMITS = {
    user: { daily: 10, monthly: 100 },
    hr: { daily: 50, monthly: 500 },
    manager: { daily: 50, monthly: 500 },
    admin: { daily: 200, monthly: 2000 },
    md: { daily: 500, monthly: 5000 },
    superadmin: { daily: -1, monthly: -1 } // Unlimited
};

const trackAIUsage = async (req, res, next) => {
    const userId = req.user?.id;
    const userRole = req.user?.role || 'user';

    if (!userId) {
        return res.status(401).json({ error: 'User ID missing for AI tracking' });
    }

    const today = new Date().toISOString().split('T')[0];
    const month = new Date().toISOString().substring(0, 7);

    // Initialize tracking
    if (!usageTracker.has(userId)) {
        usageTracker.set(userId, {
            daily: { [today]: 0 },
            monthly: { [month]: 0 }
        });
    }

    const usage = usageTracker.get(userId);
    const limits = AI_LIMITS[userRole] || AI_LIMITS.user;

    // Check if superadmin (unlimited)
    if (limits.daily === -1) {
        return next();
    }

    // Reset counters if new day/month
    if (!usage.daily[today]) usage.daily = { [today]: 0 };
    if (!usage.monthly[month]) usage.monthly = { [month]: 0 };

    // Check limits
    if (usage.daily[today] >= limits.daily) {
        logger.warn({
            message: 'AI daily limit exceeded',
            userId,
            role: userRole,
            usage: usage.daily[today],
            limit: limits.daily
        });

        return res.status(429).json({
            error: 'Daily AI usage limit exceeded',
            limit: limits.daily,
            used: usage.daily[today]
        });
    }

    if (usage.monthly[month] >= limits.monthly) {
        logger.warn({
            message: 'AI monthly limit exceeded',
            userId,
            role: userRole,
            usage: usage.monthly[month],
            limit: limits.monthly
        });

        return res.status(429).json({
            error: 'Monthly AI usage limit exceeded',
            limit: limits.monthly,
            used: usage.monthly[month]
        });
    }

    // Increment counters
    usage.daily[today]++;
    usage.monthly[month]++;
    usageTracker.set(userId, usage);

    next();
};

module.exports = { trackAIUsage, AI_LIMITS };
