const mongoose = require("mongoose");

const validateCartItem = (req, res, next) => {
    const { productId, quantity, size } = req.body;

    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({
            message: "Invalid Product ID",
            error: "Bad Request"
        });
    }

    if (quantity) {
        return res.status(400).json({ success: false, message: "Not allow quantity value", error: "Bad Request" });
    }

    if (size && typeof size !== "string") {
        return res.status(400).json({ success: false, message: "Invalid size value", error: "Bad Request" });
    }

    next();
};

const validateQuantityUpdate = (req, res, next) => {
    const { quantity } = req.body;

    // Only allow 'quantity' in the body
    const keys = Object.keys(req.body);
    if (keys.length !== 1 || !keys.includes("quantity")) {
        return res.status(400).json({
            success: false,
            message: "Only 'quantity' field is allowed for update",
            error: "Invalid Request Body"
        });
    }

    // Validate 'quantity'
    if (typeof quantity !== "number" || isNaN(quantity)) {
        return res.status(400).json({
            success: false,
            message: "'quantity' must be a number",
            error: "Validation Error"
        });
    }

    next();
};

module.exports = { validateCartItem, validateQuantityUpdate }