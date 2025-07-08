const mongoose = require("mongoose");

const addressSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: [true, "User ID is required"],
        index: true
    },
    firstName: {
        type: String,
        required: [true, "First name is required"],
        trim: true,
        maxlength: [50, "First name must not exceed 50 characters"]
    },
    lastName: {
        type: String,
        trim: true
    },
    mobile: {
        type: String,
        required: [true, "Mobile number is required"],
        match: [/^\d{8,15}$/, "Mobile number must be between 8 to 15 digits"],
        index: true
    },
    streetAddress: {
        type: String,
        required: [true, "Street address is required"],
        trim: true,
        maxlength: [255, "Street address must not exceed 255 characters"]
    },
    city: {
        type: String,
        required: [true, "City is required"],
        trim: true,
        maxlength: [100, "City name must not exceed 100 characters"]
    },
    state: {
        type: String,
        required: [true, "State is required"],
        trim: true,
        maxlength: [100, "State name must not exceed 100 characters"]
    },
    zipCode: {
        type: String,
        required: [true, "Zip code is required"],
        trim: true,
        match: [/^\d{5,6}$/, "Zip code must be 5 or 6 digits"]
    },
    country: {
        type: String,
        default: "India",
        trim: true
    },
    isDefault: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

addressSchema.index({ user: 1, isDefault: -1 });

module.exports = mongoose.model("addresses", addressSchema);