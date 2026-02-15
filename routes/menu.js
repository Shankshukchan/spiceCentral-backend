const express = require("express");
const router = express.Router();
const MenuItem = require("../models/MenuItem");
const multer = require("multer");
const path = require("path");

const uploadsDirName = process.env.UPLOADS_DIR || "uploads";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "..", uploadsDirName));
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + "-" + uniqueSuffix + ext);
  },
});

const upload = multer({ storage });

// Get all menu items
router.get("/", async (req, res) => {
  try {
    const items = await MenuItem.find().lean();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch menu items" });
  }
});

// Create a new menu item (supports multipart/form-data with optional image)
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const body = req.body || {};
    console.log("[menu POST] body:", body);
    console.log("[menu POST] file:", req.file);
    if (req.file) {
      // store the public path to the uploaded file
      body.image = `/${uploadsDirName}/${req.file.filename}`;
    }
    // ensure id exists
    if (!body.id) body.id = Date.now().toString();

    // Coerce types from form-data (strings) to proper types
    if (body.price) body.price = parseFloat(body.price);
    if (body.spiceLevel) body.spiceLevel = parseInt(body.spiceLevel);
    if (body.isVegetarian)
      body.isVegetarian =
        body.isVegetarian === "true" ||
        body.isVegetarian === "1" ||
        body.isVegetarian === true;

    // Try save; on duplicate id, generate a new id and retry once
    let item = new MenuItem(body);
    try {
      await item.save();
      return res.status(201).json(item);
    } catch (err) {
      if (err && err.code === 11000) {
        // duplicate key error for id
        body.id =
          Date.now().toString() + "-" + Math.floor(Math.random() * 10000);
        item = new MenuItem(body);
        await item.save();
        return res.status(201).json(item);
      }
      throw err;
    }
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Update an existing menu item
router.put("/:id", async (req, res) => {
  try {
    const updated = await MenuItem.findOneAndUpdate(
      { id: req.params.id },
      req.body,
      { new: true },
    );
    if (!updated) return res.status(404).json({ error: "Not found" });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete
router.delete("/:id", async (req, res) => {
  try {
    const removed = await MenuItem.findOneAndDelete({ id: req.params.id });
    if (!removed) return res.status(404).json({ error: "Not found" });
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
