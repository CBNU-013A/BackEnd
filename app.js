require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const serverRouter = require("./server/routes/authRoutes"); // 🔹 Router만 불러오기

const app = express();

app.use(express.json()); // POST 요청 처리
app.use("/api", serverRouter); // 🔹 /api 이하 라우팅은 server.js에서 처리

// MongoDB 연결
const mongoURI =
  `mongodb+srv://${process.env.MONGO_INITDB_ROOT_USERNAME}:${process.env.MONGO_INITDB_ROOT_PASSWORD}` +
  `@${process.env.MONGO_CLUSTER}/${process.env.MONGO_DB}?retryWrites=true&w=majority`;

mongoose
  .connect(mongoURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("✅ MongoDB 연결 성공");

    const PORT = process.env.PORT || 8001;
    app.listen(PORT, () => {
      console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB 연결 실패:", err);
    process.exit(1);
  });
