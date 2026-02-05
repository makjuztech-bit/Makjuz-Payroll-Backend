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

/**
 * Verify if user belongs to the requested company
 * (Assumes companyId is in req.params, req.query, or req.body)
 */
const verifyCompanyAccess = (req, res, next) => {
    // 1. Superadmins bypass all checks
    if (req.user && req.user.role === 'superadmin') {
        return next();
    }

    // 2. Identify target company
    const targetCompanyId = req.params.companyId || req.query.companyId || req.body.companyId;

    if (!targetCompanyId) {
        // If route doesn't specify company, skip explicit check.
        // The controller (e.g. create/find) should use req.user.company default.
        return next();
    }

    // 3. User must have a company assigned (if route is company-specific)
    if (!req.user.company) {
        // LEGACY FIX: If user is admin but has no company (e.g. migration pending), allow access
        // This stops the frontend from breaking for existing admin accounts
        if (req.user.role === 'admin') {
            return next();
        }

        return res.status(403).json({
            error: 'Access denied. You are not assigned to any company.',
            code: 'NO_COMPANY_ASSIGNED'
        });
    }

    // 4. Check Match
    if (req.user.company.toString() !== targetCompanyId.toString()) {
        logger.warn({
            message: 'Cross-company access attempt prevented',
            userId: req.user.id,
            userCompany: req.user.company,
            targetCompany: targetCompanyId
        });
        return res.status(403).json({
            error: 'Access denied. You do not have permission to access data for this company.',
            code: 'COMPANY_MISMATCH'
        });
    }

    next();
};

module.exports = {
    authorize,
    requireMinimumRole,
    verifyCompanyAccess,
    ROLE_HIERARCHY,
    ROLE_PERMISSIONS
};
