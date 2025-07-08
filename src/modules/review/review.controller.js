const reviewService = require("./review.service.js");

const createReview = async (req, res) => {
    const userId = req.user._id;
    const { productId } = req.params;
    const { rating, review } = req.body;

    try {
        const savedReview = await reviewService.createReview(productId, userId, rating, review);

        if (!savedReview) {
            return res.status(400).json({ error: "Failed to save review" });
        }

        res.status(201).json({
            message: "Review submitted successfully",
            data: savedReview,
        });
    } catch (err) {
        res.status(err.statusCode || 500).json({ error: err.message });
    }
};

const approveReview = async (req, res) => {
    const { reviewId } = req.params;
    const approverId = req.user._id;

    try {
        const review = await reviewService.approveReview(approverId, reviewId);
        if (!review) {
            return res.status(404).json({ error: 'Review not found or already approved.' });
        }

        res.status(200).json({ message: 'Review approved.', review });
    } catch (error) {
        res.status(error.statusCode || 500).json({ error: error.message });
    }
};

const getAllReview = async (req, res) => {
    const productId = req.params.productId;

    try {
        const review = await reviewService.getAllReview(productId, req.query);
        return res.status(200).json(review);
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message });
    }
}

const updateReview = async (req, res) => {
    const { rating, review } = req.body;
    const { productId } = req.params;
    const userId = req.user._id;

    try {
        const isReviewUpdated = await reviewService.updateReview(productId, userId, rating, review);
        if (!isReviewUpdated) {
            return res.status(400).json({ error: "Failed to update review" });
        }

        return res.status(200).json({
            message: "Review updated successfully",
            data: isReviewUpdated
        })
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message });
    }
}

module.exports = { getAllReview, approveReview, createReview, updateReview }