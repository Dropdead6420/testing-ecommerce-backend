const cartService = require("../cart/cart.service.js")
const Order = require("./order.model.js")
const Address = require("../address/address.model.js")
const OrderItem = require("../order/orderItems.model.js")

async function createOrder(user, shipAddress) {
    let address;

    if (shipAddress._id) {
        let existAddress = await Address.findById(shipAddress._id);
        if (!existAddress) {
            const error = new Error("Provided address not found");
            error.statusCode = 404;
            throw error;
        }

        address = existAddress;
    } else {
        address = new Address({ ...shipAddress, user: user._id });
        await address.save();

        // Attach new address to user
        user.addresses.push(address._id);
        await user.save();
    }

    const cart = await cartService.findUserCart(user._id);
    if (!cart || !cart.cartItems || cart.cartItems.length === 0) {
        const error = new Error("Cart is empty");
        error.statusCode = 400;
        throw error;
    }

    const orderItems = [];

    for (const item of cart.cartItems) {
        const product = item.product;

        // 1. Remove invalid cart item if product not found
        if (!product) {
            await cartService.removeCartItem(user._id, item._id);
        }

        // 2. Check product stock before processing
        if (product.quantity < item.quantity) {
            const error = new Error(`Insufficient stock for product: ${product.name}`);
            error.statusCode = 400;
            throw error;
        }

        // 3. Create valid order item
        const orderItem = new OrderItem({
            product,
            quantity: item.quantity,
            userId: item.userId,
            size: item.size,
            discountedPrice: item.discountedPrice * item.quantity,
        })

        const createdOrderItem = await orderItem.save();
        await cartService.removeCartItem(user._id, item._id);
        orderItems.push(createdOrderItem)
    }

    const createdOrder = new Order({
        user, orderItems, totalPrice: cart.totalPrice,
        totalItem: cart.totalItem, shippingAddress: address
    })

    const savedOrder = await createdOrder.save();

    return savedOrder;
}

async function placeOrder(orderId) {
    const order = await findOrderById(orderId);

    order.orderStatus = "PLACED";
    order.paymentDetails.status = "COMPLETED";

    return await order.save();
}

async function confirmedOrder(orderId) {
    try {
        const order = await fetchedOrderStatus(orderId);

        if (["CONFIRMED", "DELIVERED", "CANCELLED"].includes(order.orderStatus)) {
            const error = new Error(`Cannot confirm an order that is already ${order.orderStatus}`);
            error.statusCode = 400;
            throw error;
        }

        order.orderStatus = "CONFIRMED";
        return await order.save();

    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
            error.message = "Failed to cancel order: " + error.message;
        }
        throw error;
    }
}

async function shipOrder(orderId) {
    try {
        const order = await fetchedOrderStatus(orderId);

        // Prevent shipping if already shipped, delivered, or cancelled
        if (["SHIPPED", "DELIVERED", "CANCELLED"].includes(order.orderStatus)) {
            const error = new Error(`Cannot ship an order that is already ${order.orderStatus}`);
            error.statusCode = 400;
            throw error;
        }

        order.orderStatus = "SHIPPED";
        return await order.save();
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
            error.message = "Failed to cancel order: " + error.message;
        }
        throw error;
    }
}

async function deliverOrder(orderId) {
    try {
        const order = await Order.findById(orderId).select("orderStatus deliveryDate");
        if (!order) {
            const error = new Error("Order not found");
            error.statusCode = 404;
            throw error;
        }

        if (["DELIVERED", "CANCELLED"].includes(order.orderStatus)) {
            const error = new Error(`Cannot mark as delivered. Current status: ${order.orderStatus}`);
            error.statusCode = 400;
            throw error;
        }

        order.orderStatus = "DELIVERED";
        order.deliveryDate = new Date();

        return await order.save();
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
            error.message = "Failed to cancel order: " + error.message;
        }
        throw error;
    }
}

