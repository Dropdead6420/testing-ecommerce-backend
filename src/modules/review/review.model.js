const mongoose = require("mongoose");

const reviewSchema = mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "products",
        required: true
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
        required: true,
    },
    review: {
        type: String,
        trim: true
    },
    isApproved: {
        type: Boolean,
        default: false,
    },
    approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Admin',
        default: null,
    },
}, { timestamps: true });

reviewSchema.index({ product: 1, user: 1 }, { unique: true });
reviewSchema.index({ product: 1, isApproved: 1 });

module.exports = mongoose.model("reviews", reviewSchema);