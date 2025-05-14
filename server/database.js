const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config(); // .env 파일 로드

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      auth: {
        username: process.env.MONGO_INITDB_ROOT_USERNAME,
        password: process.env.MONGO_INITDB_ROOT_PASSWORD,
      },
      authSource: "admin", // 🔥 꼭 추가해야 함! (루트 계정은 admin에 저장되어 있음)
    });
    console.log("✅ MongoDB 연결 성공!");
  } catch (error) {
    console.error("❌ MongoDB 연결 실패:", error);
    process.exit(1);
  }
}

module.exports = connectDB;
re("mongoose");
const dotenv = require("dotenv");

dotenv.config(); // .env 파일 로드

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      auth: {
        username: process.env.MONGO_INITDB_ROOT_USERNAME,
        password: process.env.MONGO_INITDB_ROOT_PASSWORD,
      },
      authSource: "admin", // 🔥 꼭 추가해야 함! (루트 계정은 admin에 저장되어 있음)
    });
    console.log("✅ MongoDB 연결 성공!");
  } catch (error) {
    console.error("❌ MongoDB 연결 실패:", error);
    process.exit(1);
  }
}

module.exports = connectDB;
