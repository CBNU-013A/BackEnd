// utils/locationAnalysis.js
const Review = require("../models/Review");
const Location = require("../models/Location");

const DEFAULT_SENT = {
  pos: 0,
  neg: 0,
  none: 0,
};

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

/**
 * locationId에 속한 모든 리뷰를 다시 읽어
 * sentiments 별로 pos/neg/none 개수를 세고,
 * categories 는 가장 많이 등장한 값을 택해 저장
 */
async function recomputeLocationAnalysis(locationId) {
  // 1) 해당 location 리뷰 전부 조회
  const reviews = await Review.find({ location: locationId })
    .select("keywords categories") // 생성 시에 categories도 저장해두셨다면
    .lean();

  // 2) sentiment 집계 초기화
  const sentimentAgg = {};
  KEYWORDS.forEach((k) => {
    sentimentAgg[k] = { ...DEFAULT_SENT };
  });

  // 3) 카테고리별 등장 횟수 카운터
  const categoryCounts = {};
  CAT_KEYS.forEach((c) => {
    categoryCounts[c] = {};
  });

  // 4) 모든 리뷰 순회하며 집계
  for (const r of reviews) {
    // — sentiments: Review.keywords 배열을 가정
    if (r.keywords) {
      r.keywords.forEach((kwObj) => {
        const name = kwObj.keywordName || kwObj.keyword;
        const { pos, neg } = kwObj.sentiment;
        if (name && sentimentAgg[name]) {
          if (pos) sentimentAgg[name].pos++;
          else if (neg) sentimentAgg[name].neg++;
          else sentimentAgg[name].none++;
        }
      });
    }
    // — categories: Review.categories 객체를 가정
    if (r.categories) {
      CAT_KEYS.forEach((cKey) => {
        const val = r.categories[cKey];
        if (!val) return;
        categoryCounts[cKey][val] = (categoryCounts[cKey][val] || 0) + 1;
      });
    }
  }

  // 5) categories는 가장 많이 나온 값을 선택
  const categoryAgg = {};
  CAT_KEYS.forEach((cKey) => {
    const counts = categoryCounts[cKey];
    let max = 0,
      pick = null;
    for (const [val, cnt] of Object.entries(counts)) {
      if (cnt > max) {
        max = cnt;
        pick = val;
      }
    }
    categoryAgg[cKey] = pick || "none";
  });

  // 6) Location 문서 업데이트
  await Location.findByIdAndUpdate(locationId, {
    aggregatedAnalysis: {
      sentiments: sentimentAgg,
      categories: categoryAgg,
    },
  });
}

module.exports = { recomputeLocationAnalysis };
