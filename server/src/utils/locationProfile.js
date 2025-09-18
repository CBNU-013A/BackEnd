// utils/locationProfile.js
const Review = require("../models/Review");

/**
 * Build a location profile by averaging all review frequency vectors
 * @param {String} locationId
 * @param {String[]} allSubKeywordIds  // 전체 21차원 리스트
 * @returns {Object} { subId: averageFrequency }
 */
async function buildLocationVector(locationId, allSubKeywordIds) {
  // 1) 이 location의 모든 리뷰에서 frequencies만 뽑아오기
  const reviews = await Review.find({ location: locationId })
    .select("frequencies")
    .lean();

  // 2) 리뷰 수
  const n = reviews.length || 1;

  // 3) 합산
  const sumFreq = {};
  allSubKeywordIds.forEach((id) => (sumFreq[id] = 0));

  reviews.forEach((r) => {
    for (const [key, cnt] of Object.entries(r.frequencies || {})) {
      if (sumFreq.hasOwnProperty(key)) sumFreq[key] += cnt;
    }
  });

  // 4) 평균 벡터
  const avgFreq = {};
  allSubKeywordIds.forEach((id) => {
    avgFreq[id] = sumFreq[id] / n;
  });

  return avgFreq;
}

module.exports = { buildLocationVector };
