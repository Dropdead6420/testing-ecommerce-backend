const cartService = require("./cart.service.js");

const findUserCart = async (req, res, next) => {
    const userId = req.user._id;
    if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized: User not authenticated" });
    }

    try {
        const cart = await cartService.findUserCart(userId);
        return res.status(200).json({ success: true, message: "User cart", data: cart });
    } catch (error) {
        next(error);
    }
}

const addItemToCart = async (req, res, next) => {
    const userId = req.user?._id;
    if (!userId) {
        return res.status(401).json({ success: false, error: "Unauthorized: User not authenticated" });
    }

    try {
        const cart = await cartService.addCartItem(userId, req.body);
        return res.status(200).json({ success: true, message: cart });
    } catch (error) {
        next(error);
    }
}

const updateCartQuantity = async (req, res, next) => {
    const userId = req.user._id;
    const cartItemId = req.params.id;
    if (!cartItemId) {
        return res.status(400).json({
            success: false,
            message: "Cart item ID is required in the URL parameters.",
            error: "Bad Request"
        });
    } else if (!cartItemId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({
            success: false,
            message: "Invalid cart item ID format",
            error: "Bad Request"
        });
    }

    try {
        const updatedCartItem = await cartService.updateCartQuantity(userId, cartItemId, req.body.quantity);
        return res.status(200).json({
            success: true,
            message: "Cart item updated successfully",
            data: updatedCartItem
        });
    } catch (error) {
        next(error);
    }
}

const removeCartItem = async (req, res, next) => {
    const userId = await req.user._id;
    const cartItemId = req.params.id;
    if (!cartItemId) {
        return res.status(400).json({ success: false, message: "Cart item Id is not present in params" });
    }

    try {
        await cartService.removeCartItem(userId, cartItemId);
        return res.status(200).send({ success: true, message: "Cart item removed successfully" });
    } catch (error) {
        next(error);
    }
}

module.exports = { findUserCart, addItemToCart, updateCartQuantity, removeCartItem }