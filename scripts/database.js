const mongoose = require("mongoose");

require("dotenv").config();

const mongoURI =
  `mongodb+srv://${process.env.MONGO_INITDB_ROOT_USERNAME}:${process.env.MONGO_INITDB_ROOT_PASSWORD}` +
  `@${process.env.MONGO_CLUSTER}/${process.env.MONGO_DB}?retryWrites=true&w=majority`;

async function connectDB() {
  console.log("🔍 URI:", process.env.MONGODB_URI);
  try {
    await mongoose.connect(mongoURI);
    console.log("✅ MongoDB 연결 성공!");
  } catch (error) {
    console.error("❌ MongoDB 연결 실패:", error);
    process.exit(1);
  }
}

module.exports = connectDB;
