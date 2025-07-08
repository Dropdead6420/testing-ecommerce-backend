const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: [true, "First name is required"],
        trim: true
    },
    lastName: {
        type: String,
        required: [true, "Last name is required"],
        trim: true
    },
    password: {
        type: String,
        required: [true, "Password is required"],
        minlength: [6, "Password must be at least 6 characters"],
        trim: true
    },
    email: {
        type: String,
        required: [true, "Email is required"],
        unique: true,
        trim: true,
        lowercase: true,
        match: [
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            "Please fill a valid email address"
        ]
    },
    resetPasswordToken: {
        type: String
    },
    resetPasswordTokenExpires: {
        type: Date
    },
    mobile: {
        type: Number,
    },
    addresses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "addresses"
    }],
    paymentInformation: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "payment_information"
    }],
    ratings: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "ratings"
    }],
    reviews: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "reviews"
    }],
    wishlist: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "products"
    }]
}, {
    timestamps: true
})

const User = mongoose.model("users", userSchema);
module.exports = User;