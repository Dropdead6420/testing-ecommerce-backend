const categoryService = require("./category.service");
const mongoose = require("mongoose");

// === Utils ===
const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const sendResponse = (res, statusCode, success, message, data = null, error = null, meta = null) => {
    return res.status(statusCode).json({
        success,
        message,
        ...(data && { data }),
        ...(error && { error }),
        ...(meta && { meta }),
    });
};

// === Controllers ===

// Create Category
const createCategory = async (req, res) => {
    try {
        const { name, level, parentCategory } = req.body;

        // Validation
        if (level === 1 && parentCategory) {
            return sendResponse(res, 422, false, "Top-level category cannot have a parent", null, "Invalid parentCategory");
        }
        if (level !== 1) {
            if (!parentCategory) {
                return sendResponse(res, 422, false, "Subcategories require a parent category", null, "Missing parentCategory");
            }
            if (!isValidObjectId(parentCategory)) {
                return sendResponse(res, 400, false, "Invalid parent category ID", null, "Invalid parentCategory");
            }
        }

        const existingCategory = await categoryService.findCategoryByNameAndLevel(name, level);
        if (existingCategory) {
            return sendResponse(res, 409, false, "Category already exists", null, "Duplicate category");
        }

        const createdCategory = await categoryService.createCategory(req.body);
        if (!createdCategory) {
            return sendResponse(res, 500, false, "Failed to create category", null, "Database error");
        }

        return sendResponse(res, 201, true, "Category created successfully", createdCategory);
    } catch (err) {
        return sendResponse(res, err.statusCode || 500, false, err.message || "Internal server error");
    }
};

// Get Categories
const getCategoryWithFilter = async (req, res) => {
    try {
        const { level, parentCategory, page = 1, limit = 10, sortBy = 'createdAt', order = 'desc' } = req.query;

        const filters = {};
        if (level) filters.level = parseInt(level);
        if (parentCategory) filters.parentCategory = parentCategory;

        const sortOrder = order === 'asc' ? 1 : -1;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [categories, total] = await Promise.all([
            categoryService.getFilteredCategories(filters, sortBy, sortOrder, skip, limit),
            categoryService.countFilteredCategories(filters),
        ]);

        return sendResponse(res, 200, true, "Categories fetched successfully", categories, null, {
            total,
            page: +page,
            limit: +limit,
            totalPages: Math.ceil(total / limit),
        });
    } catch (err) {
        return sendResponse(res, err.statusCode || 500, false, err.message || "Failed to fetch categories");
    }
};

// Update Category
const updateCategory = async (req, res) => {
    const { name } = req.body;
    const { id } = req.params;

    if (!name) {
        return sendResponse(res, 422, false, "Category name is required", null, "Missing name");
    }
    if (!isValidObjectId(id)) {
        return sendResponse(res, 400, false, "Invalid category ID", null, "Invalid id");
    }

    try {
        const updatedCategory = await categoryService.updateCategoryById(id, name);
        if (!updatedCategory) {
            return sendResponse(res, 404, false, "Category not found or update failed");
        }

        return sendResponse(res, 200, true, "Category updated successfully", updatedCategory);
    } catch (err) {
        return sendResponse(res, err.statusCode || 500, false, err.message || "Failed to update category");
    }
};

// Delete Category
const deleteCategory = async (req, res) => {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
        return sendResponse(res, 400, false, "Invalid category ID", null, "Invalid id");
    }

    try {
        const deleted = await categoryService.deleteCategoryById(id);
        if (!deleted) {
            return sendResponse(res, 404, false, "Category not found or already deleted");
        }

        return sendResponse(res, 200, true, "Category deleted successfully");
    } catch (err) {
        return sendResponse(res, err.statusCode || 500, false, err.message || "Failed to delete category");
    }
};

// Get category tree
const getCategoryTreeController = async (req, res) => {
    try {
        const tree = await categoryService.getCategoryTree();
        return sendResponse(res, 200, true, "Category tree fetched successfully", tree);
    } catch (err) {
        return sendResponse(res, err.statusCode || 500, false, err.message || "Failed to fetch category tree");
    }
};


module.exports = { createCategory, deleteCategory, updateCategory, getCategoryWithFilter, getCategoryTreeController };