const mongoose = require("mongoose");
const slugify = require("slugify");

const variationOptionSchema = new mongoose.Schema({
    title: String,
    color: [{
        type: String
    }],
    sizes: [{
        _id: false,
        name: { type: String, trim: true },
        quantity: { type: Number, min: 0, default: 0 }
    }],
    price: { type: Number, min: 0 },
    discountedPrice: {
        type: Number,
        min: [0, "Discounted price must be positive"]
    },
    discountPercent: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    quantity: { type: Number, min: 0, default: 0 },
    isActive: { type: Boolean, default: true },
}, { _id: true });

const gallerySchema = new mongoose.Schema({
    id: Number,
    original: { type: String },
    thumbnail: { type: String }
}, { _id: false });

const tagSchema = new mongoose.Schema({
    id: Number,
    name: String,
    slug: String
}, { _id: false });

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Product name is required"],
        trim: true,
        index: 'text'
    },
    slug: {
        type: String,
        unique: true,
        trim: true
    },
    description: {
        type: String,
        required: [true, "Product description is required"],
        trim: true
    },
    price: {
        type: Number,
        min: [0, "Price must be positive"]
    },
    discountedPrice: {
        type: Number,
        min: [0, "Discounted price must be positive"]
    },
    discountPercent: {
        type: Number,
        min: 0,
        max: 100,
        default: 0
    },
    quantity: {
        type: Number,
        required: true,
        min: [0, "Quantity cannot be negative"]
    },
    brand: {
        type: String,
        trim: true
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "categories",
        required: true
    },
    tag: {
        type: [tagSchema],
        default: []
    },
    gallery: {
        type: [gallerySchema],
        default: []
    },

    reviews: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "reviews"
    }],
    numRatings: {
        type: Number,
        default: 0
    },
    averageRating: {
        type: Number,
        default: 0,
        min: 0,
        max: 5
    },
    isActive: {
        type: Boolean,
        default: true
    },
    image: {
        type: String,
        trim: true
    },
    variation_options: {
        type: [variationOptionSchema],
    },
}, {
    timestamps: true
});

productSchema.index({ name: "text", description: "text", brand: 1, category: 1, isActive: 1 });
productSchema.index({ slug: 1 });

// Slug auto-generation middleware
productSchema.pre("validate", async function (next) {
    if (!this.slug && this.name) {
        const Product = mongoose.model("products");
        let baseSlug = slugify(this.name, { lower: true, strict: true });
        let slug = baseSlug;
        let counter = 1;

        // Check for duplicates
        while (await Product.exists({ slug })) {
            slug = `${baseSlug}-${counter++}`;
        }

        this.slug = slug;
    }
    next();
});

module.exports = mongoose.model("products", productSchema);