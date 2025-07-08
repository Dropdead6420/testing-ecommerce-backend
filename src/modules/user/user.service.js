const User = require("./user.model.js");
const jwtProvider = require("../../config/jwtProvider.js");
const bcrypt = require("bcrypt");
const createHttpError = require("../../utils/HttpError.js");

const createUser = async (userData) => {
    try {
        let { firstName, lastName, email, password, mobile } = userData;

        // Check if user already exists with this email
        const isUserExist = await User.findOne({ email });
        if (isUserExist) {
            const error = createHttpError(400, `User already exists with this email: ${email}`);
            throw error;
        }

        // Hash the password
        const genSaltPassword = await bcrypt.genSalt(10);
        const encodedPassword = await bcrypt.hash(password, genSaltPassword);

        // Create new user with sanitized data
        const userToCreate = { 
            firstName, 
            lastName, 
            email, 
            password: encodedPassword 
        };
        
        // Add mobile if provided
        if (mobile) {
            userToCreate.mobile = mobile;
        }

        const user = await User.create(userToCreate);
        return user;
    } catch (error) {
        // If it's already a HttpError, pass it through
        if (error.statusCode) {
            throw error;
        }
        
        // Handle mongoose validation errors
        if (error.name === 'ValidationError') {
            const validationError = createHttpError(400, error.message);
            throw validationError;
        }
        
        // Handle duplicate key errors
        if (error.code === 11000) {
            const duplicateError = createHttpError(400, 'Email already in use');
            throw duplicateError;
        }
        
        // For other errors, wrap with 500
        throw createHttpError(500, `Error creating user: ${error.message}`);
    }
}

const findUserById = async (userId) => {
    try {
        const user = await User.findById(userId)
        if (!user) {
            throw createHttpError(404, `User not found with id: ${userId}`);
        }
        return user;
    } catch (error) {
        if (error.statusCode) {
            throw error;
        }

        // Wrap unknown errors with 500
        throw createHttpError(500, `Database error while finding user: ${error.message}`);
    }
}

const getUserByEmail = async (email) => {
    try {
        if (!email) {
            throw createHttpError(400, 'Email is required');
        }
        
        const user = await User.findOne({ email });
        return user; // May be null if user not found, which is handled by the caller
    } catch (error) {
        // If it's already a HttpError, pass it through
        if (error.statusCode) {
            throw error;
        }
        
        // For other errors, wrap with 500
        throw createHttpError(500, `Error finding user by email: ${error.message}`);
    }
}

const getUserProfileByToken = async (token) => {
    try {
        if (!token) {
            throw createHttpError(401, 'Authentication token is required');
        }
        
        const userId = jwtProvider.getUserIdFromToken(token);
        if (!userId) {
            throw createHttpError(401, 'Invalid authentication token');
        }
        
        const user = await findUserById(userId);
        return user;
    } catch (error) {
        // If it's already a HttpError, pass it through
        if (error.statusCode) {
            throw error;
        }
        
        // For other errors, wrap with appropriate status code
        if (error.message && error.message.includes('jwt')) {
            throw createHttpError(401, `Authentication error: ${error.message}`);
        }
        
        throw createHttpError(500, `Error getting user profile: ${error.message}`);
    }
}

const getAllUsers = async () => {
    try {
        const users = await User.find();
        return users;
    } catch (error) {
        // For other errors, wrap with 500
        throw createHttpError(500, `Error fetching users: ${error.message}`);
    }
}


const setPasswordResetToken = async (userId, token, expiry) => {
    try {
        if (!userId || !token || !expiry) {
            throw createHttpError(400, 'User ID, token, and expiry are required');
        }
        
        // Update user with token and expiry
        const updatedUser = await User.findByIdAndUpdate(
            userId, 
            {
                resetPasswordToken: token,
                resetPasswordTokenExpires: expiry
            },
            { new: true } // Return the updated document
        );
        
        if (!updatedUser) {
            throw createHttpError(404, `User not found with id: ${userId}`);
        }
        
        return updatedUser;
    } catch (error) {
        // If it's already a HttpError, pass it through
        if (error.statusCode) {
            throw error;
        }
        
        // For other errors, wrap with 500
        throw createHttpError(500, `Error setting password reset token: ${error.message}`);
    }
};

const getUserByToken = async (token) => {
    try {
        if (!token) {
            throw createHttpError(400, 'Token is required');
        }
        
        // Find user with valid token (not expired)
        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordTokenExpires: { $gt: Date.now() }
        });

        if (!user) {
            // If token is invalid or expired, check if it exists but is expired
            const isUserExist = await User.findOne({
                resetPasswordToken: token
            });

            // If user exists but token is expired, clean up the token
            if (isUserExist) {
                isUserExist.resetPasswordToken = undefined;
                isUserExist.resetPasswordTokenExpires = undefined;
                await isUserExist.save();
                
                // Log that we cleaned up an expired token
                console.log(`Cleaned up expired token for user: ${isUserExist._id}`);
            }

            // Return null to indicate token is invalid or expired
            return null;
        }

        return user;
    } catch (error) {
        // If it's already a HttpError, pass it through
        if (error.statusCode) {
            throw error;
        }
        
        // For other errors, wrap with 500
        throw createHttpError(500, `Error getting user by token: ${error.message}`);
    }
}

const updateUserById = async (id, updateData) => {
    try {
        if (!id) {
            throw createHttpError(400, 'User ID is required');
        }
        
        if (!updateData || Object.keys(updateData).length === 0) {
            throw createHttpError(400, 'Update data is required');
        }
        
        // Check if email or mobile already exists with another user
        if (updateData.email || updateData.mobile) {
            const query = {
                _id: { $ne: id }, // Exclude current user
                $or: []
            };
            
            if (updateData.email) {
                query.$or.push({ email: updateData.email });
            }
            
            if (updateData.mobile) {
                query.$or.push({ mobile: updateData.mobile });
            }
            
            // Only perform the check if we have conditions
            if (query.$or.length > 0) {
                const existingUser = await User.findOne(query);
                if (existingUser) {
                    throw createHttpError(400, 'Email or mobile already in use by another user');
                }
            }
        }
        
        // Update the user
        const updatedUser = await User.findByIdAndUpdate(id, updateData, {
            new: true,
            runValidators: true
        });
        
        if (!updatedUser) {
            throw createHttpError(404, `User not found with id: ${id}`);
        }
        
        return updatedUser;
    } catch (error) {
        // If it's already a HttpError, pass it through
        if (error.statusCode) {
            throw error;
        }
        
        // Handle mongoose validation errors
        if (error.name === 'ValidationError') {
            throw createHttpError(400, error.message);
        }
        
        // Handle duplicate key errors
        if (error.code === 11000) {
            throw createHttpError(400, 'Email or mobile already in use');
        }
        
        // For other errors, wrap with 500
        throw createHttpError(500, `Error updating user: ${error.message}`);
    }
};

module.exports = { createUser, findUserById, getUserByEmail, getUserProfileByToken, getAllUsers, setPasswordResetToken, getUserByToken, updateUserById };