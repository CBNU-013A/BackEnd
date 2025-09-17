// utils/updateLocationAggregation.js
const Review   = require("../models/Review");
const Location = require("../models/Location");
const SubKey   = require("../models/PreferenceTag");

/**
 * 한 Location에 속한 모든 리뷰를 스캔해서
 * - aggregatedAnalysis.sentiments: 감성 키워드별 긍정 리뷰 개수
 * - aggregatedAnalysis.categories: subcategory ID별 리뷰 개수
 */
async function recomputeLocationAnalysis(locationId) {
  // 1) 모든 리뷰 불러오기
  const reviews = await Review.find({ location: locationId })
    .select("keywords categories")
    .lean();

  // 2) 기능성 감성 키워드 집계 초기화
  const sentimentCounts = {};      // ex: { "주차":0, "화장실":0, … }
  // 키워드 문서에서 목록을 가져오든, 하드코딩하든 상관없습니다.
  const sentiKeys = Object.keys(reviews[0]?.keywords?.reduce((acc,r)=>acc,{}) || {}); 
  // 간단히 첫 리뷰에서 키만 뽑아 예시
  sentiKeys.forEach(k => sentimentCounts[k] = 0);

  // 3) subcategory ID 리스트(21차원) 뽑아 초기화
  const allSubs = await SubKey.find().select("_id").lean();
  const categoryCounts = {};
  allSubs.forEach(s => categoryCounts[s._id.toString()] = 0);

  // 4) 리뷰 순회하며 집계
  for (const r of reviews) {
    // a) 감성 키워드별 'pos' 리뷰 개수만 센다 (원하시면 neg/none도 따로)
    for (const { keyword, sentiment } of r.keywords) {
      if (sentiment.pos) sentimentCounts[keyword.name] = (sentimentCounts[keyword.name]||0) + 1;
    }
    // b) subcategory 배열(categories)에 등장한 ID씩 카운트
    for (const subId of r.categories) {
      const id = subId.toString();
      if (categoryCounts[id] !== undefined) categoryCounts[id]++;
    }
  }

  // 5) Location 문서 업데이트
  await Location.findByIdAndUpdate(locationId, {
    aggregatedAnalysis: {
      sentiments: sentimentCounts,
      categories:  categoryCounts
    }
  });
}

module.exports = { recomputeLocationAnalysis };
