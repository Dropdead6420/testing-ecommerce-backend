const mongoose = require("mongoose");

const categorySchema = mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: true,
        maxLength: 50
    },
    parentCategory: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "categories"
    },
    level: {
        type: Number,
        required: true
    }
})

categorySchema.index({ name: 1, level: 1 }, { unique: true });
categorySchema.index({ level: 1 });
categorySchema.index({ parentCategory: 1 });
categorySchema.index({ createdAt: -1 });

const category = mongoose.model("categories", categorySchema);
module.exports = category;