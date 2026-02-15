const express = require("express");
const router = express.Router();
const Order = require("../models/Order");

// List all orders
router.get("/", async (req, res) => {
  try {
    const orders = await Order.find().lean();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// Create an order
router.post("/", async (req, res) => {
  try {
    const order = new Order(req.body);
    await order.save();
    res.status(201).json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update order status
router.patch("/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    if (!["pending", "completed"].includes(status))
      return res.status(400).json({ error: "Invalid status" });
    const updated = await Order.findOneAndUpdate(
      { id: req.params.id },
      { status },
      { new: true },
    );
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete an order
router.delete("/:id", async (req, res) => {
  try {
    const removed = await Order.findOneAndDelete({ id: req.params.id });
    if (!removed) return res.status(404).json({ error: "Not found" });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
