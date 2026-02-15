const mongoose = require("mongoose");

const MenuItemSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, default: "" },
  price: { type: Number, required: true },
  category: { type: String, default: "" },
  image: { type: String, default: "" },
  imagePublicId: { type: String, default: "" },
  isVegetarian: { type: Boolean, default: false },
  spiceLevel: { type: Number, default: 0 },
});

module.exports = mongoose.model("MenuItem", MenuItemSchema);
