const Category = require("../category/category.model");
const Product = require("./product.model");

async function createProduct(reqData) {
    try {
        // Helper to get or create category
        const findOrCreateCategory = async (name, parentId = null, level = 1) => {
            let category = await Category.findOne({ name, parentCategory: parentId });
            if (!category) {
                category = new Category({ name, parentCategory: parentId, level });
                await category.save();
            }
            return category;
        };

        let storeCategory = reqData.thirdLevelCategory;

        const find = await Category.findById(reqData.thirdLevelCategory);
        if (!find) {
            const topLevel = await findOrCreateCategory(reqData.topLevelCategory, null, 1);
            const secondLevel = await findOrCreateCategory(reqData.secondLevelCategory, topLevel._id, 2);
            const thirdLevel = await findOrCreateCategory(reqData.thirdLevelCategory, secondLevel._id, 3);

            return storeCategory = thirdLevel._id;
        }

        // Calculate discountedPrice for each variation
        if (Array.isArray(reqData.variation_options)) {
            reqData.variation_options = reqData.variation_options.map((variant) => {
                // Calculate total quantity from sizes
                const subQuantity = Array.isArray(variant.sizes)
                    ? variant.sizes.reduce((total, item) => total + (Number(item.quantity) || 0), 0)
                    : 0;
                const discount = Number(variant.discountPercent || 0);
                const price = Number(variant.price || 0);
                const discountedPrice = price - (price * discount / 100);

                return {
                    ...variant,
                    price,
                    quantity: subQuantity,
                    discountPercent: discount,
                    discountedPrice: Number(discountedPrice.toFixed(2)),
                };
            });
        }

        // Build product object
        const product = new Product({
            name: reqData.name,
            description: reqData.description,
            price: Number(reqData.price) || 0,
            discountedPrice: (Number(reqData.price) - (Number(reqData.price) * Number(reqData.discountPercent || 0) / 100)) || 0,
            discountPercent: Number(reqData.discountPercent) || 0,
            quantity: Array.isArray(reqData.variation_options) && reqData.variation_options.length > 0
                ? reqData.variation_options.reduce((total, variant) => {
                    return total + variant.sizes.reduce((sum, size) => sum + Number(size.quantity || 0), 0);
                }, 0)
                : Number(reqData.quantity),
            brand: reqData.brand,
            category: storeCategory,
            image: reqData.image || "",
            tag: Array.isArray(reqData.tag)
                ? reqData.tag.map((img, index) => ({
                    id: index + 1,
                    name: img.name,
                    slug: img.slug,
                }))
                : [],
            gallery: Array.isArray(reqData.gallery)
                ? reqData.gallery.map((img, index) => ({
                    id: index + 1,
                    original: img.original,
                    thumbnail: img.thumbnail,
                }))
                : [],
            variation_options: reqData.variation_options || [],
        });

        return await product.save();
    } catch (error) {
        throw new Error("Failed to create product" + error);
    }
}

async function deleteProduct(productId) {
    const product = await findProductById(productId);

    await Product.findByIdAndDelete(productId);
    return "Product deleted successfully";
}

async function updateProduct(productId, updateData) {
    try {
        // Disallow updates to _id and discountedPrice directly
        delete updateData._id;
        delete updateData.discountedPrice;
        delete updateData.topLevelCategory;
        delete updateData.secondLevelCategory;
        delete updateData.thirdLevelCategory;
        delete updateData.category;

        // If discountPercent or price is changed, recalculate discountedPrice
        if (updateData.price || updateData.discountPercent !== undefined) {
            const product = await findProductById(productId);
            if (!product) {
                const error = new Error("Product not found");
                error.statusCode = 404;
                throw error;
            }

            const price = updateData.price ?? product.price;
            const discountPercent = updateData.discountPercent ?? product.discountPercent;

            updateData.discountedPrice = price - (price * discountPercent / 100);
        }

        const updatedProduct = await Product.findByIdAndUpdate(
            productId,
            updateData,
            { new: true, runValidators: true }
        );

        if (!updatedProduct) {
            const error = new Error("Product not found");
            error.statusCode = 404;
            throw error;
        }

        return updateData;
    } catch (error) {
        if (!error.statusCode) error.statusCode = 500;
        throw error;
    }
}

