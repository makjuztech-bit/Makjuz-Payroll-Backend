const logger = require('../utils/logger');

// Define role hierarchy (higher number = more permissions)
const ROLE_HIERARCHY = {
    user: 1,
    hr: 2,
    manager: 3,
    admin: 4,
    superadmin: 5
};

// Define permissions for each role
const ROLE_PERMISSIONS = {
    user: ['read:own', 'update:own'],
    hr: ['read:own', 'update:own', 'read:employees', 'create:employees', 'update:employees'],
    manager: ['read:own', 'update:own', 'read:employees', 'read:team', 'update:team'],
    admin: ['*'], // All permissions
    superadmin: ['*'] // All permissions + system config
};

/**
 * Authorize based on roles
 * @param {...string} allowedRoles - Roles that can access this route
 */
const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        // Check if user is authenticated
        if (!req.user) {
            logger.warn({
                message: 'Authorization attempt without authentication',
                ip: req.ip,
                path: req.path
            });
            return res.status(401).json({
                error: 'Authentication required',
                code: 'NOT_AUTHENTICATED'
            });
        }

        // Check if user has required role
        if (!allowedRoles.includes(req.user.role)) {
            logger.warn({
                message: 'Unauthorized access attempt',
                userId: req.user.id,
                userRole: req.user.role,
                requiredRoles: allowedRoles,
                ip: req.ip,
                path: req.path,
                method: req.method
            });

            return res.status(403).json({
                error: 'Access denied. Insufficient permissions.',
                code: 'FORBIDDEN',
                required: allowedRoles,
                current: req.user.role
            });
        }

        logger.info({
            message: 'Authorized access',
            userId: req.user.id,
            role: req.user.role,
            path: req.path
        });

        next();
    };
};

/**
 * Check if user has minimum role level
 * @param {string} minimumRole - Minimum required role
 */
const requireMinimumRole = (minimumRole) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        const userLevel = ROLE_HIERARCHY[req.user.role] || 0;
        const requiredLevel = ROLE_HIERARCHY[minimumRole] || 0;

        if (userLevel < requiredLevel) {
            logger.warn({
                message: 'Insufficient role level',
                userId: req.user.id,
                userRole: req.user.role,
                requiredRole: minimumRole,
                path: req.path
            });

            return res.status(403).json({
                error: 'Insufficient role level',
                required: minimumRole,
                current: req.user.role
            });
        }

        next();
    };
};

module.exports = {
    authorize,
    requireMinimumRole,
    ROLE_HIERARCHY,
    ROLE_PERMISSIONS
};
