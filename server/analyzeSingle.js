// analyzeSingleReview.js
require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./database");
const Location = require("./models/Location");

// 모델/유틸
const Review = require("./models/Review");
const {
  requestanalyzeReview,
  processSentiments,
} = require("./controller/reviewController");
const { recomputeLocationAnalysis } = require("./utils/locationAnalysis");

async function analyze(locationId) {
  // 1) MongoDB 연결
  await connectDB();
  console.log(`🗄️  MongoDB 연결 완료`);

  // 2) 해당 location 리뷰 불러오기
  const reviews = await Review.find({ location: locationId }).lean();
  console.log(`🔎 ${reviews.length}개의 리뷰 조회됨`);

  // 3) 리뷰별 감성 분석 + Review.keywords 저장
  for (const r of reviews) {
    console.log(`\n▶ 리뷰 ${r._id} 분석 시작`);
    const sentiments = await requestanalyzeReview(r.content);
    if (!sentiments) {
      console.warn(`❌ 리뷰 ${r._id} 감성 분석 실패`);
      continue;
    }

    const keywordArray = await processSentiments(sentiments);
    await Review.findByIdAndUpdate(r._id, { keywords: keywordArray });
    console.log(`✅ 리뷰 ${r._id} keywords 업데이트 완료`);
  }

  // 4) Location aggregatedAnalysis 재계산
  await recomputeLocationAnalysis(locationId);
  console.log(`\n🏁 Location ${locationId} aggregatedAnalysis 업데이트 완료`);

  // 5) 업데이트된 Location 문서 조회 및 출력
  const updated = await Location.findById(locationId)
    .select("aggregatedAnalysis")
    .lean();
  console.log(
    `\n📊 최종 aggregatedAnalysis:\n`,
    JSON.stringify(updated.aggregatedAnalysis, null, 2)
  );

  await mongoose.disconnect();
  console.log(`🔌 MongoDB 연결 해제`);
}

// 실행: node scripts/analyzeOneLocation.js <LocationID>
const [, , locationId] = process.argv;
if (!locationId) {
  console.error("Usage: node analyzeOneLocation.js <LocationID>");
  process.exit(1);
}

analyze(locationId).catch((err) => {
  console.error("분석 중 오류:", err);
  process.exit(1);
});
