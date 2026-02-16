const express = require("express");
const router = express.Router();
const MenuItem = require("../models/MenuItem");
const multer = require("multer");
const path = require("path");
const cloudinary = require("cloudinary").v2;

// Configure Cloudinary if CLOUDINARY_URL or env vars provided
if (process.env.CLOUDINARY_URL) {
  cloudinary.config({ secure: true });
} else if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

const uploadsDirName = process.env.UPLOADS_DIR || "uploads";

// Always use memory storage: we require Cloudinary for durable uploads on deployed servers.
const storage = multer.memoryStorage();
const upload = multer({ storage });
const cloudConfigured = !!(
  process.env.CLOUDINARY_URL || process.env.CLOUDINARY_API_KEY
);

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
      // We only support Cloudinary-backed uploads. If Cloudinary isn't configured,
      // reject the file upload to avoid storing files on disk (ephemeral on many hosts).
      if (!cloudConfigured) {
        return res.status(500).json({
          error:
            "Cloudinary is not configured on the server; file uploads are disabled. Please set CLOUDINARY_URL or CLOUDINARY_* env vars.",
        });
      }

      // Upload to Cloudinary from buffer
      try {
        const uploadRes = await new Promise((resolve, reject) => {
          const stream = cloudinary.uploader.upload_stream(
            { folder: process.env.CLOUDINARY_FOLDER || "spicecentral" },
            (error, result) => {
              if (error) return reject(error);
              resolve(result);
            },
          );
          stream.end(req.file.buffer);
        });
        // Use cloudinary secure_url
        body.image = uploadRes.secure_url || uploadRes.url;
        // attach cloudinary public_id so we can cleanup on failure and persist it
        req._cloudinary_public_id = uploadRes.public_id;
        body.imagePublicId = uploadRes.public_id;
      } catch (e) {
        console.error(
          "Cloudinary upload failed:",
          e && e.message ? e.message : e,
        );
        return res.status(500).json({ error: "Image upload failed" });
      }
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
    const db = require("../db");
    if (!db.isConnected || !db.isConnected()) {
      // DB not connected; return 503
      // If file was uploaded, remove it to avoid orphaned file
      if (req.file) {
        const fs = require("fs");
        const p = path.join(__dirname, "..", uploadsDirName, req.file.filename);
        try {
          if (fs.existsSync(p)) fs.unlinkSync(p);
        } catch (e) {
          console.error(
            "Failed to remove uploaded file after DB failure:",
            e && e.message ? e.message : e,
          );
        }
      }
      return res.status(503).json({ error: "Database not connected" });
    }

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
      // On save error, clean up uploaded file or cloudinary asset if present
      if (req.file) {
        try {
          const cloudConfigured =
            process.env.CLOUDINARY_URL || process.env.CLOUDINARY_API_KEY;
          if (cloudConfigured && req._cloudinary_public_id) {
            await cloudinary.uploader.destroy(req._cloudinary_public_id);
          } else {
            const fs = require("fs");
            const p = path.join(
              __dirname,
              "..",
              uploadsDirName,
              req.file.filename,
            );
            try {
              if (fs.existsSync(p)) fs.unlinkSync(p);
            } catch (e) {
              console.error(
                "Failed to remove uploaded file after save error:",
                e && e.message ? e.message : e,
              );
            }
          }
        } catch (cleanupErr) {
          console.error(
            "Error cleaning up uploaded artifact after save error:",
            cleanupErr && cleanupErr.message ? cleanupErr.message : cleanupErr,
          );
        }
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
    const existing = await MenuItem.findOne({ id: req.params.id });
    if (!existing) return res.status(404).json({ error: "Not found" });

    // If Cloudinary is configured and there is a previous public id and the image changed, remove the old asset
    try {
      const cloudConfigured =
        process.env.CLOUDINARY_URL || process.env.CLOUDINARY_API_KEY;
      if (
        cloudConfigured &&
        existing.imagePublicId &&
        req.body.image &&
        req.body.image !== existing.image
      ) {
        await cloudinary.uploader.destroy(existing.imagePublicId);
      }
    } catch (e) {
      console.error(
        "Failed to remove old cloudinary asset on update:",
        e && e.message ? e.message : e,
      );
    }

    const updated = await MenuItem.findOneAndUpdate(
      { id: req.params.id },
      req.body,
      { new: true },
    );
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

    try {
      const cloudConfigured =
        process.env.CLOUDINARY_URL || process.env.CLOUDINARY_API_KEY;
      if (cloudConfigured && removed.imagePublicId) {
        await cloudinary.uploader.destroy(removed.imagePublicId);
      } else if (
        removed.image &&
        removed.image.startsWith(`/${uploadsDirName}/`)
      ) {
        // remove local file if it exists
        const fs = require("fs");
        const p = path.join(__dirname, "..", removed.image.replace(/^\//, ""));
        try {
          if (fs.existsSync(p)) fs.unlinkSync(p);
        } catch (e) {
          console.error(
            "Failed to remove local uploaded file on delete:",
            e && e.message ? e.message : e,
          );
        }
      }
    } catch (e) {
      console.error(
        "Error cleaning up image for deleted menu item:",
        e && e.message ? e.message : e,
      );
    }

    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
