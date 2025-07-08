const adminService = require("./admin.service");
const roleService = require("../role/role.service");
const jwtProvider = require("../../config/jwtProvider");
const crypto = require("crypto");
const bcrypt = require("bcrypt");
const { sendResetEmailAdmin } = require("../../utils/emailService");
require("dotenv").config();

// Create a new admin
const createAdmin = async (req, res) => {
    const { name, email, password, role } = req.body;

    try {
        const existing = await adminService.searchByEmail(email);
        if (existing) {
            return res.status(409).json({ success: false, message: "Email already exists" });
        }

        const roleExists = await roleService.searchById(role);
        if (!roleExists) {
            return res.status(404).json({ success: false, message: "Role not found" });
        }

        const admin = await adminService.createAdmin({ name, email, password, role });
        res.status(201).json({ success: true, message: "Admin created successfully", data: admin });
    } catch (err) {
        res.status(500).json({ success: false, message: "Failed to create new admin", error: err.message });
    }
};

// Get all admins with pagination and filters
const getAllAdmins = async (req, res) => {
    try {
        const result = await adminService.getAllAdmins(req.query);
        res.status(200).json({
            success: true,
            message: "Admins fetched successfully",
            data: result.data,
            pagination: result.pagination,
        });
    } catch (err) {
        res.status(err.statusCode || 500).json({ success: false, message: err.message || "Failed to fetch admins" });
    }
};

// Get single admin by ID
const getAdminById = async (req, res) => {
    const { id } = req.params;
    try {
        const admin = await adminService.getAdminById(id);
        res.status(200).json({ success: true, message: "Admin fetched successfully", data: admin });
    } catch (err) {
        res.status(404).json({ success: false, message: "Admin not found", error: err.message });
    }
};

// Get logged-in admin's own profile
const getMyProfile = async (req, res) => {
    const adminId = req.user?._id;
    if (!adminId) {
        return res.status(401).json({ success: false, message: "Unauthorized access" });
    }

    try {
        const admin = await adminService.getAdminByIdSelf(adminId);
        res.status(200).json({ success: true, message: "Admin profile", data: admin });
    } catch (err) {
        res.status(err.statusCode || 500).json({ success: false, message: "Failed to fetch profile", error: err.message });
    }
};

// Update admin profile (self)
const updateAdmin = async (req, res) => {
    const userId = req.user?._id;
    const { profileImage, name, mobile, address, about } = req.body;

    if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized access" });
    }

    try {
        const updatedAdmin = await adminService.updateAdmin(userId, {
            profileImage,
            name,
            mobile,
            address,
            about,
        });

        res.status(200).json({ success: true, message: "Admin profile updated", data: updatedAdmin });
    } catch (err) {
        res.status(err.statusCode || 500).json({ success: false, message: "Update failed", error: err.message });
    }
};

// Change another admin's status
const updateAdminStatus = async (req, res) => {
    const { id } = req.params;
    const updatedBy = req.user?._id;
    const { isActive } = req.body;

    if (!id || typeof isActive !== "boolean") {
        return res.status(400).json({ success: false, message: "'id' and 'isActive' boolean are required" });
    }

    try {
        const updatedAdmin = await adminService.updateStatus(id, updatedBy, isActive);
        res.status(200).json({
            success: true,
            message: `Admin status updated to ${isActive ? "Active" : "Inactive"}`,
            data: updatedAdmin,
        });
    } catch (err) {
        res.status(err.statusCode || 500).json({ success: false, message: "Status update failed", error: err.message });
    }
};

