const router = require("express").Router();

const orderController = require("./order.controller.js");
const { authenticate } = require("../../middleware/authenticate.js");
const { validateOrder } = require("./order.validator.js");

router.post("/", authenticate, validateOrder, orderController.createOrder);
router.get("/get-all", authenticate, orderController.orderHistory);
router.get("/:id", authenticate, orderController.findOrderById);
router.patch("/:orderId/cancel", authenticate, orderController.cancelledOrders);

module.exports = router;