const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config();

let _connected = false;

const connect = async () => {
  const mongoUri =
    process.env.MONGODB_URI || "mongodb://localhost:27017/spiceCentral";
  try {
    const conn = await mongoose.connect(mongoUri, {
      // recommended options can be added here
    });
    if (conn) {
      _connected = true;
      console.log("database connected");
    }
  } catch (err) {
    _connected = false;
    console.error(
      "Database connection failed:",
      err && err.message ? err.message : err,
    );
  }
};

// Helper to check current connection state
const isConnected = () => {
  try {
    // 1 = connected according to mongoose
    return mongoose.connection && mongoose.connection.readyState === 1;
  } catch (e) {
    return !!_connected;
  }
};

module.exports = connect;
module.exports.isConnected = isConnected;
