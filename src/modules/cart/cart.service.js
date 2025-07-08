const Cart = require("./cart.model");
const CartItems = require("./cartItem.model");
const productService = require("../product/product.service");
const Product = require("../product/product.model");

const getUserCart = async (userId) => {
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
        cart = await createCart(userId);
    }
    return cart;
};

const createCart = async (user) => {
    try {
        const cart = new Cart({ user });

        const createdCart = await cart.save();

        return createdCart;
    } catch (error) {
        throw new Error(error.message);
    }
};

async function findUserCart(userId) {
    try {
        let cart = await getUserCart(userId);

        // Get all cart items with populated product details
        let cartItems = await CartItems.find({ cart: cart._id })
            .select("color discountedPrice variantId quantity size product")
            .populate({
                path: "product",
                select: "name price discountedPrice discountPercent image variation_options"
            });

        // Calculate totals
        let totalPrice = 0;
        let totalItem = 0;
        const validCartItems = [];

        for (let cartItem of cartItems) {
            const product = cartItem.product;

            // If the product was deleted, remove the cart item
            if (!product) {
                await CartItems.deleteOne({ _id: cartItem._id });

                // Remove from cart.cartItems array
                cart.cartItems = cart.cartItems.filter(
                    (itemId) => itemId.toString() !== cartItem._id.toString()
                );
                continue;
            }

            // Determine final price (variant-aware)
            let finalPrice = product.discountedPrice || product.price;

            // If the product has variants
            if (cartItem.variantId && product.variation_options?.length > 0) {
                const selectedVariant = product.variation_options.find(
                    (v) => v._id.toString() === cartItem.variantId.toString()
                );

                if (selectedVariant) {
                    finalPrice = selectedVariant.discountedPrice || selectedVariant.price;
                }
            }

            const itemTotal = finalPrice * cartItem.quantity;

            // Update price info on cartItem (if changed)
            if (cartItem.discountedPrice !== itemTotal) {
                cartItem.discountedPrice = itemTotal;
                await cartItem.save();
            }

            totalPrice += itemTotal;
            totalItem += cartItem.quantity;

            validCartItems.push(cartItem._id);
        }

        // Update cart totals and save
        cart.cartItems = validCartItems;
        cart.totalPrice = totalPrice;
        cart.totalItem = totalItem;

        await cart.save();

        // Attach full populated cartItems for response
        const populatedCartItems = await CartItems.find({ _id: { $in: validCartItems } })
            .select("-createdAt -updatedAt -__v")
            .populate({
                path: "product",
                select: "name price discountedPrice discountPercent image variation_options"
            });

        // Attach populated items for return
        const cartObj = cart.toObject();
        cartObj.cartItems = populatedCartItems;

        return cartObj;
    } catch (error) {
        throw error;
    }
}

