// const express = require("express");
// const mongoose = require("mongoose");
// const cors = require("cors");
// const dotenv = require("dotenv");

// const authRoutes = require("./routes/authRoutes");
// const userRoutes = require("./routes/userRoutes");
// const keywordRoutes = require("./routes/keywordRoutes");
// const locationRoutes = require("./routes/locationRoutes");

// dotenv.config();

// const app = express();
// const router = express.Router(); // 🔥 추가

// app.use(cors());
// app.use(express.json());

// // 모든 라우트를 router에 등록
// router.use("/apit/auth", authRoutes);
// router.use("/api/users", userRoutes);
// router.use("/api/keywords", keywordRoutes);
// router.use("/api/location", locationRoutes);

// // app에 "/api"로 router 통합 적용
// app.use("/api", router);

// const PORT = process.env.PORT || 8001;

// mongoose.connect(process.env.MONGO_URI)
//   .then(() => {
//     console.log("✅ MongoDB 연결 성공!");
//     app.listen(PORT, () => {
//       console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
//     });
//   })
//   .catch((error) => {
//     console.error("❌ MongoDB 연결 실패:", error);
//     process.exit(1);
//   });