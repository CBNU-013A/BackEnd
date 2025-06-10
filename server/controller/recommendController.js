// controller/recommendController.js
const User = require("../models/User");
const Location = require("../models/Location");
const { cosineSimilarity } = require("../utils/cosine");

exports.recommendByUser = async (req, res) => {
  const { userId } = req.params;

  // 1) 유저 선호 조회
  const user = await User.findById(userId).lean();
  if (!user?.preferences?.length) {
    return res.status(404).json({ message: "사용자 선호 정보가 없습니다." });
  }
  const prefs = user.preferences.map(String);

  // 2) 모든 Location
  const locs = await Location.find()
    .select(
      "_id title aggregatedAnalysis.categories aggregatedAnalysis.sentiments"
    )
    .lean();

  // 3) 평가
  const scores = locs.map((loc) => {
    const locCats = loc.aggregatedAnalysis.categories; // { subId: freq, ... }
    const locSenti = loc.aggregatedAnalysis.sentiments; // { keyId: {pos,neg,none}, ... }

    // 3-1) User vs Location 코사인 유사도 (categories)
    // build simple userVec: 선택된 sub는 1, 나머지는 0
    const userVec = {};
    for (const subId in locCats) {
      userVec[subId] = prefs.includes(subId) ? 1 : 0;
    }
    const baseScore = cosineSimilarity(userVec, locCats);

    // 3-2) 부정 감성 합계 & 전체 감성 합계 (prefs에 해당하는 키워드만)
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

    // 3-3) 최종 점수: 부정 비율만큼 감점
    const finalScore = baseScore * (1 - negRatio);

    return { location: loc, baseScore, negRatio, score: finalScore };
  });

  // 4) 정렬 & 상위 5개
  scores.sort((a, b) => b.score - a.score);
  const top5 = scores.slice(0, 5);

  // 5) 응답
  res.json({
    message: "추천 완료",
    recommendations: top5.map(({ location, baseScore, negRatio, score }) => ({
      id: location._id,
      title: location.title,
      similarity: Number(baseScore.toFixed(3)),
      negPenalty: Number(negRatio.toFixed(3)),
      finalScore: Number(score.toFixed(3)),
    })),
  });
};
