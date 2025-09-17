// scripts/migrateReviews.js
require("dotenv").config();
const mongoose = require("mongoose");
const Review = require("../server/src/models/Review");
const { recomputeLocationAnalysis } = require("../server/src/utils/locationAnalysis");
const {
  requestanalyzeReview,
  processSentiments,
} = require("../server/src/controller/reviewController");
const connectDB = require("./database");

async function migrate() {
  //await mongoose.connect(process.env.MONGODB_URI);
  await connectDB();

  const reviews = await Review.find().lean();
  console.log(`총 ${reviews.length}개의 리뷰 마이그레이션 시작`);

  for (const r of reviews) {
    // 1) 감성 분석 API 호출
    const sentiments = await requestanalyzeReview(r.content);
    if (!sentiments) {
      console.warn(`감성 분석 실패: 리뷰ID=${r._id}`);
      continue;
    }

    // 2) 후처리 & Review 문서 업데이트
    const keywordArray = await processSentiments(sentiments);
    await Review.findByIdAndUpdate(r._id, { keywords: keywordArray });
    console.log(`Processed Review ${r._id}`);

    // 3) 위치별 종합 집계 업데이트
    await recomputeLocationAnalysis(r.location);
  }

  console.log("마이그레이션 완료");
  mongoose.disconnect();
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
