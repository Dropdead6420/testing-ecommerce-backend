const router = require("express").Router();
const adminController = require("./admin.controller");
const {
    validateSignup,
    validateSignin,
    validateAdminUpdate,
    validateForgetPassword,
    validateNewPassword,
} = require("./admin.validator");

const {
    authenticateAdmin,
    authorizedAdminRoles,
} = require("../../middleware/authenticate");

// Create new admin (Developer / Master Admin only)
router.post(
    "/signup",
    validateSignup,
    adminController.createAdmin
);

// Admin signin
router.post("/signin", validateSignin, adminController.signin);

// Get all admins (with pagination/filter)
router.get(
    "/get-all",
    authenticateAdmin,
    authorizedAdminRoles("Developer", "Master Admin", "view-admin"),
    adminController.getAllAdmins
);

// Get logged-in admin's profile
router.get("/me", authenticateAdmin, adminController.getMyProfile);

// Get a specific admin by ID
router.get(
    "/:id",
    authenticateAdmin,
    authorizedAdminRoles("Developer", "Master Admin", "view-admin"),
    adminController.getAdminById
);

// Update your own profile
router.put(
    "/",
    authenticateAdmin,
    validateAdminUpdate,
    adminController.updateAdmin
);

// Change status (activate/deactivate) of another admin
router.patch(
    "/status/:id",
    authenticateAdmin,
    authorizedAdminRoles("Developer", "Master Admin", "change-admin-status"),
    adminController.updateAdminStatus
);

// Soft delete another admin
router.delete(
    "/:id",
    authenticateAdmin,
    authorizedAdminRoles("Developer", "Master Admin", "delete-admin"),
    adminController.deleteAdmin
);

// Admin logout
router.post("/log-out", authenticateAdmin, adminController.logout);

// Forget password
router.post("/forget-password", validateForgetPassword, adminController.forgetPassword)
router.post("/reset-password", validateNewPassword, adminController.resetPassword);

module.exports = router;