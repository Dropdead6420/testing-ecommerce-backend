const dashboardService = require("./dashboard.service");

const getOrderDashboard = async (req, res) => {
    try {
        const dashboardStats = await dashboardService.fetchDashboardStats();

        const dashboardData = [
            {
                id: 1,
                iconName: "ri-money-dollar-circle-line",
                progress: dashboardService.calcProgress(dashboardStats.allOrders, dashboardStats.allOrdersLastWeek),
                title: "Up from past week",
                lists: [
                    { id: 1, title: "All Orders", number: dashboardService.formatCount(dashboardStats.allOrders) },
                    { id: 2, title: "Pending Orders", number: dashboardService.formatCount(dashboardStats.pendingOrders) },
                    { id: 3, title: "Completed Orders", number: dashboardService.formatCount(dashboardStats.completedOrders) },
                ],
            },
            {
                id: 2,
                iconName: "ri-star-fill",
                progress: dashboardService.calcProgress(
                    dashboardStats.abandonedCartsThisWeek,
                    dashboardStats.abandonedCartsLastWeek
                ),
                title: "Up from past week",
                lists: [
                    { id: 1, title: "Abandoned Cart", number: dashboardService.formatCount(dashboardStats.abandonedCartsThisWeek) },
                    { id: 2, title: "Customers", number: dashboardService.formatCount(dashboardStats.customersThisWeek) },
                    { id: 3, title: "In Progress", number: dashboardService.formatCount(dashboardStats.inProgressOrders) },
                ],
            },
        ];

        return res.status(200).json({
            success: true,
            message: "Dashboard data fetched successfully",
            data: dashboardData,
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "Internal server error",
            error: error.message,
        });
    }
};

module.exports = {
    getOrderDashboard,
};
