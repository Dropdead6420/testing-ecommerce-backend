const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateSignin = (req, res, next) => {
  const { email, password } = req.body;
  const errors = [];

  // Check if request body is empty
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({
      error: "Bad request",
      message: "Request body cannot be empty"
    });
  }

  // Validate email
  if (!email) {
    errors.push("Email is required");
  } else if (typeof email !== 'string') {
    errors.push("Email must be a string");
  } else if (!emailRegex.test(email)) {
    errors.push("Invalid email format");
  }

  // Validate password
  if (!password) {
    errors.push("Password is required");
  } else if (typeof password !== 'string') {
    errors.push("Password must be a string");
  } else if (password.length < 6 || password.length > 20) {
    errors.push("Password must be between 6 and 20 characters");
  }

  // Return validation errors if any
  if (errors.length > 0) {
    return res.status(400).json({
      error: "Validation failed",
      message: errors.join(", ")
    });
  }

  next();
};

const validateSignup = (req, res, next) => {
  const { firstName, lastName, email, password, mobile } = req.body;
  const errors = [];

  // Check if request body is empty
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({
      error: "Bad request",
      message: "Request body cannot be empty"
    });
  }

  // Validate firstName
  if (!firstName) {
    errors.push("First name is required");
  } else if (typeof firstName !== 'string') {
    errors.push("First name must be a string");
  } else if (firstName.trim() === "") {
    errors.push("First name cannot be empty");
  } else if (firstName.length > 50) {
    errors.push("First name cannot exceed 50 characters");
  }

  // Validate lastName
  if (!lastName) {
    errors.push("Last name is required");
  } else if (typeof lastName !== 'string') {
    errors.push("Last name must be a string");
  } else if (lastName.trim() === "") {
    errors.push("Last name cannot be empty");
  } else if (lastName.length > 50) {
    errors.push("Last name cannot exceed 50 characters");
  }

  // Validate email
  if (!email) {
    errors.push("Email is required");
  } else if (typeof email !== 'string') {
    errors.push("Email must be a string");
  } else if (!emailRegex.test(email)) {
    errors.push("Invalid email format");
  }

  // Validate password
  if (!password) {
    errors.push("Password is required");
  } else if (typeof password !== 'string') {
    errors.push("Password must be a string");
  } else if (password.length < 6 || password.length > 20) {
    errors.push("Password must be between 6 and 20 characters");
  }

  // Validate mobile (optional)
  if (mobile !== undefined) {
    if (typeof mobile !== 'number' && typeof mobile !== 'string') {
      errors.push("Mobile number must be a number or string");
    } else {
      const mobileStr = mobile.toString();
      if (!/^\d{10}$/.test(mobileStr)) {
        errors.push("Mobile number must be 10 digits");
      }
    }
  }

  // Return validation errors if any
  if (errors.length > 0) {
    return res.status(400).json({
      error: "Validation failed",
      message: errors.join(", ")
    });
  }

  next();
};

const validateForgetPassword = (req, res, next) => {
  const { email, mobile } = req.body;
  const errors = [];

  // Check if request body is empty
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({
      error: "Bad request",
      message: "Request body cannot be empty"
    });
  }

  // At least one of email or mobile is required
  if (!email && !mobile) {
    errors.push("Either email or mobile is required");
  }

  // Validate email if provided
  if (email !== undefined) {
    if (typeof email !== 'string') {
      errors.push("Email must be a string");
    } else if (!emailRegex.test(email)) {
      errors.push("Invalid email format");
    }
  }

  // Validate mobile if provided
  if (mobile !== undefined) {
    if (typeof mobile !== 'number' && typeof mobile !== 'string') {
      errors.push("Mobile number must be a number or string");
    } else {
      const mobileStr = mobile.toString();
      if (!/^\d{8,15}$/.test(mobileStr)) {
        errors.push("Mobile number must be between 8 to 15 digits");
      }
    }
  }

  // Return validation errors if any
  if (errors.length > 0) {
    return res.status(400).json({
      error: "Validation failed",
      message: errors.join(", ")
    });
  }

  next();
};

const validateNewPassword = (req, res, next) => {
  const { newPassword, token } = req.body;
  const errors = [];

  // Check if request body is empty
  if (!req.body || Object.keys(req.body).length === 0) {
    return res.status(400).json({
      error: "Bad request",
      message: "Request body cannot be empty"
    });
  }

  // Validate token
  if (!token) {
    errors.push("Token is required");
  } else if (typeof token !== 'string') {
    errors.push("Token must be a string");
  } else if (token.trim() === "") {
    errors.push("Token cannot be empty");
  }

  // Validate new password
  if (!newPassword) {
    errors.push("New password is required");
  } else if (typeof newPassword !== 'string') {
    errors.push("New password must be a string");
  } else if (newPassword.length < 6 || newPassword.length > 20) {
    errors.push("New password must be between 6 and 20 characters");
  }

  // Return validation errors if any
  if (errors.length > 0) {
    return res.status(400).json({
      error: "Validation failed",
      message: errors.join(", ")
    });
  }

  next();
};

const validateUpdate = (req, res, next) => {
  const { firstName, lastName, email, password, mobile } = req.body;
  const errors = [];

  if (!firstName || firstName.trim() === "") {
    errors.push("First name is required");
  }

  if (!lastName || lastName.trim() === "") {
    errors.push("Last name is required");
  }

  if (!email) {
    errors.push("Email is required");
  } else if (!emailRegex.test(email)) {
    errors.push("Invalid email format");
  }

  if (password && (password.length < 6 || password.length > 20)) {
    errors.push("Password must be between 6 and 20 characters");
  }

  if (mobile && !/^\d{10}$/.test(mobile)) {
    errors.push("Mobile number must be 10 digits");
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
  validateForgetPassword,
  validateNewPassword,
  validateUpdate
};