require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// 각각 라우터 직접 연결
const authRoutes = require("./server/routes/authRoutes");
const userRoutes = require("./server/routes/userRoutes");
const keywordRoutes = require("./server/routes/keywordsRoutes");
const locationRoutes = require("./server/routes/locationRoutes");
const reviewRoutes = require("./server/routes/reviewRoutes");
const userLikeRoutes = require("./server/routes/userLikeRoutes");
const locationLikeRoutes = require("./server/routes/locationLikeRoutes");
const categoryRoutes = require("./server/routes/categoryRoutes");
const featureRoutes = require("./server/routes/featureRoutes");
const recommendRoutes = require("./server/routes/recommendRoutes");
const predictRoutes = require("./server/routes/predictRoutes");
const app = express();

app.use(cors());
app.use(express.json());

// ❗ API 경로 설정 (여기가 아주 중요)
app.use("/api", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/keywords", keywordRoutes);
app.use("/api/location", locationRoutes);
app.use("/api/review", reviewRoutes);
app.use("/api/users", userLikeRoutes);
app.use("/api/location", locationLikeRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/features", featureRoutes);
app.use("/api/recommend", recommendRoutes);
app.use("/api/predict", predictRoutes);
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
