const Category = require("./category.model");
const Product = require("../product/product.model");

const findCategoryByNameAndLevel = async (name, level) => {
    return await Category.findOne({ name, level }).lean();
};

const findCategoryById = async (id) => {
    return await Category.findById(id).lean();
};

const createCategory = async ({ name, level, parentCategory }) => {
    const newCategory = new Category({ name, level });

    if (level == 1) {
        return await newCategory.save();
    }

    // Subcategory validation
    const parent = await findCategoryById(parentCategory);

    if (!parent) {
        const error = new Error("Parent category not found");
        error.statusCode = 404;
        throw error;
    }

    if (parent.level >= level) {
        const error = new Error("Category level must be greater than its parent category");
        error.statusCode = 400;
        throw error;
    }

    newCategory.parentCategory = parentCategory;
    return await newCategory.save();
};

const getFilteredCategories = async (filters, sortBy, sortOrder, skip, limit) => {
    return await Category.find(filters)
        .sort({ [sortBy]: sortOrder })
        .skip(skip)
        .limit(parseInt(limit))
        .lean();
};

const countFilteredCategories = async (filters) => {
    return await Category.countDocuments(filters);
};

const updateCategoryById = async (id, name) => {
    const category = await findCategoryById(id);
    if (!category) {
        const error = new Error("Category not found");
        error.statusCode = 404;
        throw error;
    }

    const duplicate = await findCategoryByNameAndLevel(name, category.level);
    if (duplicate && String(duplicate._id) !== String(id)) {
        const error = new Error("Another category with the same name and level already exists");
        error.statusCode = 409;
        throw error;
    }

    return await Category.findByIdAndUpdate(id, { name }, { new: true });
};

const deleteCategoryById = async (id) => {
    const category = await findCategoryById(id);
    if (!category) {
        const error = new Error("Category not found");
        error.statusCode = 404;
        throw error;
    }

    const categoriesToDelete = [];

    // Recursive DFS to validate and collect all deletable categories
    const traverseAndValidate = async (categoryId) => {
        const hasProduct = await Product.exists({ category: categoryId });
        if (hasProduct) {
            const error = new Error("Cannot delete category: a product is associated with this or a subcategory");
            error.statusCode = 400;
            throw error;
        }

        categoriesToDelete.push(categoryId);

        const subcategories = await Category.find({ parentCategory: categoryId }).select("_id").lean();
        for (const sub of subcategories) {
            await traverseAndValidate(sub._id);
        }
    };

    await traverseAndValidate(category._id);

    const result = await Category.deleteMany({ _id: { $in: categoriesToDelete } });
    return result.deletedCount > 0;
};

// Chat gpt
const getCategoryTree = async () => {
    const allCategories = await Category.find().sort({ level: 1, name: 1, parentCategory: 1 })
        .sort({ name: 1 })
        .lean();

    const categoryMap = new Map();
    const rootCategories = [];

    for (const cat of allCategories) {
        cat.children = [];
        categoryMap.set(String(cat._id), cat);
    }

    for (const cat of allCategories) {
        if (cat.parentCategory) {
            const parent = categoryMap.get(String(cat.parentCategory));
            if (parent) {
                parent.children.push({ _id: cat._id, name: cat.name, children: cat.children });
            }
        } else {
            rootCategories.push({ _id: cat._id, name: cat.name, children: cat.children });
        }
    }

    return rootCategories;
};


module.exports = {
    findCategoryByNameAndLevel,
    createCategory,
    getFilteredCategories,
    updateCategoryById,
    deleteCategoryById,
    findCategoryById,
    countFilteredCategories,
    getCategoryTree
};