const router = require("express").Router();

const cartController = require("./cart.controller.js");
const { authenticate } = require("../../middleware/authenticate.js");
const { validateCartItem, validateQuantityUpdate } = require("./cart.validator.js");

router.post("/add", authenticate, validateCartItem, cartController.addItemToCart);
router.get("/", authenticate, cartController.findUserCart);
router.patch("/:id", authenticate, validateQuantityUpdate, cartController.updateCartQuantity);
router.delete("/:id", authenticate, cartController.removeCartItem);


module.exports = router;