async function findProductById(id) {
    try {
        const product = await Product.findById(id)
            .populate("category")
            .exec();

        return product;
    } catch (error) {
        throw new Error(`Failed to retrieve product by ID: ${error.message}`);
    }
}

async function getAllProducts(reqQuery) {
    let {
        category, color, sizes, minPrice, maxPrice, brand,
        minDiscount, sort, stock, pageNumber = 1, pageSize = 10
    } = reqQuery;

    pageNumber = Number(pageNumber);
    pageSize = Number(pageSize);

    const filter = { isActive: true };

    // Brand filter
    if (brand) {
        const brandSet = new Set(brand.split(",").map(c => c.trim().toLowerCase()));
        const brandRegex = new RegExp([...brandSet].join("|"), "i");
        filter.brand = { $regex: brandRegex };
    }

    // // Color filter from variation_options.color
    if (color) {
        const colorSet = new Set(color.split(",").map(c => c.trim()));
        filter["variation_options.color"] = { $in: [...colorSet] };
    }

    // Sizes filter from variation_options.sizes.name
    if (sizes) {
        const sizesSet = new Set(sizes.split(",").map(s => s.trim()));
        filter["variation_options.sizes.name"] = { $in: [...sizesSet] };
    }

    // Discount filter from variation_options
    if (minDiscount) {
        filter["variation_options.discountPercent"] = { $gte: Number(minDiscount) };
    }

    // Stock availability
    if (stock === "in_stock") {
        filter.quantity = { $gt: 0 };
    } else if (stock === "out_of_stock") {
        filter.quantity = { $eq: 0 };
    }

    // Price filtering (on variation_options.discountedPrice)
    if (minPrice !== undefined || maxPrice !== undefined) {
        const priceFilter = {};
        if (minPrice !== undefined) priceFilter.$gte = Number(minPrice);
        if (maxPrice !== undefined) priceFilter.$lte = Number(maxPrice);
        filter["variation_options.discountedPrice"] = priceFilter;
    }

    // Category filter: recursive
    if (category) {
        const targetCategory = await Category.findOne({ name: new RegExp(`^${category}$`, "i") });

        if (!targetCategory) {
            return {
                products: [],
                currentPage: pageNumber,
                totalPages: 0,
                totalProducts: 0
            };
        }

        let categoryIdsToMatch = [];

        if (targetCategory.level === 3) {
            categoryIdsToMatch = [targetCategory._id];
        } else {
            // Get all children recursively down to level 3
            const level2Cats = targetCategory.level === 1
                ? await Category.find({ parentCategory: targetCategory._id })
                : [targetCategory];

            const level2Ids = level2Cats.map(c => c._id);

            const level3Cats = await Category.find({ parentCategory: { $in: level2Ids }, level: 3 });

            if (!level3Cats.length) {
                return {
                    products: [],
                    currentPage: pageNumber,
                    totalPages: 0,
                    totalProducts: 0
                };
            }

            categoryIdsToMatch = level3Cats.map(c => c._id);
        }

        filter.category = { $in: categoryIdsToMatch };
    }

    // Sorting
    const sortOption =
        sort === "price_high"
            ? { "variation_options.discountedPrice": -1 }
            : sort === "price_low"
                ? { "variation_options.discountedPrice": 1 }
                : {};

    const totalProducts = await Product.countDocuments(filter);

    const products = await Product.find(filter)
        .populate("category")
        .sort(sortOption)
        .skip((pageNumber - 1) * pageSize)
        .limit(pageSize)
        .exec();

    const totalPages = Math.ceil(totalProducts / pageSize);

    return {
        products,
        currentPage: pageNumber,
        totalPages,
        totalProducts
    };
}

