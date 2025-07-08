const express = require("express");
const router = express.Router();

const orderController = require("./order.controller.js");
const { authenticateAdmin, authorizedAdminRoles } = require("../../middleware/authenticate.js");

// Get all order
router.get("/all", authenticateAdmin, authorizedAdminRoles("Developer", "Master Admin", "Vendor", "view-order"), orderController.getAllOrders);

// Get full details of any order and filter
router.get("/:id", authenticateAdmin, authorizedAdminRoles("Developer", "Master Admin", "Vendor", "view-order"), orderController.findOrderById);

// Update order status
router.patch("/:orderId/confirmed", authenticateAdmin, authorizedAdminRoles("Developer", "Master Admin", "Vendor", "update-order-status"), orderController.confirmedOrders);
router.patch("/:orderId/ship", authenticateAdmin, authorizedAdminRoles("Developer", "Master Admin", "Vendor", "update-order-status"), orderController.shipOrders);
router.patch("/:orderId/deliver", authenticateAdmin, authorizedAdminRoles("Developer", "Master Admin", "Vendor", "update-order-status"), orderController.deliverOrders);
router.patch("/:orderId/cancel", authenticateAdmin, authorizedAdminRoles("Developer", "Master Admin", "Vendor", "update-order-status"), orderController.cancelledOrders);

// Delete an order (if allowed)
router.delete("/:orderId", authenticateAdmin, authorizedAdminRoles("Developer"), orderController.deleteOrders);

module.exports = router;