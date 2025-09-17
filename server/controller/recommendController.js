// controller/recommendController.js
const User = require("../models/User");
const Location = require("../models/Location");
const { cosineSimilarity } = require("../utils/cosine");

// 충청북도 11개 시군
const ALL_CHUNGBUK_CITIES = [
  "청주",
  "제천",
  "충주",
  "진천",
  "음성",
  "괴산",
  "단양",
  "보은",
  "옥천",
  "영동",
  "증평",
];

function escapeRegex(str) {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildCityOrFilters(cities, province = "충청북도") {
  const cityList = (Array.isArray(cities) ? cities : [])
    .map((s) => s.trim())
    .filter(Boolean);
  const finalCities = cityList.length > 0 ? cityList : ALL_CHUNGBUK_CITIES;

  const provinceSafe = escapeRegex(province);
  const filters = finalCities.map((city) => {
    const citySafe = escapeRegex(city);
    // "충청북도 <city>(시|군|구)" 로 시작  ← (구)도 포함 추천
    const regex = new RegExp(
      `^\\s*${provinceSafe}\\s+${citySafe}(시|군|구)\\b`
    );
    return { address: { $regex: regex } };
  });

  return {
    orFilters: filters,
    appliedCities: finalCities,
    province: "충청북도",
  };
}

function scoreLocations(locs, prefs) {
  return locs.map((loc) => {
    const locCats = loc?.aggregatedAnalysis?.categories || {};
    const locSenti = loc?.aggregatedAnalysis?.sentiments || {};

    // user one-hot for keys present in loc
    const userVec = {};
    for (const subId in locCats)
      userVec[subId] = prefs.includes(String(subId)) ? 1 : 0;

    const baseScore = cosineSimilarity(userVec, locCats);

    // neg ratio on prefs
    let negSum = 0,
      totalSent = 0;
    for (const keyId of prefs) {
      const s = locSenti[keyId];
      if (s) {
        negSum += s.neg || 0;
        totalSent += (s.pos || 0) + (s.neg || 0) + (s.none || 0);
      }
    }
    const negRatio = totalSent > 0 ? negSum / totalSent : 0;
    const finalScore = baseScore * (1 - negRatio);

    return { location: loc, baseScore, negRatio, score: finalScore };
  });
}

/**
 * POST /api/recommend
 * body: {
 *   userId: string,
 *   cities?: string[],         // 비어있으면 충북 11개 전체
 *   limit?: number,            // 기본 10
 *   disableRegion?: boolean,   // true면 지역 필터 끔(= 기존 byUser)
 *   province?: string          // 확장용, 기본 "충청북도"
 * }
 */
exports.recommend = async (req, res) => {
  try {
    const {
      userId,
      cities = [],
      limit = 10,
      disableRegion = false,
      province = "충청북도",
    } = req.body;

    // 1) 유저 선호
    const user = await User.findById(userId).lean();
    if (!user?.preferences?.length) {
      return res.status(404).json({ message: "사용자 선호 정보가 없습니다." });
    }
    const prefs = user.preferences.map(String);

    // 2) 장소 조회 (지역 필터 on/off)
    let query = {};
    let regionMeta = { appliedCities: [], province: null, disabled: false };

    if (!disableRegion) {
      const { orFilters, appliedCities } = buildCityOrFilters(cities, province);
      query = { $or: orFilters };
      regionMeta = { appliedCities, province, disabled: false };
    } else {
      // 지역 필터 해제 = 전체에서 추천
      regionMeta = { appliedCities: [], province: null, disabled: true };
    }

    const locs = await Location.find(query)
      .select(
        "_id title address aggregatedAnalysis.categories aggregatedAnalysis.sentiments"
      )
      .lean();

    if (!locs.length) {
      return res
        .status(404)
        .json({ message: "조건에 맞는 장소가 없습니다.", region: regionMeta });
    }

    // 3) 점수 계산 + 상위 N
    const scores = scoreLocations(locs, prefs);
    scores.sort((a, b) => b.score - a.score);
    const topN = scores.slice(
      0,
      Math.max(1, Math.min(100, Number(limit) || 10))
    );

    // 4) 응답
    res.json({
      message: "추천 완료",
      region: regionMeta,
      totalCandidates: scores.length,
      limit: topN.length,
      recommendations: topN.map(({ location, baseScore, negRatio, score }) => ({
        id: location._id,
        title: location.title,
        address: location.address,
        similarity: Number(baseScore.toFixed(3)),
        negPenalty: Number(negRatio.toFixed(3)),
        finalScore: Number(score.toFixed(3)),
      })),
    });
  } catch (e) {
    console.error("[recommend error]", e);
    res.status(500).json({ error: e.message });
  }
};

// exports.recommendByUser = async (req, res) => {
//   const { userId } = req.params;

//   // 1) 유저 선호 조회
//   const user = await User.findById(userId).lean();
//   if (!user?.preferences?.length) {
//     return res.status(404).json({ message: "사용자 선호 정보가 없습니다." });
//   }
//   const prefs = user.preferences.map(String);

//   // 2) 모든 Location
//   const locs = await Location.find()
//     .select(
//       "_id title aggregatedAnalysis.categories aggregatedAnalysis.sentiments"
//     )
//     .lean();

//   // 3) 평가
//   const scores = locs.map((loc) => {
//     const locCats = loc.aggregatedAnalysis.categories; // { subId: freq, ... }
//     const locSenti = loc.aggregatedAnalysis.sentiments; // { keyId: {pos,neg,none}, ... }

//     // 3-1) User vs Location 코사인 유사도 (categories)
//     // build simple userVec: 선택된 sub는 1, 나머지는 0
//     const userVec = {};
//     for (const subId in locCats) {
//       userVec[subId] = prefs.includes(subId) ? 1 : 0;
//     }
//     const baseScore = cosineSimilarity(userVec, locCats);

//     // 3-2) 부정 감성 합계 & 전체 감성 합계 (prefs에 해당하는 키워드만)
//     let negSum = 0,
//       totalSent = 0;
//     for (const keyId of prefs) {
//       const s = locSenti[keyId];
//       if (s) {
//         negSum += s.neg || 0;
//         totalSent += (s.pos || 0) + (s.neg || 0) + (s.none || 0);
//       }
//     }
//     const negRatio = totalSent > 0 ? negSum / totalSent : 0;

//     // 3-3) 최종 점수: 부정 비율만큼 감점
//     const finalScore = baseScore * (1 - negRatio);

//     return { location: loc, baseScore, negRatio, score: finalScore };
//   });

//   // 4) 정렬 & 상위 5개
//   scores.sort((a, b) => b.score - a.score);
//   const top5 = scores.slice(0, 10);

//   // 5) 응답
//   res.json({
//     message: "추천 완료",
//     recommendations: top5.map(({ location, baseScore, negRatio, score }) => ({
//       id: location._id,
//       title: location.title,
//       similarity: Number(baseScore.toFixed(3)),
//       negPenalty: Number(negRatio.toFixed(3)),
//       finalScore: Number(score.toFixed(3)),
//     })),
//   });
// };
