const validateAddress = (req, res, next) => {
    const {
        user,
        firstName,
        lastName,
        mobile,
        streetAddress,
        city,
        state,
        zipCode,
        country,
        isDefault,
    } = req.body;

    // Validate user
    if (user) return res.status(400).json({ error: "Validation error", message: "Not allow to enter user ID" });

    // Validate firstName
    if (!firstName) return res.status(400).json({ error: "Validation error", message: "First name is required" });
    if (firstName.length > 50) return res.status(400).json({ error: "Validation error", message: "First name must not exceed 50 characters" });

    // Validate lastName (optional)
    if (lastName && typeof lastName !== "string")
        return res.status(400).json({ error: "Validation error", message: "Last name must be a string" });

    // Validate mobile
    if (!mobile) return res.status(400).json({ error: "Validation error", message: "Mobile number is required" });
    if (!/^\d{8,15}$/.test(mobile)) return res.status(400).json({ error: "Validation error", message: "Mobile number must be between 8 to 15 digits" });

    // Validate streetAddress
    if (!streetAddress) return res.status(400).json({ error: "Validation error", message: "Street address is required" });
    if (streetAddress.length > 255)
        return res.status(400).json({ error: "Validation error", message: "Street address must not exceed 255 characters" });

    // Validate city
    if (!city) return res.status(400).json({ error: "Validation error", message: "City is required" });
    if (city.length > 100) return res.status(400).json({ error: "Validation error", message: "City name must not exceed 100 characters" });

    // Validate state
    if (!state) return res.status(400).json({ error: "Validation error", message: "State is required" });
    if (state.length > 100) return res.status(400).json({ error: "Validation error", message: "State name must not exceed 100 characters" });

    // Validate zipCode
    if (!zipCode) return res.status(400).json({ error: "Validation error", message: "Zip code is required" });
    if (!/^\d{5,6}$/.test(zipCode)) return res.status(400).json({ error: "Validation error", message: "Zip code must be 5 or 6 digits" });

    // Validate country (optional)
    if (country && typeof country !== "string")
        return res.status(400).json({ error: "Validation error", message: "Country must be a string" });

    // Validate isDefault (optional)
    if (isDefault !== undefined && typeof isDefault !== "boolean")
        return res.status(400).json({ error: "Validation error", message: "isDefault must be a boolean" });

    // All validations passed
    next();
};

module.exports = { validateAddress };
