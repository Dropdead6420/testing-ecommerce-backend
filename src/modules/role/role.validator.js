const mongoose = require("mongoose");

const validateRoleAdd = (req, res, next) => {
  const { name, permissions } = req.body;
  const errors = [];

  if (!name || name.trim() === "") {
    errors.push("Role name is required");
  }

  if (!permissions) {
    errors.push("Role is required");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      message: "Validation error",
      error: errors.join(", "),
    });
  }

  next();
};

const validateRoleUpdate = (req, res, next) => {
  const { name, permissions } = req.body;
  const { id } = req.params;

  const errors = [];

  if (!id) {
    errors.push("ID is required");
  } else if (!mongoose.Types.ObjectId.isValid(id)) {
    errors.push("Invalid role ID format");
  }

  if (!name || name.trim() === "") {
    errors.push("Role name is required");
  }

  if (!permissions) {
    errors.push("Role is required");
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
  validateRoleAdd,
  validateRoleUpdate
};
