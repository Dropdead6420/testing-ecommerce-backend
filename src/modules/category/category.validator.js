const validateCategory = (req, res, next) => {
    const { name, level } = req.body;
    const missingFields = [];

    if (!name || name.trim() === "") {
        missingFields.push("name");
    }

    if (!level || level.toString().trim() === "") {
        missingFields.push("level");
    }

    if (missingFields.length > 0) {
        return res.status(400).json({
            error: "Validation error",
            message: missingFields.map(f => `${f[0].toUpperCase() + f.slice(1)} is required`)
        });
    }

    next();
};

module.exports = { validateCategory };
