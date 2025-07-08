const mongoose = require("mongoose");
const Review = require("./review.model.js");
const productModel = require("../product/product.model.js");
const productService = require("../product/product.service.js");
const Order = require("../order/order.model.js");

async function hasUserPurchasedProduct(userId, productId) {
    // Find orders for user with acceptable status
    const orders = await Order.find({
        user: userId,
        orderStatus: { $in: ["DELIVERED", "CONFIRMED"] }
    }).populate({
        path: "orderItems",
        match: { product: productId },
        select: "product"
    });

    // Check if any order has orderItems containing the product
    for (const order of orders) {
        if (order.orderItems && order.orderItems.length > 0) {
            return true;
        }
    }
    return false;
}

function createError(message, statusCode) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

async function createReview(productId, userId, rating, review) {
    try {
        // 1. Validate product existence
        const product = await productService.findProductById(productId);
        if (!product) {
            const error = new Error("Product not found");
            error.statusCode = 404;
            throw error;
        }

        // 2. Prevent duplicate review
        const [existingReview, purchased] = await Promise.all([
            Review.findOne({ product: productId, user: userId }),
            hasUserPurchasedProduct(userId, productId)
        ]);

        if (existingReview) throw createError("User has already reviewed this product", 400);
        if (!purchased) throw createError("User has not purchased this product", 403);

        // 3. Dynamically build review document
        const reviewData = {
            product: productId,
            user: userId,
            rating,
            isApproved: false,
        };

        if (review && typeof review === "string" && review.trim() !== "") {
            reviewData.review = review.trim();
        }

        const newReview = new Review(reviewData);
        const savedReview = await newReview.save();

        // 4. Recalculate review stats (only include approved if needed)
        const result = await Review.aggregate([
            {
                $match: {
                    product: new mongoose.Types.ObjectId(productId),
                    isApproved: true
                }
            },
            {
                $group: {
                    _id: "$product",
                    avgRating: { $avg: "$rating" },
                    count: { $sum: 1 },
                },
            },
        ]);

        const { avgRating = 0, count = 0 } = result[0] || {};

        // 5. Update product document
        await productModel.findByIdAndUpdate(productId, {
            $push: { reviews: savedReview._id },
            averageRating: avgRating,
            numRatings: count,
        });

        return await Review.findById(savedReview._id).select("rating review");
    } catch (error) {
        throw error;
    }
}

async function approveReview(approvalId, reviewId) {
    try {
        const existingReview = await Review.findById(reviewId);
        if (!existingReview) {
            const error = new Error("Review does not exist in our database.");
            error.statusCode = 400;
            throw error;
        }

        if (existingReview.isApproved) {
            const error = new Error("Review is already approved.");
            error.statusCode = 409;
            throw error;
        }

        await Review.findByIdAndUpdate(
            reviewId,
            {
                isApproved: true,
                approvedBy: approvalId,
                approvedAt: new Date(),
            },
            { new: true }
        );

        const result = await Review.aggregate([
            {
                $match: {
                    product: new mongoose.Types.ObjectId(existingReview.product),
                    isApproved: true
                }
            },
            {
                $group: {
                    _id: "$product",
                    avgRating: { $avg: "$rating" },
                    count: { $sum: 1 },
                },
            },
        ]);

        const { avgRating = 0, count = 0 } = result[0] || {};

        // 5. Update product document
        await productModel.findByIdAndUpdate(existingReview.product, {
            $push: { reviews: reviewId },
            averageRating: avgRating,
            numRatings: count,
        });

        return await Review.findById(reviewId)
            .select("isApproved approvedBy")
            .populate("approvedBy", "name email");
    } catch (error) {
        console.error("Error approving review:", error.message);
        throw error;
    }
}

async function getAllReview(productId, query) {
    try {
        const product = await productService.findProductById(productId);
        if (!product) {
            const error = new Error("Product not found")
            error.statusCode = 404;
            throw error;
        }

        const page = parseInt(query.page) || 1;
        const limit = parseInt(query.limit) || 10;
        const skip = (page - 1) * limit;

        const reviews = await Review.find({ product: productId, isApproved: true })
            .select("rating review")
            .populate({ path: "user", select: "firstName" })
            .skip(skip)
            .limit(limit)
            .lean();

        const total = await Review.countDocuments({ product: productId, isApproved: true });

        return {
            message: "Fetched reviews",
            data: reviews,
            meta: { total, page, limit }
        };
    } catch (error) {
        throw error;
    }
}

async function updateReview(productId, userId, rating, review) {
    try {
        // Check if review exists
        const existingReview = await Review.findOne({ product: productId, user: userId });

        if (!existingReview) {
            const error = new Error("Review not found for this product and user");
            error.statusCode = 404;
            throw error;
        }
        if (existingReview.review) {
            const error =new Error("Now allow to update the review");
            error.statusCode = 400;
            throw error;
        }

        // Update the fields
        existingReview.rating = rating;
        existingReview.review = review;
        existingReview.updatedAt = new Date();

        // Save changes
        const updatedReview = await existingReview.save();

        return updatedReview;
    } catch (error) {
        throw error;
    }
}

module.exports = { createReview, approveReview, getAllReview, updateReview }