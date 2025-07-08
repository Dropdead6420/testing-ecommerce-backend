const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: false,
    },
    permissions: [{
        type: String,
        enum: [
            "view-user",
            "update-user",

            "add-role",
            "view-role",
            "edit-role",
            "delete-role",

            "add-admin",
            "view-admin",
            "delete-admin",
            "change-admin-status",

            "add-product",
            "update-product",

            "update-address",

            "view-order",
            "update-order-status",
            "delete-order",

            "approve-review",

            "view-wishlist",

            "add-category",
            "update-category",
            "delete-category",

            "view-dashboard",
        ],
        required: true,
    }],
}, {
    timestamps: true,
});

module.exports = mongoose.model("roles", roleSchema);
