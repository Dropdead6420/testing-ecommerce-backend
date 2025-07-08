const router = require("express").Router();

const reviewController = require("./review.controller.js");
const { authenticate, authenticateAdmin, authorizedAdminRoles } = require("../../middleware/authenticate.js");
const { validateReview, validateGetAllReview, validateReviewForUpdate } = require("./review.validator.js");

// Create a review
router.post("/:productId", authenticate, validateReview, reviewController.createReview);

// Approve the review
router.patch("/approve/:reviewId", authenticateAdmin, authorizedAdminRoles("Developer", "Master Admin", "approve-review"), reviewController.approveReview);

// Get all review
router.get("/:productId", validateGetAllReview, reviewController.getAllReview);

// Update review
router.put("/:productId", authenticate, validateReviewForUpdate, reviewController.updateReview)

module.exports = router;