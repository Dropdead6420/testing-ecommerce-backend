/**
 * Extracts authentication token from request
 * @param {Object} req - Express request object
 * @returns {string|null} - The extracted token or null if not found
 */
const extractToken = (req) => {
    if (!req) {
        console.error('Request object is missing');
        return null;
    }

    // Extract from Authorization header (Bearer token)
    let bearerToken = null;
    if (req.headers && req.headers.authorization) {
        const authHeader = req.headers.authorization;
        if (authHeader.startsWith('Bearer ')) {
            bearerToken = authHeader.substring(7);
        }
    }

    // Extract from cookies
    const cookieToken = req.cookies?.token;

    // Return the first available token
    return bearerToken || cookieToken || null;
};

module.exports = { extractToken };
