const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

const connect = async () => {
  const mongoUri =
    process.env.MONGODB_URI || "mongodb://localhost:27017/spiceCentral";
  try {
    const conn = await mongoose.connect(mongoUri);
    if (conn) {
      console.log("database connected");
    }
  } catch (err) {
    console.error("Database connection failed:", err);
  }
};

module.exports = connect;
