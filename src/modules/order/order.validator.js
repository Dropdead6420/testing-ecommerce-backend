const validateOrder = (req, res, next) => {
    const address = req.body;

    // If existing address ID is provided, skip field-level validation
    if (address._id) {
        return next();
    }

    const requiredFields = [
        "fullName",
        "street",
        "city",
        "state",
        "zipCode",
        "country",
        "mobile"
    ];

    const missingFields = requiredFields.filter(field => !address[field]);

    if (missingFields.length > 0) {
        return res.status(400).json({
            message: "Validation error",
            errors: missingFields.map(f => `${f[0].toUpperCase() + f.slice(1)} is required`)
        });
    }

    // Optional: additional format checks
    if (address.mobile && !/^\d{10,15}$/.test(address.mobile)) {
        return res.status(400).json({
            message: "Validation error",
            errors: ["Phone number must be between 10–15 digits"]
        });
    }

    next();
};

module.exports = { validateOrder };
