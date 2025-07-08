const dayjs = require("dayjs");
const Order = require("../order/order.model");
const Cart = require("../cart/cart.model");
const User = require("../user/user.model");

const formatCount = (num) => {
    if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
    if (num >= 1_000) return (num / 1_000).toFixed(1) + 'k';
    return num.toString();
};

const calcProgress = (current, previous) => {
    if (previous === 0 && current === 0) return "0%";
    if (previous === 0) return current === 0 ? "0%" : "+100%";
    const change = ((current - previous) / previous) * 100;
    return `${change >= 0 ? "+" : ""}${change.toFixed(1)}%`;
};

const getDateRanges = () => {
    const today = dayjs().endOf("day");
    const startOfThisWeek = today.subtract(6, "day").startOf("day");
    const startOfLastWeek = startOfThisWeek.subtract(7, "day");
    const endOfLastWeek = startOfThisWeek.subtract(1, "day");

    return {
        today,
        startOfThisWeek,
        startOfLastWeek,
        endOfLastWeek,
    };
};

const fetchDashboardStats = async () => {
    const { today, startOfThisWeek, startOfLastWeek, endOfLastWeek } = getDateRanges();

    const [
        allOrders,
        allOrdersLastWeek,
        pendingOrders,
        completedOrders,
        abandonedCartsThisWeek,
        abandonedCartsLastWeek,
        customersThisWeek,
        customersLastWeek,
        inProgressOrders
    ] = await Promise.all([
        Order.countDocuments({}),
        Order.countDocuments({ createdAt: { $gte: startOfLastWeek.toDate(), $lte: endOfLastWeek.toDate() } }),
        Order.countDocuments({ orderStatus: "PENDING" }),
        Order.countDocuments({ orderStatus: "DELIVERED" }),
        Cart.countDocuments({
            totalItem: { $gt: 0 },
            updatedAt: { $gte: startOfThisWeek.toDate(), $lte: today.toDate() },
        }),
        Cart.countDocuments({
            totalItem: { $gt: 0 },
            updatedAt: { $gte: startOfLastWeek.toDate(), $lte: endOfLastWeek.toDate() },
        }),
        User.countDocuments({
            createdAt: { $gte: startOfThisWeek.toDate(), $lte: today.toDate() },
        }),
        User.countDocuments({
            createdAt: { $gte: startOfLastWeek.toDate(), $lte: endOfLastWeek.toDate() },
        }),
        Order.countDocuments({
            orderStatus: { $in: ["PLACED", "CONFIRMED", "SHIPPED"] },
        }),
    ]);

    return {
        allOrders,
        allOrdersLastWeek,
        pendingOrders,
        completedOrders,
        abandonedCartsThisWeek,
        abandonedCartsLastWeek,
        customersThisWeek,
        customersLastWeek,
        inProgressOrders,
    };
};

module.exports = {
    formatCount,
    calcProgress,
    fetchDashboardStats,
};
