const mongoose = require("mongoose");

const cartItemSchema = mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true
    },
    cart: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "cart"
    },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "products",
        required: true
    },
    variantId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null
    },
    color: {
        type: String,
        default: null
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
        type: String,
        default: null
    }
}, {
    timestamps: true
})

const cartItem = mongoose.model("cartItems", cartItemSchema);
module.exports = cartItem;