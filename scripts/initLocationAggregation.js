// scripts/initLocationAggregation.js
require("dotenv").config();
const mongoose = require("mongoose");
const Location = require("../server/src/models/Location");
const connectDB = require("./database");

async function init() {
  await connectDB();
  console.log("✅ MongoDB 연결 성공");

  // aggregatedAnalysis 가 없는 문서만 찾아서 빈 구조로 세팅
  const result = await Location.updateMany(
    { aggregatedAnalysis: { $exists: false } },
    {
      $set: {
        aggregatedAnalysis: {
          sentiments: {}, // Map<감성키워드, count>
          categories: {}, // Map<소분류ID, count>
        },
      },
    }
  );

  console.log(
    `✨ matched ${result.matchedCount}, modified ${result.modifiedCount} 문서에 aggregatedAnalysis 초기 설정 완료`
  );
  await mongoose.disconnect();
  console.log("🔌 MongoDB 연결 해제");
}

init().catch((err) => {
  console.error("❌ initLocationAggregation 에러:", err);
  process.exit(1);
});
