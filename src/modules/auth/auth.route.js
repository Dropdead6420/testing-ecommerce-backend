const router = require("express").Router();
const { authenticate } = require("../../middleware/authenticate.js");
const authController = require("./auth.controller");
const { validateSignin, validateSignup, validateForgetPassword, validateNewPassword } = require("./auth.validator.js");

router.post("/signup", validateSignup, authController.register);
router.post("/signin", validateSignin, authController.login);

router.post("/forget-password", validateForgetPassword, authController.forgetPassword)
router.post("/reset-password", validateNewPassword, authController.resetPassword);

module.exports = router;