// Signin admin
const signin = async (req, res) => {
    const { email, password } = req.body;

    try {
        let user = await adminService.searchByEmail(email);
        if (!user) {
            return res.status(404).json({ success: false, message: "Invalid email or password" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: "Invalid email or password" });
        }

        user = await user.populate("role", "name");

        const token = jwtProvider.generateAdminToken(user._id, user.role);

        const isProd = process.env.NODE_ENV === "production";

        // Set cookies
        res.cookie("token", token, {
            httpOnly: true,
            secure: isProd,
            // sameSite: isProd ? "none" : "lax",
            maxAge: 24 * 60 * 60 * 1000, // 1 day
        });

        // These are not httpOnly so they can be accessed from frontend if needed
        res.cookie("user_name", user.name, {
            secure: isProd,
            // sameSite: isProd ? "none" : "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.cookie("user_email", user.email, {
            secure: isProd,
            // sameSite: isProd ? "none" : "lax",
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.status(200).json({
            success: true,
            message: "Login successful",
            data: {
                _id: user._id,
                email: user.email,
                role: {
                    _id: user.role._id,
                    name: user.role.name,
                },
                token,
            },
        });
    } catch (err) {
        res.status(500).json({ success: false, message: "Login failed", error: err.message });
    }
};

// Forget Password
const forgetPassword = async (req, res) => {
    const { email } = req.body;

    try {
        if (email) {
            // Check Email exist
            const adminExist = await adminService.searchByEmail(email);
            if (!adminExist) {
                return res.status(404).json({
                    success: false,
                    message: `No account found with email: ${email}`
                });
            }

            // Check if token exists and is still valid
            if (adminExist.resetPasswordToken && adminExist.resetPasswordTokenExpires) {
                if (adminExist.resetPasswordTokenExpires > Date.now()) {
                    return res.status(400).json({
                        success: false,
                        message: "Reset password email already sent",
                        error: "An token has already been sent. Please use that token or try again after 5 minutes."
                    });
                } else {
                    // Token expired — clear it
                    adminExist.resetPasswordToken = undefined;
                    adminExist.resetPasswordTokenExpires = undefined;
                    await adminExist.save();
                }
            }

            const token = crypto.randomBytes(32).toString('hex');;
            const resetPasswordExpire = new Date(Date.now() + Number(process.env.RESET_TOKEN_VALID_ADMIN));

            const isUpdateAdmin = await adminService.setPasswordResetToken(adminExist._id, token, resetPasswordExpire);
            if (!isUpdateAdmin) {
                return res.status(500).json({ success: false, message: "Error updating user with token" });
            }

            // Send Email
            const isEmailSent = await sendResetEmailAdmin(email, token);

            // If email is not sent
            if (!isEmailSent.success) {

                const updatedAdmin = await adminService.searchByEmail(email);
                updatedAdmin.resetPasswordToken = undefined;
                updatedAdmin.resetPasswordTokenExpires = undefined;

                const isDeletedTokenInformation = await updatedAdmin.save()
                if (!isDeletedTokenInformation) {
                    return res.status(500).json({ success: false, message: "Failed to clean up Token info" });
                }

                return res.status(502).json({ success: false, error: isEmailSent.error, message: isEmailSent.message });
            }

            return res.status(200).json({ success: true, message: "Token sent successfully to email." });
        } else {
            return res.status(400).json({ success: false, message: "Email is required" });
        }
    } catch (error) {
        return res.status(500).json({ success: false, error: "Internal server error", message: error.message });
    }
}

// Reset Password
const resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;

    try {
        const admin = await adminService.getAdminByToken(token);
        if (!admin) {
            return res.status(400).json({ success: false, message: "Invalid or expired token" });
        }

        // Hash and update the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        admin.password = hashedPassword;
        admin.resetPasswordToken = undefined;
        admin.resetPasswordTokenExpires = undefined;

        await admin.save();

        return res.status(200).json({ success: true, message: "Password has been reset successfully" });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message || "An error occurred" });
    }
};

// Logout admin
const logout = async (req, res) => {
    try {
        res.clearCookie("token", {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        });

        return res.status(200).json({
            success: true,
            message: "Logged out successfully",
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Logout failed",
            error: error.message,
        });
    }
};

// Soft delete admin
const deleteAdmin = async (req, res) => {
    try {
        const deleted = await adminService.deleteAdminById(req.params.id);
        if (!deleted) {
            return res.status(404).json({ success: false, message: "Admin not found or already deleted" });
        }

        res.status(200).json({ success: true, message: "Admin deleted (soft)" });
    } catch (err) {
        res.status(500).json({ success: false, message: "Delete failed", error: err.message });
    }
};

module.exports = {
    createAdmin,
    getAllAdmins,
    deleteAdmin,
    signin,
    updateAdmin,
    updateAdminStatus,
    getMyProfile,
    getAdminById,
    logout,
    forgetPassword,
    resetPassword
};