const mongoose = require("mongoose");

const orderItemSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "products",
        required: true
    },
    discountedPrice: {
        type: Number,
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        default: 1
    },
    size: {
        type: String
    }
})

const orderItems = mongoose.model("orderItems", orderItemSchema)
module.exports = orderItems;