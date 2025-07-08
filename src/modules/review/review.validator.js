const mongoose = require('mongoose');

const validateReview = (req, res, next) => {
    const { rating, review } = req.body;
    const { productId } = req.params;

    // Check for valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ error: 'Invalid product ID.' });
    }

    // Check rating
    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Rating must be a number between 1 and 5.' });
    }

    // Check review if exists
    if (review && typeof review !== 'string') {
        return res.status(400).json({ error: 'Review must be a string.' });
    }

    next();
};

const validateGetAllReview = (req, res, next) => {
    const { productId } = req.params;

    if (!productId) {
        return res.status(400).json({ error: "Product Id is required" });
    }

    if (!/^[0-9a-fA-F]{24}$/.test(productId)) {
        return res.status(400).json({ error: "Invalid Product Id format" });
    }

    next();
}

const validateReviewForUpdate = (req, res, next) => {
    const { rating, review } = req.body;
    const { productId } = req.params;

    // Check for valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({ error: 'Invalid product ID.' });
    }

    // Check rating
    if (typeof rating !== 'number' || rating < 1 || rating > 5) {
        return res.status(400).json({ error: 'Rating must be a number between 1 and 5.' });
    }

    // Check review if exists
    if (!review || typeof review !== 'string') {
        return res.status(400).json({ error: 'Review must be a string.' });
    }

    next();
};

module.exports = { validateReview, validateGetAllReview, validateReviewForUpdate };
