const mongoose = require("mongoose");

const OrderSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  menuItem: { type: Object, required: true },
  customerName: { type: String, required: true },
  phone: {
    type: String,
    required: true,
    validate: {
      validator: function (v) {
        if (!v) return false;
        // Accept formats: 10 digits starting with 6-9, optional leading 0 or +91
        return /^(?:\+91|0)?[6-9]\d{9}$/.test(v.replace(/\s+/g, ""));
      },
      message: (props) => `${props.value} is not a valid Indian phone number`,
    },
  },
  // keep `address` for backward compatibility, but prefer `roomNumber`
  address: { type: String, default: "" },
  roomNumber: { type: String, required: true },
  quantity: { type: Number, default: 1 },
  specialInstructions: { type: String, default: "" },
  total: { type: Number, required: true },
  status: { type: String, enum: ["pending", "completed"], default: "pending" },
  createdAt: { type: String, required: true },
});

module.exports = mongoose.model("Order", OrderSchema);
