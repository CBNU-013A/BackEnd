// utils/locationAnalysis.js
const Review = require("../models/Review");
const Location = require("../models/Location");

// 집계할 키워드 목록 (모델에 저장된 name과 정확히 일치해야 합니다)
const KEYWORDS = [
  "주차",
  "화장실",
  "활동",
  "시설관리",
  "혼잡도",
  "접근성",
  "편의시설",
  "가성비",
  "아이 동반",
  "노약자 동반",
  "장소",
];
const CAT_KEYS = ["계절", "동반", "장소", "활동"];

const DEFAULT_SENT = { pos: 0, neg: 0, none: 0 };

/**
 * 특정 locationId 에 속한 모든 리뷰를 다시 읽어와
 * - keywords.keyword 를 populate 해서 name 가져오기
 * - sentiment 별로 pos/neg/none 카운트
 * - 리뷰.categories 필드가 있다면 최빈값 집계
 */
async function recomputeLocationAnalysis(locationId) {
  // 1) 리뷰 불러오기 (keywords.keyword.name 을 읽기 위해 populate)
  const reviews = await Review.find({ location: locationId })
    .populate("keywords.keyword", "name")
    .select("keywords categories")
    .lean();

  // 2) 초기화
  const sentimentAgg = {};
  KEYWORDS.forEach((k) => {
    sentimentAgg[k] = { ...DEFAULT_SENT };
  });

  const categoryCounts = {};
  CAT_KEYS.forEach((c) => {
    categoryCounts[c] = {};
  });

  // 3) 리뷰 순회
  for (const r of reviews) {
    // ▶ 키워드 집계
    if (Array.isArray(r.keywords)) {
      for (const { keyword, sentiment } of r.keywords) {
        if (!keyword || !keyword.name) continue;
        const name = keyword.name;
        if (!sentimentAgg[name]) continue;
        if (sentiment.pos) sentimentAgg[name].pos++;
        else if (sentiment.neg) sentimentAgg[name].neg++;
        else sentimentAgg[name].none++;
      }
    }

    // ▶ 카테고리 집계 (리뷰에 categories 필드가 저장돼 있을 때)
    if (r.categories) {
      for (const catKey of CAT_KEYS) {
        const val = r.categories[catKey];
        if (!val) continue;
        categoryCounts[catKey][val] = (categoryCounts[catKey][val] || 0) + 1;
      }
    }
  }

  // 4) 카테고리 최빈값 선택
  const categoryAgg = {};
  CAT_KEYS.forEach((cKey) => {
    const counts = categoryCounts[cKey];
    let max = 0,
      pick = "none";
    for (const [val, cnt] of Object.entries(counts)) {
      if (cnt > max) {
        max = cnt;
        pick = val;
      }
    }
    categoryAgg[cKey] = pick;
  });

  // 5) Location 업데이트
  await Location.findByIdAndUpdate(locationId, {
    aggregatedAnalysis: {
      sentiments: sentimentAgg,
      categories: categoryAgg,
    },
  });
}

module.exports = { recomputeLocationAnalysis };
