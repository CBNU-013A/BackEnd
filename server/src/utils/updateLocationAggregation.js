// utils/updateLocationAggregation.js
const Review   = require("../models/Review");
const Location = require("../models/Location");

/**
 * 새 스키마 기준 간소 집계기
 * - sentimentAspects[].sentiment의 pos/neg/none 단순 합산 (aspect 이름 없이 총계)
 * - categories[]의 value.tag 별 count 합산 → Location.aggregatedAnalysis.categories에 반영
 */
async function recomputeLocationAnalysis(locationId) {
  const reviews = await Review.find({ location: locationId })
    .select("sentimentAspects categories")
    .lean();

  const sentimentTotals = { pos: 0, neg: 0, none: 0 };
  const tagCounts = {}; // { [tagId]: { category, value:{ tag, count } } }

  for (const r of reviews) {
    // 감성 총계
    if (Array.isArray(r.sentimentAspects)) {
      for (const item of r.sentimentAspects) {
        const s = item?.sentiment || {};
        if (s.pos) sentimentTotals.pos += Number(!!s.pos);
        if (s.neg) sentimentTotals.neg += Number(!!s.neg);
        if (s.none) sentimentTotals.none += Number(!!s.none);
      }
    }

    // 태그 카운트
    if (Array.isArray(r.categories)) {
      for (const c of r.categories) {
        const catId = c?.category;
        const tagId = c?.value?.tag;
        if (!catId || !tagId) continue;
        const key = String(tagId);
        if (!tagCounts[key]) tagCounts[key] = { category: catId, value: { tag: tagId, count: 0 } };
        tagCounts[key].value.count += 1;
      }
    }
  }

  await Location.findByIdAndUpdate(locationId, {
    aggregatedAnalysis: {
      sentimentAspects: sentimentTotals,
      categories: tagCounts,
    }
  });
}

module.exports = { recomputeLocationAnalysis };
