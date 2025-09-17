// controller/recommendController.js
const User = require("../models/User");
const Location = require("../models/Location");
const { cosineSimilarity } = require("../utils/cosine");

// POST /api/recommend
// body: { userId, cities?: ["청주","충주"], limit?: 10 }
exports.recommendByRegion = async (req, res) => {
  try {
    const { userId, cities = [], limit = 10 } = req.body;

    // 유저 선호
    const user = await User.findById(userId).lean();
    if (!user?.preferences?.length) {
      return res.status(404).json({ message: "사용자 선호 정보가 없습니다." });
    }
    const prefs = user.preferences.map(String);

    // 지역 필터
    const query = { province: "충청북도" };
    if (cities.length > 0) {
      query.cityKey = { $in: cities };
    }

    // 장소 조회
    const locs = await Location.find(query)
      .select("_id title addr1 cityKey aggregatedAnalysis")
      .lean();

    if (!locs.length) {
      return res.status(404).json({ message: "조건에 맞는 장소가 없습니다." });
    }

    // 점수 계산 (recommendByUser와 동일)
    const scores = locs.map((loc) => {
      const locCats = loc?.aggregatedAnalysis?.categories || {};
      const locSenti = loc?.aggregatedAnalysis?.sentiments || {};

      const userVec = {};
      for (const subId in locCats) {
        userVec[subId] = prefs.includes(subId) ? 1 : 0;
      }
      const baseScore = cosineSimilarity(userVec, locCats);

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

    scores.sort((a, b) => b.score - a.score);
    const topN = scores.slice(0, Math.max(1, Math.min(100, limit)));

    res.json({
      message: "추천 완료",
      appliedCities: cities.length > 0 ? cities : "전체",
      recommendations: topN.map(({ location, baseScore, negRatio, score }) => ({
        id: location._id,
        title: location.title,
        address: location.addr1,
        city: location.cityKey,
        similarity: Number(baseScore.toFixed(3)),
        negPenalty: Number(negRatio.toFixed(3)),
        finalScore: Number(score.toFixed(3)),
      })),
    });
  } catch (e) {
    console.error("[recommendByRegion]", e);
    res.status(500).json({ error: e.message });
  }
};

// POST /api/recommend/user/:userId
// body: { cities?: ["청주","충주"], limit?: 10 }
exports.recommendByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { cities = [], limit = 10 } = req.body;

    // 1) 유저 선호
    const user = await User.findById(userId).lean();
    if (!user?.preferences?.length) {
      return res.status(404).json({ message: "사용자 선호 정보가 없습니다." });
    }
    const prefs = user.preferences.map(String);

    // 2) 지역 필터
    const query = { province: "충청북도" };
    if (cities.length > 0) {
      query.cityKey = { $in: cities }; // ["청주","충주"]
    }

    // 3) 후보 장소 조회
    const locs = await Location.find(query)
      .select("_id title addr1 cityKey aggregatedAnalysis")
      .lean();

    if (!locs.length) {
      return res.status(404).json({ message: "조건에 맞는 장소가 없습니다." });
    }

    // 4) 점수 계산 (기존 로직)
    const scores = locs.map((loc) => {
      const locCats = loc?.aggregatedAnalysis?.categories || {};
      const locSenti = loc?.aggregatedAnalysis?.sentiments || {};

      const userVec = {};
      for (const subId in locCats) {
        userVec[subId] = prefs.includes(subId) ? 1 : 0;
      }
      const baseScore = cosineSimilarity(userVec, locCats);

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

    scores.sort((a, b) => b.score - a.score);
    const topN = scores.slice(0, Math.max(1, Math.min(100, limit)));

    res.json({
      message: "추천 완료",
      appliedCities: cities.length > 0 ? cities : "전체",
      recommendations: topN.map(({ location, baseScore, negRatio, score }) => ({
        id: location._id,
        title: location.title,
        address: location.addr1,
        city: location.cityKey,
        similarity: Number(baseScore.toFixed(3)),
        negPenalty: Number(negRatio.toFixed(3)),
        finalScore: Number(score.toFixed(3)),
      })),
    });
  } catch (e) {
    console.error("[recommendByUser]", e);
    res.status(500).json({ error: e.message });
  }
};
