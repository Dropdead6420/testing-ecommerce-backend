const userService = require("../user/user.service");
const cartService = require("../cart/cart.service");
const jwtProvider = require("../../config/jwtProvider");
const { sendResetEmail } = require("../../utils/emailService")
const bcrypt = require("bcrypt");
const crypto = require("crypto");
require("dotenv").config();

const register = async (req, res) => {
    try {
        const user = await userService.createUser(req.body);
        if (!user) {
            return res.status(400).json({ 
                error: "Registration failed", 
                message: "Unable to create user account" 
            });
        }
        
        // Create cart for the new user
        try {
            await cartService.createCart(user);
        } catch (cartError) {
            console.error("Error creating cart:", cartError);
            // Continue with registration even if cart creation fails
            // We'll create the cart when the user first adds an item
        }
        
        const jwt = jwtProvider.generateToken(user._id);

        return res.status(201).json({ 
            jwt, 
            message: "Registration successful",
            userId: user._id
        });
    } catch (error) {
        const statusCode = error.statusCode || 500;
        const errorMessage = error.message || "An unexpected error occurred during registration";
        
        return res.status(statusCode).json({ 
            error: statusCode === 400 ? "Registration failed" : "Server error", 
            message: errorMessage 
        });
    }
}

const login = async (req, res) => {
    const { email, password } = req.body;

    try {
        // Find user by email
        const user = await userService.getUserByEmail(email);
        if (!user) {
            return res.status(401).json({ 
                error: "Authentication failed", 
                message: "Invalid email or password" 
            });
        }

        // Verify password
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ 
                error: "Authentication failed", 
                message: "Invalid email or password" 
            });
        }

        // Generate JWT token
        const jwt = jwtProvider.generateToken(user._id);

        return res.status(200).json({ 
            jwt, 
            message: "Login successful",
            userId: user._id
        });
    } catch (error) {
        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({ 
            error: "Authentication failed", 
            message: error.message || "An error occurred during login" 
        });
    }
};

const forgetPassword = async (req, res) => {
    const { email, mobile } = req.body;

    try {
        // Validate request
        if (!email && !mobile) {
            return res.status(400).json({ 
                error: "Bad request", 
                message: "Email or mobile number is required" 
            });
        }

        if (email) {
            // For security reasons, don't reveal if the email exists or not
            // Just return a generic success message even if the email doesn't exist
            const user = await userService.getUserByEmail(email);

            if (!user) {
                // For security, return success even if user doesn't exist
                // This prevents email enumeration attacks
                return res.status(200).json({ 
                    message: "If your email is registered with us, you will receive a password reset link shortly." 
                });
            }

            // Check if token exists and is still valid
            if (user.resetPasswordToken && user.resetPasswordTokenExpires) {
                if (user.resetPasswordTokenExpires > Date.now()) {
                    // Don't reveal that a token was already sent
                    return res.status(200).json({ 
                        message: "If your email is registered with us, you will receive a password reset link shortly." 
                    });
                } else {
                    // Token expired — clear it
                    user.resetPasswordToken = undefined;
                    user.resetPasswordTokenExpires = undefined;
                    await user.save();
                }
            }

            // Generate a secure random token
            const token = crypto.randomBytes(32).toString('hex');
            
            // Set token expiration (use environment variable with fallback)
            const resetTokenValid = process.env.RESET_TOKEN_VALID || 5 * 60 * 1000; // Default: 5 minutes
            const resetPasswordExpire = new Date(Date.now() + Number(resetTokenValid));

            // Update user with token
            const isUpdateUser = await userService.setPasswordResetToken(user._id, token, resetPasswordExpire);
            if (!isUpdateUser) {
                console.error("Error updating user with reset token");
                return res.status(500).json({ 
                    error: "Server error", 
                    message: "Unable to process your request at this time" 
                });
            }

            // Send Email
            const isEmailSent = await sendResetEmail(email, token);

            // If email is not sent
            if (!isEmailSent.success) {
                console.error("Email sending failed:", isEmailSent.error);
                
                // Clean up token if email fails
                try {
                    const updatedUser = await userService.getUserByEmail(email);
                    if (updatedUser) {
                        updatedUser.resetPasswordToken = undefined;
                        updatedUser.resetPasswordTokenExpires = undefined;
                        await updatedUser.save();
                    }
                } catch (cleanupError) {
                    console.error("Failed to clean up token:", cleanupError);
                }

                return res.status(500).json({ 
                    error: "Email delivery failed", 
                    message: "Unable to send password reset email. Please try again later." 
                });
            }

            return res.status(200).json({ 
                message: "If your email is registered with us, you will receive a password reset link shortly." 
            });
        } else if (mobile) {
            return res.status(501).json({ 
                error: "Not implemented", 
                message: "Mobile-based password reset is not yet supported." 
            });
        }
    } catch (error) {
        console.error("Password reset error:", error);
        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({ 
            error: "Password reset request failed", 
            message: "An error occurred while processing your request" 
        });
    }
}

const resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;

    try {
        if (!token || !newPassword) {
            return res.status(400).json({ 
                error: "Bad request", 
                message: "Token and new password are required" 
            });
        }

        const user = await userService.getUserByToken(token);
        if (!user) {
            return res.status(400).json({ 
                error: "Invalid request", 
                message: "Invalid or expired token" 
            });
        }

        // Hash and update the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordTokenExpires = undefined;

        await user.save();

        return res.status(200).json({ 
            message: "Password has been reset successfully",
            success: true
        });
    } catch (error) {
        const statusCode = error.statusCode || 500;
        return res.status(statusCode).json({ 
            error: "Password reset failed", 
            message: error.message || "An error occurred during password reset" 
        });
    }
};

module.exports = { login, register, forgetPassword, resetPassword };