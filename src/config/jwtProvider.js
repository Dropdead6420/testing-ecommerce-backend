const jwt = require("jsonwebtoken");
const createHttpError = require("../utils/HttpError");
require("dotenv").config();
const SECRET_KEY_CUSTOMER = process.env.JWT_SECRET_CUSTOMER || "ECommerce";
const SECRET_KEY_ADMIN = process.env.JWT_SECRET_ADMIN || "ECommerce";
const JWT_EXPIRES_FOR_CUSTOMER = process.env.JWT_EXPIRES_FOR_CUSTOMER || "48h";
const JWT_EXPIRES_FOR_ADMIN = process.env.JWT_EXPIRES_FOR_ADMIN || "24h";

// Generate token for Customer
const generateToken = (userId) => {
    const token = jwt.sign({ userId }, SECRET_KEY_CUSTOMER, { expiresIn: JWT_EXPIRES_FOR_CUSTOMER });
    return token;
}

// Decode token for Customer
const getUserIdFromToken = (token) => {
    try {
        // Fixed: Handle both string and array token formats
        const decodedToken = jwt.verify(token, SECRET_KEY_CUSTOMER);
        return decodedToken.userId;
    } catch (error) {
        throw new createHttpError(401, "Invalid or expired token.");
    }
}

// Generate token for admin
const generateAdminToken = (userId, role) => {
    const token = jwt.sign({ userId, role }, SECRET_KEY_ADMIN, {
        expiresIn: JWT_EXPIRES_FOR_ADMIN,
    });
    return token;
};

// Decode token for admin
const getAdminDetail = (token) => {
    try {
        const decoded = jwt.verify(token, SECRET_KEY_ADMIN);
        return decoded; // returns { userId, role, iat, exp }
    } catch (error) {
        throw new createHttpError(401, "Invalid or expired token.");
    }
};

module.exports = { generateToken, getUserIdFromToken, generateAdminToken, getAdminDetail };