async function cancelOrder(orderId) {
    try {
        const order = await fetchedOrderStatus(orderId);

        // Prevent cancellation if already cancelled or delivered
        if (["CANCELLED", "DELIVERED"].includes(order.orderStatus)) {
            const error = new Error(`Order cannot be cancelled, current status: ${order.orderStatus}`);
            error.statusCode = 400;
            throw error;
        }

        order.orderStatus = "CANCELLED";
        return await order.save();
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
            error.message = "Failed to cancel order: " + error.message;
        }
        throw error;
    }
}

async function fetchedOrderStatus(orderId) {
    const orderStatus = await Order.findById(orderId).select("orderStatus");
    if (!orderStatus) {
        const error = new Error("Order not found");
        error.statusCode = 404;
        throw error;
    }

    return orderStatus
}

async function findOrderById(orderId) {
    const order = await Order.findById(orderId)
        .populate({
            path: "user",
            select: "firstName lastName email"
        })
        .populate({
            path: "orderItems",
            select: "-userId -_id -__v",
            populate: {
                path: "product",
                select: "title brand color images category"
            }
        })
        .populate({
            path: "shippingAddress",
            select: "-_id -user -isDefault -createdAt -updatedAt -__v"
        })
        .lean();

    if (!order) {
        const error = new Error("Order not found");
        error.statusCode = 404;
        throw error;
    }

    return order;
}

async function usersOrderHistory(userId, filter) {
    try {
        const { orderStatus } = filter
        const query = { user: userId };
        if (orderStatus) {
            query.orderStatus = { $regex: new RegExp(`^${orderStatus}$`, "i") };
        }

        const orders = await Order.find(query)
            .select("orderItems shippingAddress totalPrice totalItem createdAt deliveryDate orderStatus")
            .populate({
                path: "orderItems",
                select: "-userId -_id -__v",
                populate: {
                    path: "product",
                    select: "title brand color images category",
                    populate: {
                        path: "category",
                        select: "-_id -__v "
                    }
                }
            })
            .populate({
                path: "shippingAddress",
                select: "-_id -user -isDefault -createdAt -updatedAt -__v"
            })
            .sort({ createdAt: -1 })
            .lean();

        return orders;
    } catch (error) {
        const err = new Error("Error fetching order history: " + error.message);
        err.statusCode = 500;
        throw err;
    }
}

async function deleteOrder(orderId) {
    try {
        const order = await Order.findById(orderId);

        if (!order) {
            const error = new Error("Order not found");
            error.statusCode = 404;
            throw error;
        }

        // Delete associated orderItems
        if (order.orderItems && order.orderItems.length > 0) {
            await OrderItem.deleteMany({ _id: { $in: order.orderItems } });
        }

        // Delete the order itself
        await Order.findByIdAndDelete(orderId);

        return {
            message: "Order and its associated order items deleted successfully",
            data: orderId,
        };
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
            error.message = "Failed to delete order: " + error.message;
        }
        throw error;
    }
}

async function getAllOrders({ orderStatus, userId, from, to, page = 1, limit = 10 }) {
    try {
        const query = {};

        if (orderStatus) {
            query.orderStatus = { $regex: new RegExp(`^${orderStatus}$`, "i") };
        }

        if (userId) {
            query.user = userId;
        }

        if (from || to) {
            query.createdAt = {};
            if (from) query.createdAt.$gte = new Date(from);
            if (to) query.createdAt.$lte = new Date(to);
        }

        const skip = (page - 1) * limit;

        const [orders, total] = await Promise.all([
            Order.find(query)
                .select("-__v -shippingAddress -createdAt -updatedAt")
                .populate({ path: "user", select: "-_id firstName" })
                .populate({
                    path: "orderItems",
                    select: "-userId -__v -_id -discountedPrice -quantity -size",
                    populate: {
                        path: "product",
                        select: "name image -_id numRatings"
                    }
                })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit)
                .lean(),
            Order.countDocuments(query)
        ]);

        return { orders, total };
    } catch (error) {
        const err = new Error("Error fetching orders: " + error.message);
        err.statusCode = 500;
        throw err;
    }
}

module.exports = { createOrder, placeOrder, confirmedOrder, shipOrder, deleteOrder, cancelOrder, deliverOrder, findOrderById, usersOrderHistory, deleteOrder, getAllOrders };