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
const tourApiRoutes = require("./server/src/routes/tourApiRoutes");
const tourApiService = require("./server/src/services/tourApiService");
const app = express();

app.use(cors());
app.use(express.json());

// API Path Settings
app.use("/", authRoutes);
app.use("/users", userRoutes);

app.use("/categories", categoryRoutes);
app.use("/features", featureRoutes);

app.use("/location", locationRoutes);
app.use("/review", reviewRoutes);

// 추천 알고리즘
app.use("/recommend", recommendRoutes);

// TourAPI 서비스
app.use("/tour-api", tourApiRoutes);
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
      
      // TourAPI 스케줄러 시작 (12시간마다 실행)
      tourApiService.startScheduler(12);
      console.log("🏛️ TourAPI 스케줄러 시작됨 (12시간 간격)");
    });
  })
  .catch((err) => {
    console.error("❌ MongoDB 연결 실패:", err);
    process.exit(1);
  });
