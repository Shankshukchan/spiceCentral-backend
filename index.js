const express = require("express");
const connect = require("./db.js");
const cors = require("cors");
const dotenv = require("dotenv");
const cron = require("node-cron");
const http = require("http");

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
  const lastError = db.getLastError ? db.getLastError() : null;
  res.json({
    ok: true,
    dbConnected: !!connected,
    lastError: lastError || null,
  });
});

app.use("/api/menu", menuRouter);
app.use("/api/orders", ordersRouter);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`server running at port ${PORT}`);
});

// Keep server alive on Render - ping self every 15 minutes
if (process.env.NODE_ENV !== "development") {
  cron.schedule("*/15 * * * *", () => {
    const apiUrl = process.env.API_URL;
    http
      .get(`${apiUrl}/health`, (res) => {
        console.log(
          `Health check at ${new Date().toISOString()}: ${res.statusCode}`,
        );
      })
      .on("error", (err) => {
        console.error(`Health check error: ${err.message}`);
      });
  });
  console.log("Cron job scheduled to keep server alive every 15 minutes");
}
