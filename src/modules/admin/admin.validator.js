const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateSignin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  if (!email) {
    errors.push("Email is required");
  } else if (!emailRegex.test(email)) {
    errors.push("Invalid email format");
  }

  if (!password) {
    errors.push("Password is required");
  } else if (password.length < 6 || password.length > 20) {
    errors.push("Password must be between 6 and 20 characters");
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: "Validation error", errors });
  }

  next();
};

const validateSignup = (req, res, next) => {
  const { name, email, password, role, isActive } = req.body;
  const errors = [];

  if (isActive) {
    errors.push("Not allow to enter isActive");
  }

  if (!name || name.trim().length < 2) {
    errors.push("Name is required and must be at least 2 characters");
  }

  if (!email) {
    errors.push("Email is required");
  } else if (!emailRegex.test(email)) {
    errors.push("Invalid email format");
  }

  if (!password) {
    errors.push("Password is required");
  } else if (password.length < 6 || password.length > 20) {
    errors.push("Password must be between 6 and 20 characters");
  }

  if (!role) {
    errors.push("Role is required");
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: "Validation error", errors });
  }

  next();
};

const validateAdminUpdate = (req, res, next) => {
  const { profileImage, password, name, email, mobile, address, about, role } = req.body;
  const errors = [];

  if (password) {
    errors.push("Not allow to update the password");
  }

  if (profileImage && typeof profileImage !== "string") {
    errors.push("Profile image must be a string");
  }

  if (name && (typeof name !== "string" || name.trim().length < 2)) {
    errors.push("Name must be a string and at least 2 characters long");
  }

  if (email) {
    errors.push("Email cannot be updated");
  }

  if (mobile && typeof mobile !== "string") {
    errors.push("Mobile number must be a string");
  }

  if (address && typeof address !== "string") {
    errors.push("Address must be a string");
  }

  if (about && typeof about !== "string") {
    errors.push("About must be a string");
  }

  if (role) {
    errors.push("Role cannot be updated");
  }

  if (errors.length > 0) {
    return res.status(400).json({ message: "Validation error", errors });
  }

  next();
};

const validateForgetPassword = (req, res, next) => {
  const { email } = req.body;
  const errors = [];

  if (!email) {
    errors.push("Email is required");
  }
  if (email && !emailRegex.test(email)) {
    errors.push("Invalid email format");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      error: "Validation error",
      message: errors.join(", "),
    });
  }

  next();
};

const validateNewPassword = (req, res, next) => {
  const { newPassword, token } = req.body;
  const errors = [];

  if (!token) {
    errors.push("Token is required");
  }

  if (!newPassword) {
    errors.push("New password is required");
  } else if (newPassword.length < 6 || newPassword.length > 20) {
    errors.push("New password must be between 6 and 20 characters");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      message: "Validation error",
      error: errors.join(", "),
    });
  }

  next();
};

module.exports = {
  validateSignin,
  validateSignup,
  validateAdminUpdate,
  validateForgetPassword,
  validateNewPassword
};