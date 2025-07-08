const validateProduct = (req, res, next) => {
    const {
        name,
        slug,
        description,
        price,
        discountPercent,
        quantity,
        brand,
        category,
        tag,
        gallery,
        image,
        variation_options
    } = req.body;

    const errors = [];

    // Name
    if (!name || typeof name !== "string" || name.trim() === "") {
        errors.push("Product name is required and must be a non-empty string.");
    }

    // Slug (optional, auto-generated)
    if (slug && typeof slug !== "string") {
        errors.push("Slug, if provided, must be a string.");
    }

    // Description
    if (!description || typeof description !== "string" || description.trim() === "") {
        errors.push("Product description is required and must be a non-empty string.");
    }

    if (variation_options) {
        if (!Array.isArray(variation_options)) {
            errors.push("variation_options must be an array.");
        } else {
            variation_options.forEach((v, vIndex) => {
                if (typeof v !== "object") {
                    errors.push(`Variation at index ${vIndex} must be an object.`);
                    return;
                }

                if (!v.title || typeof v.title !== "string") {
                    errors.push(`Variation title at index ${vIndex} is required.`);
                }

                if (!Array.isArray(v.color)) {
                    errors.push(`Variation color at index ${vIndex} must be an array of strings.`);
                }

                if (!Array.isArray(v.sizes)) {
                    errors.push(`Variation sizes at index ${vIndex} must be an array.`);
                } else {
                    v.sizes.forEach((size, sIndex) => {
                        if (!size.name || typeof size.name !== "string") {
                            errors.push(`Size name at index ${sIndex} in variation ${vIndex} must be a valid string.`);
                        }
                        if (size.quantity == null || isNaN(size.quantity) || size.quantity < 0) {
                            errors.push(`Size quantity at index ${sIndex} in variation ${vIndex} must be a positive number.`);
                        }
                    });
                }

                if (v.price == null || isNaN(v.price) || v.price < 0) {
                    errors.push(`Variation price at index ${vIndex} must be a positive number.`);
                }

                if (
                    v.discountPercent != null &&
                    (isNaN(v.discountPercent) || v.discountPercent < 0 || v.discountPercent > 100)
                ) {
                    errors.push(`Variation discountPercent at index ${vIndex} must be between 0 and 100.`);
                }

                // if (v.quantity) {
                //     errors.push("Manual quantity input is not allowed. It is set automatically.");
                // }
            });
        }
    } else {
        // Price
        if (price == null || isNaN(price) || Number(price) < 0) {
            errors.push("Product price must be a valid positive number.");
        }

        // Discount percent
        if (discountPercent != null && (isNaN(discountPercent) || discountPercent < 0 || discountPercent > 100)) {
            errors.push("Discount percent must be a number between 0 and 100.");
        }

        // Quantity
        if (quantity == null || isNaN(quantity) || Number(quantity) < 0) {
            errors.push("Quantity is required and must be a valid positive number.");
        }
    }

    // Brand
    if (!brand || typeof brand !== "string" || brand.trim() === "") {
        errors.push("Brand is required and must be a non-empty string.");
    }

    // Category
    // if (!category || typeof category !== "string") {
    //     errors.push("Category (ObjectId) is required and must be a valid string.");
    // }

    // Image (optional)
    if (image && (typeof image !== "string" || image.trim() === "")) {
        errors.push("Image URL must be a valid non-empty string.");
    }

    // Tag (optional)
    if (tag) {
        if (!Array.isArray(tag)) {
            errors.push("Tag must be an array.");
        } else {
            tag.forEach((t, index) => {
                if (
                    typeof t !== "object" ||
                    typeof t.name !== "string" ||
                    typeof t.slug !== "string"
                ) {
                    errors.push(`Each tag at index ${index} must have valid 'name' and 'slug' strings.`);
                }
            });
        }
    }

    // Gallery (optional)
    if (gallery) {
        if (!Array.isArray(gallery)) {
            errors.push("Gallery must be an array.");
        } else {
            gallery.forEach((g, index) => {
                if (
                    typeof g !== "object" ||
                    typeof g.original !== "string" ||
                    typeof g.thumbnail !== "string"
                ) {
                    errors.push(`Each gallery item at index ${index} must include valid 'original' and 'thumbnail' strings.`);
                }
            });
        }
    }

    if (errors.length > 0) {
        return res.status(400).json({
            message: "Product validation failed",
            errors,
        });
    }

    next();
};

const validateProductQuantityOnly = (req, res, next) => {
    const { quantity } = req.body;

    if (!quantity) {
        return res.status(400).json({
            error: "Validation error",
            message: "Quantity is required"
        })
    }

    if (Object.keys(req.body).length !== 1 || quantity === undefined) {
        return res.status(400).json({
            message: "Only 'quantity' field is allowed in the request body",
        });
    }

    if (typeof quantity !== "number" || quantity < 0) {
        return res.status(400).json({
            message: "Quantity must be a non-negative number",
        });
    }

    next();
};

const validateProductStatusOnly = (req, res, next) => {
    const { isActive } = req.body;

    if (Object.keys(req.body).length !== 1 || typeof isActive !== "boolean") {
        return res.status(400).json({
            message: "Only 'isActive' field is required and it must be a boolean",
        });
    }

    next();
};

module.exports = { validateProduct, validateProductQuantityOnly, validateProductStatusOnly };
