const router = require("express").Router();
const { authenticateAdmin, authorizedAdminRoles } = require("../../middleware/authenticate.js");
const { validateCategory } = require("./category.validator.js");
const categoryController = require("./category.controller.js");

router.post(
    "/add",
    authenticateAdmin,
    authorizedAdminRoles("Developer", "Master Admin", "add-category"),
    validateCategory,
    categoryController.createCategory
);

router.get(
    "/all",
    categoryController.getCategoryWithFilter
);

router.put(
    "/update/:id",
    authenticateAdmin,
    authorizedAdminRoles("Developer", "Master Admin", "update-category"),
    categoryController.updateCategory
);

router.delete(
    "/delete/:id",
    authenticateAdmin,
    authorizedAdminRoles("Developer", "Master Admin", "delete-category"),
    categoryController.deleteCategory
);

router.get(
    "/tree",
    categoryController.getCategoryTreeController
);

module.exports = router;