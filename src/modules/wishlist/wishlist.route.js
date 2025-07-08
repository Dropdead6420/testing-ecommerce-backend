const router = require("express").Router();
const wishlistController = require("./wishlist.controller");
const { authenticate, authenticateAdmin, authorizedAdminRoles } = require("../../middleware/authenticate");

router.post("/", authenticate, wishlistController.addToWishlist);
router.get("/", authenticate, wishlistController.getByUser);
router.delete("/", authenticate, wishlistController.removeProduct);
router.get("/get-all", authenticateAdmin, authorizedAdminRoles("Developer", "Master Admin", "view-wishlist"), wishlistController.getByAdmin);

module.exports = router;