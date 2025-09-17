require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// 각각 라우터 직접 연결
const authRoutes = require("./server/src/routes/authRoutes");
const userRoutes = require("./server/src/routes/userRoutes");
const locationRoutes = require("./server/src/routes/locationRoutes");
const reviewRoutes = require("./server/src/routes/reviewRoutes");
const categoryRoutes = require("./server/src/routes/categoryRoutes");
const featureRoutes = require("./server/src/routes/featureRoutes");
const recommendRoutes = require("./server/src/routes/recommendRoutes");
const app = express();

app.use(cors());
app.use(express.json());

// API Path Settings
app.use("/api", authRoutes);
app.use("/api/users", userRoutes);

app.use("/api/categories", categoryRoutes);
app.use("/api/features", featureRoutes);

app.use("/api/location", locationRoutes);
app.use("/api/review", reviewRoutes);

// 추천 알고리즘
app.use("/api/recommend", recommendRoutes);
const PORT = process.env.PORT || 8001;

// MongoDB 연결
const mongoURI =
  `mongodb+srv://${process.env.MONGO_INITDB_ROOT_USERNAME}:${process.env.MONGO_INITDB_ROOT_PASSWORD}` +
  `@${process.env.MONGO_CLUSTER}/${process.env.MONGO_DB}?retryWrites=true&w=majority`;

mongoose
  .connect(mongoURI)
  .then(() => {
    console.log("✅ MongoDB 연결 성공");
    app.listen(PORT, () => {
      console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB 연결 실패:", err);
    process.exit(1);
  });
