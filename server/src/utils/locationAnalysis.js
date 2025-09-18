// utils/locationAnalysis.js
const Review = require("../models/Review");
const Location = require("../models/Location");
const SentimentAspect = require("../models/SentimentAspect");

const DEFAULT_SENT = { pos: 0, neg: 0, none: 0 };

/**
 * 새 스키마 기준 집계
 * - 리뷰.sentimentAspects: [{ aspect:ObjectId, sentiment:{pos,neg,none} }]
 *   → Location.aggregatedAnalysis.sentimentAspects: { [aspectName]: {pos,neg,none} }
 * - 리뷰.categories: [{ category:ObjectId, value:{ tag:ObjectId } }]
 *   → Location.aggregatedAnalysis.categories: { [tagId]: { category: <catId>, value: { tag:<tagId>, count } } }
 */
async function recomputeLocationAnalysis(locationId) {
  // 1) 리뷰 불러오기 (감성 키워드 이름 위해 populate)
  const reviews = await Review.find({ location: locationId })
    .populate("sentimentAspects.aspect", "name")
    .select("sentimentAspects categories")
    .lean();

  // 2) 초기화 컨테이너
  const sentimentAgg = {}; // { [aspectName]: {pos,neg,none} }
  const categoryAgg = {}; // { [tagId]: { category, value:{ tag, count } } }

  // 3) 리뷰 순회
  for (const r of reviews) {
    // ▶ 감성 키워드 집계
    if (Array.isArray(r.sentimentAspects)) {
      for (const item of r.sentimentAspects) {
        const aspectName = item?.aspect?.name;
        const s = item?.sentiment || {};
        if (!aspectName) continue;
        if (!sentimentAgg[aspectName]) sentimentAgg[aspectName] = { ...DEFAULT_SENT };
        if (s.pos) sentimentAgg[aspectName].pos += Number(!!s.pos);
        if (s.neg) sentimentAgg[aspectName].neg += Number(!!s.neg);
        if (s.none) sentimentAgg[aspectName].none += Number(!!s.none);
      }
    }

    // ▶ 카테고리/태그 카운트 집계
    if (Array.isArray(r.categories)) {
      for (const c of r.categories) {
        const catId = c?.category?.toString?.();
        const tagId = c?.value?.tag?.toString?.();
        if (!catId || !tagId) continue;
        if (!categoryAgg[tagId]) {
          categoryAgg[tagId] = { category: c.category, value: { tag: c.value.tag, count: 0 } };
        }
        categoryAgg[tagId].value.count += 1;
      }
    }
  }

  // 4) Location 업데이트 (Map 호환을 위해 평범한 객체 사용)
  await Location.findByIdAndUpdate(locationId, {
    aggregatedAnalysis: {
      sentimentAspects: sentimentAgg,
      categories: categoryAgg,
    },
  });
}

module.exports = { recomputeLocationAnalysis };
