const mongoose = require("mongoose");

const orderSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users"
    },
    shippingAddress: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "addresses"
    },
    orderDate: {
        type: Date,
        required: true,
        default: Date.now
    },
    orderStatus: {
        type: String,
        required: true,
        default: "PENDING",
        enum: [
            "PENDING",
            "PLACED",
            "CONFIRMED",
            "SHIPPED",
            "DELIVERED",
            "CANCELLED",
        ]
    },
    orderItems: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "orderItems"
    }],
    totalPrice: {
        type: Number,
        required: true
    },
    totalItem: {
        type: Number,
        required: true
    },
    deliveryDate: {
        type: Date
    },
    paymentDetails: {
        paymentMethod: {
            type: String
        },
        transactionId: {
            type: String
        },
        paymentId: {
            type: String
        },
        paymentStatus: {
            type: String,
            default: "Pending"
        }
    },

}, {
    timestamps: true
})

const order = mongoose.model("orders", orderSchema);
module.exports = order;