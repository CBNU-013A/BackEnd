// scripts/updateSentimentsAggregation.js
require("dotenv").config();
const mongoose = require("mongoose");
const Review = require("../server/src/models/Review");
const Location = require("../server/src/models/Location");
const Keyword = require("../server/src/models/Keyword");
const connectDB = require("./database");

async function recomputeSentiments(locationId) {
  // 1) 이 location의 모든 리뷰에서 keywords 배열 가져오기
  const reviews = await Review.find({ location: locationId })
    .select("keywords")
    .lean();

  // 2) 전체 Keyword ID 목록 미리 로드 (21개)
  const allKeys = (await Keyword.find().select("_id").lean()).map((k) =>
    k._id.toString()
  );

  // 3) 초기화: { "<keyId>": { pos:0, neg:0, none:0 } }
  const agg = {};
  allKeys.forEach((id) => {
    agg[id] = { pos: 0, neg: 0, none: 0 };
  });

  // 4) 리뷰 순회하며 카운트
  for (const r of reviews) {
    for (const { keyword, sentiment } of r.keywords) {
      const k = keyword.toString();
      if (!agg[k]) continue;
      if (sentiment.pos) agg[k].pos++;
      else if (sentiment.neg) agg[k].neg++;
      else agg[k].none++;
    }
  }

  // 5) Location 문서 업데이트
  await Location.findByIdAndUpdate(locationId, {
    $set: { "aggregatedAnalysis.sentiments": agg },
  });
}

async function run() {
  await connectDB();

  const locs = await Location.find().select("_id").lean();
  for (const { _id } of locs) {
    try {
      await recomputeSentiments(_id);
      console.log(`✔ ${_id} 감성 집계 완료`);
    } catch (err) {
      console.error(`✖ ${_id} 집계 실패:`, err.message);
    }
  }

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error("스크립트 오류:", err);
  process.exit(1);
});
