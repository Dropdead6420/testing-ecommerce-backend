// wishlist.model.js
const mongoose = require("mongoose");

const wishlistSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
    required: true
  },
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "products",
    required: true
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
});

wishlistSchema.index({ user: 1, product: 1 }, { unique: true });

module.exports = mongoose.model("wishlist", wishlistSchema);
