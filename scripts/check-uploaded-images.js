/*
Script: check-uploaded-images.js
Usage:
  node backend/scripts/check-uploaded-images.js        # just reports missing files
  node backend/scripts/check-uploaded-images.js --fix  # replace missing images with placeholder '/uploads/default.jpg'

This script connects to MongoDB using MONGODB_URI from env, lists MenuItem documents
whose `image` points to /uploads/..., checks the filesystem for the file under backend/uploads
and reports missing files. With --fix it updates the document's image to a placeholder.
*/

const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const MenuItem = require("../models/MenuItem");

const UPLOADS_DIR = process.env.UPLOADS_DIR || "uploads";
const uploadsPath = path.join(__dirname, "..", UPLOADS_DIR);

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/spiceCentral";
const FIX = process.argv.includes("--fix");

(async function main() {
  console.log("Connecting to MongoDB...");
  try {
    await mongoose.connect(MONGODB_URI);
  } catch (err) {
    console.error(
      "Failed to connect to MongoDB:",
      err && err.message ? err.message : err,
    );
    process.exit(1);
  }

  console.log("Connected. Scanning menu items...");

  try {
    const items = await MenuItem.find().lean();
    const missing = [];
    for (const it of items) {
      const image = it.image || "";
      if (!image) continue;
      // we're only checking server uploads paths like /uploads/filename.ext or uploads/filename
      const uploadsPrefix = `/${UPLOADS_DIR}/`;
      let filename = null;
      if (image.startsWith(uploadsPrefix))
        filename = image.slice(uploadsPrefix.length);
      else if (image.startsWith(UPLOADS_DIR + "/"))
        filename = image.slice((UPLOADS_DIR + "/").length);

      if (filename) {
        const filePath = path.join(uploadsPath, filename);
        if (!fs.existsSync(filePath)) {
          missing.push({ id: it.id || it._id, name: it.name, image, filePath });
        }
      }
    }

    if (missing.length === 0) {
      console.log("All upload-backed images exist on disk.");
    } else {
      console.log(
        `Found ${missing.length} menu items referencing missing upload files:`,
      );
      missing.forEach((m) => {
        console.log(
          ` - id=${m.id} name="${m.name}" image="${m.image}" expectedPath="${m.filePath}"`,
        );
      });

      if (FIX) {
        console.log(
          '\n--fix specified: updating missing image references to "/uploads/default.jpg"',
        );
        for (const m of missing) {
          try {
            await MenuItem.updateOne(
              { $or: [{ id: m.id }, { _id: m.id }] },
              { $set: { image: "/uploads/default.jpg", imagePublicId: "" } },
            );
            console.log(`  updated ${m.id}`);
          } catch (e) {
            console.error(
              "  failed to update",
              m.id,
              e && e.message ? e.message : e,
            );
          }
        }
        console.log("Done updating documents.");
      } else {
        console.log(
          "\nRun this script with --fix to replace missing images with /uploads/default.jpg (or modify the script to change behavior).",
        );
      }
    }
  } catch (e) {
    console.error("Error scanning menu items:", e && e.message ? e.message : e);
  } finally {
    mongoose.disconnect();
  }
})();
