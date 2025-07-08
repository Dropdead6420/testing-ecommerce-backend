const orderService = require("./order.service.js");

const createOrder = async (req, res, next) => {
    const user = await req.user;
    if (!user) {
        return res.status(401).json({ success: false, message: "Unauthorized: User not found" });
    }

    try {
        let createdOrder = await orderService.createOrder(user, req.body);
        return res.status(201).json({ success: true, message: "Order created", data: createdOrder });
    } catch (error) {
        next(error);
    }
}

const orderHistory = async (req, res, next) => {
    const userId = req.user._id;
    if (!userId) {
        return res.status(401).json({ success: false, message: "Unauthorized: User not found" });
    }

    try {
        let yourOrders = await orderService.usersOrderHistory(userId, req.query);
        return res.status(200).json({ success: true, message: "Order fetched", data: yourOrders });
    } catch (error) {
        next(error);
    }
}

const findOrderById = async (req, res, next) => {
    try {
        const order = await orderService.findOrderById(req.params.id);
        return res.status(200).json({
            success: true,
            message: "Order fetched successfully",
            data: order
        });
    } catch (error) {
        next(error);
    }
};

const cancelledOrders = async (req, res, next) => {
    const orderId = req.params.orderId;
    if (!orderId) {
        return res.status(400).json({ success: false, message: "Order ID is required" });
    }

    try {
        const cancelledOrder = await orderService.cancelOrder(orderId);
        return res.status(200).json({
            success: true,
            message: "Order cancelled successfully",
            data: cancelledOrder,
        });
    } catch (error) {
        next(error);
    }
};

const getAllOrders = async (req, res, next) => {
    try {
        const filters = {
            orderStatus: req.query.orderStatus,
            userId: req.query.userId,
            from: req.query.from,
            to: req.query.to,
            page: parseInt(req.query.page) || 1,
            limit: parseInt(req.query.limit) || 10,
        };

        const result = await orderService.getAllOrders(filters);

        return res.status(200).json({
            success: true,
            message: "Orders fetched successfully",
            data: result.orders,
            meta: {
                total: result.total,
                page: filters.page,
                limit: filters.limit,
                totalPages: Math.ceil(result.total / filters.limit),
            }
        });
    } catch (error) {
        next(error);
    }
};

const confirmedOrders = async (req, res, next) => {
    const orderId = req.params.orderId;
    if (!orderId) {
        return res.status(400).json({ success: false, message: "Order Id is not present" });
    }

    try {
        const updatedOrder = await orderService.confirmedOrder(orderId);
        return res.status(200).json({
            success: true,
            message: "Order confirmed successfully",
            data: updatedOrder,
        });
    } catch (error) {
        next(error);
    }
};

const shipOrders = async (req, res, next) => {
    const orderId = req.params.orderId;
    if (!orderId) {
        return res.status(400).json({ success: false, message: "Order Id is not present" });
    }

    try {
        const updatedOrder = await orderService.shipOrder(orderId);
        return res.status(200).json({
            success: true,
            message: "Order shipped successfully",
            data: updatedOrder,
        });
    } catch (error) {
        next(error);
    }
};

const deliverOrders = async (req, res, next) => {
    const orderId = req.params.orderId;
    if (!orderId) {
        return res.status(400).json({ error: "Order Id is not present" });
    }

    try {
        const updatedOrder = await orderService.deliverOrder(orderId);
        return res.status(200).json({
            message: "Order marked as delivered",
            data: updatedOrder,
        });
    } catch (error) {
        next(error);
    }
};

const deleteOrders = async (req, res, next) => {
    const orderId = req.params.orderId;
    if (!orderId) {
        return res.status(400).json({ error: "Order ID is required" });
    }

    try {
        const result = await orderService.deleteOrder(orderId);
        return res.status(200).json(result);
    } catch (error) {
        next(error);
    }
};

module.exports = { createOrder, findOrderById, orderHistory, getAllOrders, confirmedOrders, shipOrders, deliverOrders, cancelledOrders, deleteOrders }