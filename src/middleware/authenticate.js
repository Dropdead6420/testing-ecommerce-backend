const jwtProvider = require("../config/jwtProvider.js");
const userService = require("../modules/user/user.service.js");
const adminService = require("../modules/admin/admin.service.js");
const roleService = require("../modules/role/role.service.js");
const { extractToken } = require("../utils/authUtils.js");

const authenticate = async (req, res, next) => {
    const token = extractToken(req);
    if (!token) {
        return res.status(401).json({
            error: "Authorization token missing or malformed",
            message: "Please log in to access this resource"
        });
    }

    try {
        const userId = jwtProvider.getUserIdFromToken(token);
        if (!userId) {
            return res.status(401).json({
                error: "Invalid token",
                message: "User ID not found in token"
            });
        }

        const user = await userService.findUserById(userId);
        if (!user) {
            return res.status(404).json({
                error: "User not found",
                message: "The user associated with this token no longer exists"
            });
        }
        
        req.user = user;
        next();
    } catch (error) {
        const statusCode = error.statusCode || 500;

        return res.status(statusCode).json({
            error: error.statusCode === 401 ? "Authentication failed" : "Server error",
            message: error.message
        });
    }
}

const authenticateAdmin = async (req, res, next) => {
    const token = extractToken(req);
    if (!token) {
        return res.status(401).json({ 
            error: "Authorization token missing", 
            message: "Please log in again" 
        });
    }

    try {
        const adminDetails = jwtProvider.getAdminDetail(token);
        if (!adminDetails || !adminDetails.userId) {
            return res.status(401).json({
                error: "Invalid token",
                message: "Admin ID not found in token"
            });
        }
        
        const user = await adminService.searchById(adminDetails.userId);
        if (!user) {
            return res.status(403).json({
                message: "You do not have permission to access this resource.",
                error: "Forbidden"
            });
        }

        req.user = user;
        next();
    } catch (error) {
        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({ 
            error: error.statusCode === 401 ? "Authentication failed" : "Server error", 
            message: error.message 
        });
    }
}

const authorizedAdminRoles = (...allowedRoles) => {
    return async (req, res, next) => {
        const token = extractToken(req);
        if (!token) {
            return res.status(401).json({ 
                error: "Authorization token missing", 
                message: "Please log in again" 
            });
        }

        try {
            const adminDetail = jwtProvider.getAdminDetail(token);
            if (!adminDetail || !adminDetail.role) {
                return res.status(401).json({
                    error: "Invalid token",
                    message: "Role information not found in token"
                });
            }
            
            const roleData = await roleService.searchById(adminDetail.role);
            if (!roleData) {
                return res.status(404).json({
                    error: "Invalid role",
                    message: "Role not found in database"
                });
            }

            // Check against role name or permissions
            const hasPermission = allowedRoles.includes(roleData.name) ||
                (Array.isArray(roleData.permissions) && roleData.permissions.some(permission => allowedRoles.includes(permission)));

            if (!hasPermission) {
                return res.status(403).json({
                    message: "You do not have permission to access this resource.",
                    error: "Forbidden"
                });
            }

            return next();
        } catch (error) {
            const statusCode = error.statusCode || 500;
            return res.status(statusCode).json({ 
                error: error.statusCode === 401 ? "Authentication failed" : "Server error", 
                message: error.message 
            });
        }
    }
}

const authorizeConditional = (...allowedRoles) => {
    return async (req, res, next) => {
        const token = extractToken(req);
        if (!token) {
            return res.status(401).json({
                error: "Authorization token missing or malformed",
                message: "Please log in to access this resource"
            });
        }

        try {
            // Try as regular user first
            try {
                const userId = jwtProvider.getUserIdFromToken(token);
                if (userId) {
                    const user = await userService.findUserById(userId);
                    if (user) {
                        req.user = user;
                        return next();
                    }
                }
            } catch (err) {
                // Not a customer token — continue to check if admin
                // No need to handle this error as we'll try admin authentication next
            }

            // Try as admin if user authentication failed
            try {
                const adminDetails = jwtProvider.getAdminDetail(token);
                if (!adminDetails || !adminDetails.userId || !adminDetails.role) {
                    return res.status(401).json({
                        error: "Invalid token",
                        message: "Token does not contain valid authentication information"
                    });
                }

                const admin = await adminService.searchById(adminDetails.userId);
                if (!admin) {
                    return res.status(403).json({
                        message: "You do not have permission to access this resource.",
                        error: "Forbidden"
                    });
                }

                const roleData = await roleService.searchById(adminDetails.role);
                if (!roleData) {
                    return res.status(404).json({
                        error: "Invalid role",
                        message: "Role not found in database"
                    });
                }

                // Check against role name or permissions
                const hasPermission =
                    allowedRoles.includes(roleData.name) ||
                    (Array.isArray(roleData.permissions) && roleData.permissions.some(p => allowedRoles.includes(p)));

                if (!hasPermission) {
                    return res.status(403).json({
                        message: "You do not have permission to access this resource.",
                        error: "Forbidden"
                    });
                }

                req.user = admin;
                return next();
            } catch (adminError) {
                // If both user and admin authentication failed, return 401
                return res.status(401).json({
                    error: "Authentication failed",
                    message: "Invalid or expired token"
                });
            }
        } catch (error) {
            const statusCode = error.statusCode || 500;
            return res.status(statusCode).json({ 
                error: statusCode === 401 ? "Authentication failed" : "Server error", 
                message: error.message 
            });
        }
    };
};


module.exports = { authenticate, authenticateAdmin, authorizedAdminRoles, authorizeConditional };