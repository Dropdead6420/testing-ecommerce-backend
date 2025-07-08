const wishlistModel = require("./wishlist.model");
const userModel = require("../user/user.model");
const productService = require("../product/product.service");
const mongoose = require("mongoose");

const validateMongoObjectId = (id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
        const error = new Error("Invalid ID format provided.")
        error.statusCode = 400;
        throw error;
    }
};

const addToWishlist = async (userId, productId) => {
    try {
        validateMongoObjectId(productId);

        // 1. Validate product
        const isProductExist = await productService.findProductById(productId);
        if (!isProductExist) {
            const error = new Error("Product not found");
            error.statusCode = 404;
            throw error;
        }

        // 2. Check if already in wishlist (Wishlist collection)
        const isExistWishlist = await wishlistModel.findOne({ user: userId, product: productId });
        if (isExistWishlist) {
            const error = new Error("This product is already in your wishlist.");
            error.statusCode = 400;
            throw error;
        }

        // 3. Update User model's wishlist (optional, only if you're syncing both)
        const user = await userModel.findById(userId);
        if (!user.wishlist.includes(productId)) {
            user.wishlist.push(productId);
            await user.save();
        }

        // 4. Save to Wishlist collection
        const saved = await wishlistModel.create({
            user: userId,
            product: productId,
        });

        return saved;
    } catch (error) {
        throw error;
    }
}

const getByUser = async (userId) => {
    const wishlist = await wishlistModel.find({ user: userId }).populate({
        path: "product",
        select: "-__v"
    }).select("product");

    // Extract just the product documents
    const products = wishlist
        .map(entry => entry.product)
        .filter(product => product !== null);

    return {
        products,
        total: products.length
    };
};

const removeProduct = async (userId, productId) => {
    validateMongoObjectId(productId);

    // Remove from wishlist collection
    const removed = await wishlistModel.findOneAndDelete({ user: userId, product: productId });
    if (!removed) {
        const error = new Error('Product not found in wishlist or already removed.');
        error.statusCode = 400;
        throw error;
    }

    // Remove from user model
    await userModel.findByIdAndUpdate(userId, {
        $pull: { wishlist: productId }
    });

    return removed;
};

const getAllWishlists = async () => {
    return await wishlistModel.aggregate([
        {
            $lookup: {
                from: "users",
                let: { userId: "$user" },
                pipeline: [
                    { $match: { $expr: { $eq: ["$_id", "$$userId"] } } },
                    { $project: { _id: 1, firstName: 1, email: 1 } }
                ],
                as: "user"
            }
        },
        { $unwind: "$user" },

        {
            $lookup: {
                from: "products",
                let: { productId: "$product" },
                pipeline: [
                    { $match: { $expr: { $eq: ["$_id", "$$productId"] } } },
                    { $project: { _id: 1, name: 1, discountedPrice: 1 } }
                ],
                as: "product"
            }
        },
        { $unwind: "$product" },

        {
            $group: {
                _id: "$user._id",
                name: { $first: "$user.firstName" },
                email: { $first: "$user.email" },
                wishlist: {
                    $push: {
                        _id: "$product._id",
                        title: "$product.name",
                        price: "$product.discountedPrice"
                    }
                }
            }
        },

        { $sort: { name: 1 } }
    ]);
};

module.exports = {
    addToWishlist,
    getByUser,
    removeProduct,
    getAllWishlists,
};