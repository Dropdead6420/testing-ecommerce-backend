const nodemailer = require('nodemailer');
require("dotenv").config();
const createHttpError = require('./HttpError');

// Create email transporter with fallback options
let transporter;

try {
    // Check if required environment variables are set
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
        console.warn('Email credentials not found in environment variables. Email functionality will not work.');
    }
    
    transporter = nodemailer.createTransport({
        service: 'Gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        },
        // Add connection timeout to prevent hanging
        connectionTimeout: 10000, // 10 seconds
        greetingTimeout: 5000,    // 5 seconds
        socketTimeout: 10000      // 10 seconds
    });
} catch (error) {
    console.error('Failed to create email transporter:', error);
}

/**
 * Send password reset email to admin users
 * @param {string} to - Admin email address
 * @param {string} token - Reset password token
 * @returns {Promise<Object>} - Result of email sending operation
 */
const sendResetEmailAdmin = async (to, token) => {
    // Validate inputs
    if (!to || !token) {
        return {
            success: false,
            message: "Missing required parameters",
            error: "Email address and token are required"
        };
    }

    // Check if transporter is available
    if (!transporter) {
        console.error("Email transporter not initialized");
        return {
            success: false,
            message: "Email service unavailable",
            error: "Email configuration error"
        };
    }

    // Check if admin frontend URL is configured
    const resetUrl = process.env.BASE_URL_FRONTEND_ADMIN 
        ? `${process.env.BASE_URL_FRONTEND_ADMIN}/authentication/reset-password?token=${token}`
        : `http://localhost:3000/authentication/reset-password?token=${token}`;

    const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to,
        subject: "Reset Your Password",
        html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>Dear Admin,</p>
        <p>We received a request to reset your password for your <strong>Admin</strong> account. Click the button below to reset your password:</p>

        <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}"
               style="background-color: #007BFF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-size: 16px;">
               Reset Password
            </a>
        </div>

        <p>This link is valid for <strong>5 minutes</strong>. If you did not request a password reset, please ignore this email.</p>

        <hr style="margin: 30px 0;">
        <p style="color: #888; font-size: 12px;">
            If the button above doesn't work, copy and paste this URL into your browser: ${resetUrl}
        </p>
    </div>
    `
    };

    try {
        const result = await transporter.sendMail(mailOptions);
        return {
            success: true,
            message: "Password reset email sent successfully",
            data: result.response
        };
    } catch (error) {
        console.error("Error sending admin reset email:", error);
        return {
            success: false,
            message: "Failed to send password reset email",
            error: error.message
        };
    }
};

/**
 * Send password reset email to customer users
 * @param {string} to - Customer email address
 * @param {string} token - Reset password token
 * @returns {Promise<Object>} - Result of email sending operation
 */
const sendResetEmail = async (to, token) => {
    // Validate inputs
    if (!to || !token) {
        return {
            success: false,
            message: "Missing required parameters",
            error: "Email address and token are required"
        };
    }

    // Check if transporter is available
    if (!transporter) {
        console.error("Email transporter not initialized");
        return {
            success: false,
            message: "Email service unavailable",
            error: "Email configuration error"
        };
    }

    // Check if customer frontend URL is configured
    const resetUrl = process.env.BASE_URL_FRONTEND_CUSTOMER 
        ? `${process.env.BASE_URL_FRONTEND_CUSTOMER}/auth/reset-password/${token}`
        : `http://localhost:3000/auth/reset-password/${token}`;

    const mailOptions = {
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to,
        subject: "Reset Your Password",
        html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #333;">Password Reset Request</h2>
        <p>Dear Customer,</p>
        <p>We received a request to reset your password for your account. Click the button below to reset your password:</p>

        <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #007BFF; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-size: 16px;">
               Reset Password
            </a>
        </div>

        <p>This link is valid for <strong>5 minutes</strong>. If you did not request a password reset, please ignore this email.</p>

        <hr style="margin: 30px 0;">
        <p style="color: #888; font-size: 12px;">
            If the button above doesn't work, copy and paste this URL into your browser: ${resetUrl}
        </p>
    </div>
    `
    };

    try {
        // Verify connection before sending
        await transporter.verify();
        
        const result = await transporter.sendMail(mailOptions);
        return {
            success: true,
            message: "Password reset email sent successfully",
            data: result.response
        };
    } catch (error) {
        console.error("Error sending customer reset email:", error);
        return {
            success: false,
            message: "Failed to send password reset email",
            error: error.message
        };
    }
};

module.exports = { sendResetEmail, sendResetEmailAdmin };