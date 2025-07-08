const router = require("express").Router();
const { authenticateAdmin, authorizedAdminRoles } = require("../../middleware/authenticate");
const roleController = require("./role.controller");
const { validateRoleAdd, validateRoleUpdate } = require("./role.validator");

// Add Role
router.post("/add", validateRoleAdd, authenticateAdmin, authorizedAdminRoles("Developer", "Master Admin", "add-role"), roleController.addRole);

// Get all roles
router.get("/get-all", authenticateAdmin, authorizedAdminRoles("Developer", "Master Admin", "view-role"), roleController.getAllRole);

// Get role by ID
router.get("/by-id/:id", authenticateAdmin, authorizedAdminRoles("Developer", "Master Admin", "view-role"), roleController.getRoleById)
// Get a role by ID
router.get("/by-name/:roleName", authenticateAdmin, authorizedAdminRoles("Developer", "Master Admin", "view-role"), roleController.getRoleByRoleName);

// Update a role by ID
router.put("/update/:id", validateRoleUpdate, authenticateAdmin, authorizedAdminRoles("Developer", "Master Admin", "edit-role"), roleController.updateRoleById);

// Delete a role by ID
router.delete("/:id", authenticateAdmin, authorizedAdminRoles("Developer", "Master Admin", "delete-role"), roleController.deleteRoleById);

module.exports = router;
