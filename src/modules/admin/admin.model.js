const mongoose = require("mongoose");

const adminSchema = new mongoose.Schema(
    {
        profileImage: {
            type: String,
            trim: true,
        },
        about: {
            type: String,
            trim: true,
        },
        mobile: {
            type: String,
            trim: true,
        },
        address: {
            type: String,
            trim: true,
        },
        name: {
            type: String,
            required: [true, "Name is required"],
            trim: true,
            minlength: [2, "Name must be at least 2 characters"],
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/.+\@.+\..+/, "Please enter a valid email address"],
            index: true,
        },
        password: {
            type: String,
            required: [true, "Password is required"],
            minlength: [6, "Password must be at least 6 characters"],
        },
        role: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "roles",
            required: true,
        },
        resetPasswordToken: {
            type: String
        },
        resetPasswordTokenExpires: {
            type: Date
        },
        isActive: {
            type: Boolean,
            default: false,
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("Admin", adminSchema);
