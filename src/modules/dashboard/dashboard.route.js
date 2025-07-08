const { authenticateAdmin, authorizedAdminRoles } = require("../../middleware/authenticate");
const dashboardController = require("./dashboard.controller");

const router = require("express").Router();

router.get("/order/overview", authenticateAdmin, authorizedAdminRoles("Developer", "Master Admin", "view-dashboard"), dashboardController.getOrderDashboard );

module.exports = router;