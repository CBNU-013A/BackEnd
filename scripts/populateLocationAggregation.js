// scripts/populateLocationAggregation.js
require("dotenv").config();
const mongoose = require("mongoose");
const Location = require("../server/src/models/Location");
const {
  recomputeLocationAnalysis,
} = require("../server/src/utils/updateLocationAggregation");
const connectDB = require("./database");

async function populateAll() {
  await connectDB();
  console.log("✅ MongoDB 연결 성공");

  // 1) 모든 Location ID 조회
  const locs = await Location.find().select("_id").lean();
  console.log(`총 ${locs.length}개 Location 분석 시작`);

  // 2) 순차 혹은 병렬로 각 Location 집계 갱신
  for (const { _id } of locs) {
    try {
      await recomputeLocationAnalysis(_id);
      console.log(`✔ ${_id} 집계 완료`);
    } catch (err) {
      console.error(`✖ ${_id} 집계 실패:`, err.message);
    }
  }

  console.log("🏁 모든 Location 집계 완료");
  await mongoose.disconnect();
  console.log("🔌 MongoDB 연결 해제");
}

populateAll().catch((err) => {
  console.error("스크립트 실행 중 에러:", err);
  process.exit(1);
});
