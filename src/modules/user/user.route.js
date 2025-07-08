const router = require("express").Router();
const userController = require("./user.controller");
const { authorizedAdminRoles, authenticateAdmin, authorizeConditional, authenticate } = require("../../middleware/authenticate");
const { validateUpdate } = require("../auth/auth.validator");

router.get("/profile", userController.getUserProfile);
router.get("/get-all", authenticateAdmin, authorizedAdminRoles("Developer", "Master Admin", "view-user"), userController.getAllUsers);

router.put("/", validateUpdate, authenticate, userController.updateUser);
router.put("/:id", validateUpdate, authenticateAdmin, authorizedAdminRoles("Developer", "Master Admin", "update-user"), userController.updateUserByAdmin);

module.exports = router;