const createProductHelper = async (data) => {
    // Find or create category by name and hierarchy
    const findOrCreateCategory = async (name, parentId = null, level = 1) => {
        let category = await Category.findOne({ name, parentCategory: parentId });
        if (!category) {
            category = new Category({ name, parentCategory: parentId, level });
            await category.save();
        }
        return category;
    };

    // Build category hierarchy
    const topLevel = await findOrCreateCategory(data.topLevelCategory, null, 1);
    const secondLevel = await findOrCreateCategory(data.secondLevelCategory, topLevel._id, 2);
    const thirdLevel = await findOrCreateCategory(data.thirdLevelCategory, secondLevel._id, 3);

    // Prepare variation options if any
    let variationOptions = [];
    let totalQuantity = 0;

    if (Array.isArray(data.variation_options)) {
        variationOptions = data.variation_options.map((variant) => {
            const discount = Number(variant.discountPercent || 0);
            const price = Number(variant.price || 0);
            const discountedPrice = price - (price * discount / 100);

            const subQuantity = Array.isArray(variant.sizes)
                ? variant.sizes.reduce((sum, item) => sum + Number(item.quantity || 0), 0)
                : 0;

            totalQuantity += subQuantity;

            return {
                ...variant,
                price,
                discountPercent: discount,
                discountedPrice: Number(discountedPrice.toFixed(2)),
                quantity: subQuantity,
            };
        });
    } else {
        totalQuantity = Number(data.quantity || 0);
    }

    // Build and return product payload
    const productData = {
        name: data.name,
        description: data.description,
        price: Number(data.price),
        discountPercent: Number(data.discountPercent || 0),
        discountedPrice: Number(data.price) - (Number(data.price) * Number(data.discountPercent || 0) / 100),
        quantity: totalQuantity,
        brand: data.brand,
        category: thirdLevel._id,
        image: data.image || "",
        tag: Array.isArray(data.tag)
            ? data.tag.map((tag, index) => ({
                id: index + 1,
                name: tag.name,
                slug: tag.slug,
            }))
            : [],
        gallery: Array.isArray(data.gallery)
            ? data.gallery.map((img, index) => ({
                id: index + 1,
                original: img.original,
                thumbnail: img.thumbnail,
            }))
            : [],
        variation_options: variationOptions,
    };

    return productData;
};

const createMultipleProduct = async (productList) => {
    const success = [];
    const failed = [];

    for (let product of productList) {
        try {
            const productData = await createProductHelper(product);
            success.push(productData);
        } catch (error) {
            failed.push({
                input: product,
                error: error.message,
            });
        }
    }

    let inserted = [];
    if (success.length > 0) {
        inserted = await Product.insertMany(success, { ordered: false, validateBeforeSave: true });
    }

    return {
        insertedCount: inserted.length,
        failedCount: failed.length,
        inserted,
        failed
    };
};

const updateProductQuantity = async (productId, quantity) => {
    try {
        const updated = await Product.findByIdAndUpdate(
            productId,
            { quantity },
            { new: true, runValidators: true }
        );
        return updated;
    } catch (error) {
        throw new Error(`Failed to update product quantity: ${error.message}`);
    }
};

const updateProductStatus = async (productId, isActive) => {
    try {
        const updated = await Product.findByIdAndUpdate(
            productId,
            { isActive },
            { new: true, runValidators: true }
        );
        return updated;
    } catch (error) {
        throw new Error(`Failed to update product status: ${error.message}`);
    }
};

module.exports = {
    createProduct,
    deleteProduct,
    updateProduct,
    getAllProducts,
    findProductById,
    createMultipleProduct,
    updateProductQuantity,
    updateProductStatus
}