async function addCartItem(userId, req) {
    try {
        const { productId, variantId, size, color, quantity: reqQuantity = 1 } = req;

        const cart = await getUserCart(userId);
        const product = await productService.findProductById(productId);

        if (!product) {
            const error = new Error("Product not found");
            error.statusCode = 404;
            throw error;
        }

        let selectedVariant = null;
        let selectedSize = null;
        let finalPrice = product.discountedPrice || product.price;

        // Construct query for checking if item is already in cart
        const cartItemQuery = {
            cart: cart._id,
            product: product._id,
            userId,
        };

        const cartItem = new CartItems({
            product: product._id,
            cart: cart._id,
            userId
        });

        // Handle variant logic (if applicable)
        if (product.variation_options && product.variation_options.length > 0) {
            if (!variantId) {
                const error = new Error("Please select variant of product");
                error.statusCode = 400;
                throw error;
            }

            selectedVariant = product.variation_options.find(variant =>
                variant._id.toString() === variantId
            );

            if (!selectedVariant) {
                const error = new Error("Product variant does not exist");
                error.statusCode = 404;
                throw error;
            }

            cartItemQuery.variantId = variantId;
            cartItem.variantId = variantId;

            // Check color match
            if (color) {
                if (!selectedVariant.color.includes(color)) {
                    const error = new Error(`Color "${color}" is not available in this variant`);
                    error.statusCode = 404;
                    throw error;
                }

                cartItemQuery.color = color;
                cartItem.color = color;
            }

            // Check size
            if (!size) {
                const error = new Error("Please choose the size of the variant of the product");
                error.statusCode = 400;
                throw error;
            }

            selectedSize = selectedVariant.sizes.find(s => s.name === size);
            if (!selectedSize || selectedSize.quantity < reqQuantity) {
                const error = new Error(`Size "${size}" is not available in the selected variant or insufficient quantity`);
                error.statusCode = 400;
                throw error;
            }

            cartItemQuery.size = size;
            cartItem.size = size;

            finalPrice = selectedVariant.discountedPrice || selectedVariant.price;
        } else {
            // Non-variant product check
            if (product.quantity < reqQuantity) {
                const error = new Error("Requested quantity exceeds available stock");
                error.statusCode = 400;
                throw error;
            }
        }

        // Check for existing cart item
        const isPresentCartItem = await CartItems.findOne(cartItemQuery);
        if (isPresentCartItem) {
            const error = new Error("Item already in cart");
            error.statusCode = 409;
            throw error;
        }

        const quantity = Number(reqQuantity);
        const totalDiscountedPrice = Number(finalPrice) * quantity;

        cartItem.quantity = quantity;
        cartItem.discountedPrice = totalDiscountedPrice;

        const createdCartItem = await cartItem.save();

        // Update cart totals
        cart.totalPrice += totalDiscountedPrice;
        cart.totalItem += quantity;
        cart.cartItems.push(createdCartItem._id);
        await cart.save();

        return "Item added to cart";
    } catch (error) {
        throw error;
    }
}

async function updateCartQuantity(userId, cartItemId, cartQuantity) {
    try {
        const item = await CartItems.findOne({ userId, _id: cartItemId }).populate("product");
        if (!item) {
            const error = new Error("Cart item not found")
            error.statusCode = 404;
            throw error
        }

        if (item.quantity + cartQuantity < 1) {
            const error = new Error("Cart item quantity must be at least 1");
            error.statusCode = 400;
            throw error;
        }

        item.quantity = item.quantity + Number(cartQuantity);
        item.discountedPrice = item.quantity * item.product.discountedPrice;
        const updatedCartItem = await item.save();

        // Aggregate to update parent cart
        const cartId = item.cart;
        const result = await CartItems.aggregate([
            { $match: { cart: cartId } },
            {
                $group: {
                    _id: "$cart",
                    totalQuantity: { $sum: "$quantity" },
                    totalPrice: { $sum: "$discountedPrice" }
                }
            }
        ]);

        if (result.length > 0) {
            const { totalQuantity, totalPrice } = result[0];
            await Cart.findByIdAndUpdate(cartId, {
                totalItem: totalQuantity,
                totalPrice
            });
        }

        return updatedCartItem;
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
            error.message = "Internal server error: " + error.message;
        }
        throw error;
    }
}

async function removeCartItem(userId, cartItemId) {
    try {
        const cartItem = await CartItems.findOne({ userId, _id: cartItemId });

        if (!cartItem) {
            const error = new Error("Cart item not found with the provided ID.");
            error.statusCode = 404;
            throw error;
        }

        const cart = await Cart.findOne({ user: userId });
        if (!cart) {
            const error = new Error("Cart not found for user.");
            error.statusCode = 404;
            throw error;
        }

        cart.totalPrice = cart.totalPrice - (cartItem.discountedPrice * cartItem.quantity);
        cart.totalItem = cart.totalItem - cartItem.quantity;
        cart.cartItems = cart.cartItems.filter(
            itemId => itemId.toString() !== cartItemId.toString()
        );

        await cart.save();

        const deletedItem = await CartItems.findByIdAndDelete(cartItemId);
        return deletedItem;
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
            error.message = "Failed to remove cart item: " + error.message;
        }
        throw error;
    }
}

module.exports = { createCart, addCartItem, findUserCart, updateCartQuantity, removeCartItem };