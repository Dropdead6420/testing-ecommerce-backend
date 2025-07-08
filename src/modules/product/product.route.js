const router = require("express").Router();

const { authenticateAdmin, authorizedAdminRoles } = require("../../middleware/authenticate.js");
const productController = require("./product.controller.js");
const { validateProduct, validateProductQuantityOnly, validateProductStatusOnly } = require("./product.validator.js");

// Vendor
router.post("/add", authenticateAdmin, authorizedAdminRoles("Developer", "Master Admin", "Vendor", "add-product"), validateProduct, productController.createProduct);
router.put("/:id", authenticateAdmin, authorizedAdminRoles("Developer", "Master Admin", "Vendor", "update-product"), validateProduct, productController.updateProduct);
router.patch("/quantity/:id", authenticateAdmin, authorizedAdminRoles("Developer", "Master Admin", "Vendor", "update-product"), validateProductQuantityOnly, productController.updateProductQuantity);
router.patch("/status/:id", authenticateAdmin, authorizedAdminRoles("Developer", "Master Admin", "Vendor", "update-product"), validateProductStatusOnly, productController.updateProductStatus);
router.post("/add/many", authenticateAdmin, authorizedAdminRoles("Developer", "Master Admin", "Vendor", "add-product"), productController.createMultipleProduct);

// Customer
router.get("/get-all", productController.getAllProducts);
router.get("/:id", productController.findProductById);

module.exports = router;