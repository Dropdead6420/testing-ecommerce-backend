const productService = require("./product.service");

const createProduct = async (req, res, next) => {
    try {
        const product = await productService.createProduct(req.body);
        return res.status(201).json({ message: "Product added", data: product });
    } catch (error) {
        next(error);
    }
}

const deleteProduct = async (req, res, next) => {
    const productId = req.params.id;

    try {
        const product = await productService.deleteProduct(productId);
        return res.status(201).send(product);
    } catch (error) {
        next(error);
    }
}

const updateProduct = async (req, res, next) => {
    const productId = req.params.id;
    if (!productId || !productId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({
            message: "Invalid product ID format",
            error: "Bad Request"
        });
    }

    try {
        const product = await productService.updateProduct(productId, req.body);
        return res.status(200).json({
            message: "Product updated successfully",
            data: product
        });
    } catch (error) {
        next(error);
    }
}

const findProductById = async (req, res, next) => {
    const productId = req.params.id;
    if (!productId || !productId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({
            message: "Invalid product ID format",
            error: "Bad Request"
        });
    }

    try {
        const product = await productService.findProductById(productId);
        if (!product) {
            return res.status(404).json({
                message: "Product not found with the provided ID",
                error: "Not Found"
            });
        }

        return res.status(200).json({
            message: "Product fetched successfully",
            data: product
        });
    } catch (error) {
        next(error);
    }
}

const getAllProducts = async (req, res, next) => {
    try {
        const result = await productService.getAllProducts(req.query);

        return res.status(200).json({
            success: true,
            message: result.products.length > 0
                ? "Products fetched successfully"
                : "No products found matching the filters",
            data: result.products,
            meta: {
                currentPage: result.currentPage,
                totalPages: result.totalPages,
                totalProducts: result.totalProducts
            }
        });
    } catch (error) {
        next(error);
    }
}

const createMultipleProduct = async (req, res, next) => {
    const products = req.body;

    if (!Array.isArray(products) || products.length === 0) {
        return res.status(400).json({
            message: "Invalid input. Request body must be a non-empty array of products"
        });
    }

    try {
        const result = await productService.createMultipleProduct(products);

        return res.status(201).json({
            message: "Product creation process completed",
            error: result.failedCount > 0 ? "Some products failed to insert" : null,
            data: result.inserted,
            meta: {
                insertedCount: result.insertedCount,
                failedCount: result.failedCount,
                failedRecords: result.failed
            }
        });
    } catch (error) {
        next(error);
    }
};

const updateProductQuantity = async (req, res, next) => {
    const productId = req.params.id;
    const { quantity } = req.body;

    if (!productId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({
            message: "Invalid product ID format",
        });
    }

    try {
        const updatedProduct = await productService.updateProductQuantity(productId, quantity);

        if (!updatedProduct) {
            return res.status(404).json({
                message: "Product not found",
            });
        }

        return res.status(200).json({
            message: "Product quantity updated successfully",
            data: updatedProduct,
        });
    } catch (error) {
        next(error);
    }
};

const updateProductStatus = async (req, res, next) => {
    const productId = req.params.id;
    const { isActive } = req.body;

    if (!productId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({
            message: "Invalid product ID format",
        });
    }

    try {
        const updatedProduct = await productService.updateProductStatus(productId, isActive);

        if (!updatedProduct) {
            return res.status(404).json({ message: "Product not found" });
        }

        return res.status(200).json({
            message: "Product status updated successfully",
            data: updatedProduct,
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { createProduct, deleteProduct, updateProduct, getAllProducts, createMultipleProduct, findProductById, updateProductQuantity, updateProductStatus }