const mongoose = require("mongoose");
const Admin = require("./admin.model");
const bcrypt = require("bcrypt");

// Search admin by email
const searchByEmail = async (email) => {
    try {
        return await Admin.findOne({ email, isDeleted: false });
    } catch (error) {
        throw new Error("Error which searching admin: " + error)
    }
};

// Search admin by reset token
const getAdminByToken = async (token) => {
    try {
        const adminExist = await Admin.findOne({
            resetPasswordToken: token,
            resetPasswordTokenExpires: { $gt: Date.now() }
        });

        if (!adminExist) {
            const isAdminExist = await Admin.findOne({
                resetPasswordToken: token
            })

            // Check if user actually exists before accessing properties
            if (isAdminExist) {
                isAdminExist.resetPasswordToken = undefined;
                isAdminExist.resetPasswordTokenExpires = undefined;

                await isAdminExist.save();
            }

            // Return null to indicate token is invalid or expired
            return null;
        }

        return adminExist;
    } catch (error) {
        throw new Error("Error occur while getting user by token: " + error.message);
    }
}

// // Search admin by ID
const searchById = async (id) => {
    try {
        return await Admin.findOne({ _id: id, isDeleted: false }).populate("role");
    } catch (error) {
        throw new Error("Error which searching admin: " + error)
    }
};

// Create admin with hashed password
const createAdmin = async (data) => {
    try {
        data.password = await bcrypt.hash(data.password, await bcrypt.genSalt(10));
        const newAdmin = new Admin(data);
        const savedAdmin = await newAdmin.save();
        return await savedAdmin.populate("role");
    } catch (err) {
        throw new Error("Error creating admin: " + err.message);
    }
};

// Update current admin profile
const updateAdmin = async (adminId, data) => {
    try {
        const updated = await Admin.findOneAndUpdate(
            { _id: adminId, isDeleted: false },
            {
                profileImage: data.profileImage,
                name: data.name,
                mobile: data.mobile,
                address: data.address,
                about: data.about,
            },
            {
                new: true,
                runValidators: true,
            }
        ).populate("role");

        if (!updated) {
            const error = new Error("Admin not found");
            error.statusCode = 404;
            throw error;
        }

        return updated;
    } catch (error) {
        throw error;
    }
};

// Update status (active/inactive)
const updateStatus = async (adminId, updatedById, isActive) => {
    try {
        const updatedAdmin = await Admin.findOneAndUpdate(
            { _id: adminId, isDeleted: false },
            { isActive },
            { new: true }
        ).populate("role");

        if (!updatedAdmin) {
            const error = new Error("Admin not found");
            error.statusCode = 404;
            throw error;
        }

        return updatedAdmin;
    } catch (error) {
        throw error;
    }
};

// Get current admin's own profile
const getAdminByIdSelf = async (adminId) => {
    try {
        const admin = await Admin.findOne(
            { _id: adminId, isDeleted: false },
            "-password -__v"
        ).populate("role");

        if (!admin) throw new Error("Admin not found");
        return admin;
    } catch (error) {
        throw error;
    }
};

// Get any admin by ID (authorized access)
const getAdminById = async (adminId) => {
    const admin = await Admin.findOne(
        { _id: adminId, isDeleted: false },
        "-password -__v"
    ).populate("role");

    if (!admin) throw new Error("Admin not found");
    return admin;
};

// Get all admins with pagination + filter
const getAllAdmins = async (query = {}) => {
    const { page = 1, limit = 10, search = "", isActive, role } = query;

    if (role && !mongoose.Types.ObjectId.isValid(role)) {
        const error = new Error("Role must be an ID")
        error.statusCode = 400;
        throw error;
    }

    const filter = {
        isDeleted: false,
        ...(isActive !== undefined ? { isActive: isActive === "true" } : {}),
        ...(role ? { role } : {}),
        ...(search && {
            $or: [
                { name: new RegExp(search, "i") },
                { email: new RegExp(search, "i") },
            ],
        }),
    };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const projection = "-password -__v";

    const [admins, total] = await Promise.all([
        Admin.find(filter)
            .select(projection)
            .populate("role")
            .skip(skip)
            .limit(parseInt(limit)),
        Admin.countDocuments(filter),
    ]);

    return {
        data: admins,
        pagination: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / parseInt(limit)),
        },
    };
};

// Soft delete admin
const deleteAdminById = async (id) => {
    try {
        return await Admin.findOneAndUpdate(
            { _id: id, isDeleted: false },
            { isDeleted: true },
            { new: true }
        );
    } catch (error) {
        throw new Error("Error while deleting the admin: " + error.message)
    }
};

// Set password reset token in db
const setPasswordResetToken = async (adminId, token, expiry) => {
    try {
        const isTokenAdd = await Admin.findByIdAndUpdate(adminId, {
            resetPasswordToken: token,
            resetPasswordTokenExpires: expiry
        });
        return isTokenAdd;
    } catch (error) {
        throw new Error("Error occur while updating user table: " + error.message);
    }
};

module.exports = {
    createAdmin,
    getAllAdmins,
    deleteAdminById,
    searchByEmail,
    searchById,
    updateStatus,
    updateAdmin,
    getAdminById,
    getAdminByIdSelf,
    setPasswordResetToken,
    getAdminByToken
};