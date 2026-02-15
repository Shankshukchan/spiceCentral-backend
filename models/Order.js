const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  menuItem: { type: Object, required: true },
  customerName: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String, default: "" },
  quantity: { type: Number, default: 1 },
  specialInstructions: { type: String, default: "" },
  total: { type: Number, required: true },
  status: { type: String, enum: ["pending", "completed"], default: "pending" },
  createdAt: { type: String, required: true },
});

module.exports = mongoose.model("Order", OrderSchema);
