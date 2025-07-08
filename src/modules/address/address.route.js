const router = require("express").Router();

const addressController = require("./address.controller.js");
const { validateAddress } = require("./address.validator.js");
const { authenticate, authenticateAdmin, authorizedAdminRoles } = require("../../middleware/authenticate.js");

router.post("/add", authenticate, validateAddress, addressController.createAddress);
router.get("/get-all", authenticate, addressController.getAllAddresses);
router.get("/:id", authenticate, addressController.getAddressById);
router.put("/:id", authenticateAdmin, authorizedAdminRoles("Developer", "Master Admin", "Driver", "update-address"), validateAddress, addressController.updateAddress);
router.delete("/:id", authenticate, addressController.deleteAddress);

module.exports = router;