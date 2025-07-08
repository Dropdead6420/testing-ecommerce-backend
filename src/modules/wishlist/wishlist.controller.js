const wishlistService = require("./wishlist.service");

const addToWishlist = async (req, res) => {
    const userId = req.user?._id;
    const productId = req.body?.product;

    if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    if (!productId) {
        return res.status(400).json({ error: "Product ID is required" });
    }

    try {
        const isWishlistAdd = await wishlistService.addToWishlist(userId, productId);

        return res.status(201).json({
            message: "Add to wishlist",
            data: isWishlistAdd
        })
    } catch (error) {
        return res.status(error.statusCode || 500).json({
            error: error.message
        })
    }
}

const getByUser = async (req, res) => {
    const userId = req.user?._id;
    if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        const wishlist = await wishlistService.getByUser(userId);
        return res.status(200).json({
            message: wishlist.length === 0
                ? "Your wishlist is currently empty."
                : "Wishlist retrieved successfully.",
            data: wishlist,
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message });
    }
};

const removeProduct = async (req, res) => {
    const userId = req.user?._id;
    const productId = req.body?.product;

    if (!productId) {
        return res.status(400).json({ error: "Product ID is required" });
    }

    try {
        const result = await wishlistService.removeProduct(userId, productId);
        return res.status(200).json({ message: "Product removed from wishlist", data: result });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message });
    }
};

const getByAdmin = async (req, res) => {
    try {
        const allWishlists = await wishlistService.getAllWishlists();
        return res.status(200).json({ message: "Retrieved all wishlist", data: allWishlists });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ error: error.message });
    }
};

module.exports = {
    addToWishlist,
    getByUser,
    removeProduct,
    getByAdmin,
};