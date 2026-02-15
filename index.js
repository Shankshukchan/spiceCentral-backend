const express = require("express");
const connect = require("./db.js");
const cors = require("cors");
const dotenv = require("dotenv");

// Load environment variables from .env if present
dotenv.config();

connect();

const app = express();
app.use(express.json());
app.use(cors());
const path = require("path");
const fs = require("fs");

// Use env for uploads directory (fallback to ./uploads)
const uploadsDirName = process.env.UPLOADS_DIR || "uploads";
const uploadsDir = path.join(__dirname, uploadsDirName);
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir);

// serve uploaded images
app.use(`/${uploadsDirName}`, express.static(uploadsDir));

// Routes
const menuRouter = require("./routes/menu");
const ordersRouter = require("./routes/orders");
const db = require("./db");

app.get("/health", (req, res) => {
  const connected = db.isConnected ? db.isConnected() : false;
  res.json({ ok: true, dbConnected: !!connected });
});

app.use("/api/menu", menuRouter);
app.use("/api/orders", ordersRouter);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`server running at port ${PORT}`);
});
