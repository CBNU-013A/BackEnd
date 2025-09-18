// server/src/controller/recommendController.js

const User = require("../models/User");
const Location = require("../models/Location");
const City = require("../models/City");
const { cosineSimilarity } = require("../utils/cosine");
const PromptRecommend = require("../models/PromptRecommend");

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

// POST /api/recommend/filter
// body: { accompany, season, place, activity, conveniences }
// Category ObjectId 매핑 (DB에 실제 존재하는 값으로 교체해야 함)
// 카테고리 고정 매핑

// 카테고리 ObjectId 매핑 (DB에 맞게 수정)
const categoryMap = {
  accompany: "68cabaf0a9613e0e59a214cb",
  season: "68cabaf0a9613e0e59a214cc",
  place: "68cabaf0a9613e0e59a214cd",
  activity: "68cabaf0a9613e0e59a214ce",
};

exports.multiStepFilter = async (req, res) => {
  try {
    const {
      userId,
      city = [],
      accompany,
      season,
      place,
      activity,
      conveniences = [],
    } = req.body;

    console.log("📩 요청 body:", req.body);

    // 1) City 매핑
    const cityDocs = await City.find({ name: { $in: city } });
    const cityIds = cityDocs.map((c) => c._id);
    const cityKeys = cityDocs.map((c) => c.name);

    console.log("📌 cityDocs:", cityDocs);
    console.log("📌 cityIds:", cityIds);
    console.log("📌 cityKeys:", cityKeys);

    // 2) Location 필터
    let query = {};
    if (cityKeys.length > 0) {
      query.cityKey = { $in: cityKeys };
    }
    let candidates = await Location.find(query).lean();
    console.log("📌 city 필터 후:", candidates.length);

    // 3) PreferenceTag 필터
    const chosenTags = [accompany, season, place, activity].filter(Boolean);

    if (chosenTags.length > 0) {
      candidates = candidates.filter((loc) => {
        const catEntries = Object.values(
          loc.aggregatedAnalysis?.categories || {}
        );
        return chosenTags.every((tag) =>
          catEntries.some((c) => String(c.value?.tag) === String(tag))
        );
      });
    }

    console.log("📌 preferenceTag 필터 후:", candidates.length);

    if (candidates[0]) {
      console.log("📌 sample preferencesTag:", candidates[0].preferencesTag);
    }

    // 4) SentimentAspect 필터
    if (conveniences.length > 0) {
      console.log("📌 Sentiment filter 적용, conveniences:", conveniences);
      candidates = candidates
        .map((loc) => {
          let score = 0;
          conveniences.forEach((aspectId) => {
            const asp = loc.aggregatedAnalysis?.sentiments?.[aspectId];
            console.log("   🔎 aspectId:", aspectId, "-> asp:", asp);
            if (asp) {
              const total = (asp.pos || 0) + (asp.neg || 0) + (asp.none || 0);
              if (total > 0) {
                score += asp.pos / total;
              }
            }
          });
          return { ...loc, convenienceScore: score / conveniences.length };
        })
        .sort((a, b) => b.convenienceScore - a.convenienceScore);
    }

    console.log("📌 편의성 필터 후:", candidates.length);

    // 5) 최대 10개
    const topLocations = candidates.slice(0, 20);

    // 6) PromptRecommend 저장
    const saved = await PromptRecommend.create({
      userId,
      city: cityIds,
      category: [
        accompany && {
          category: categoryMap.accompany,
          value: { tag: accompany },
        },
        season && { category: categoryMap.season, value: { tag: season } },
        place && { category: categoryMap.place, value: { tag: place } },
        activity && {
          category: categoryMap.activity,
          value: { tag: activity },
        },
      ].filter(Boolean),
      sentimentAspects: conveniences,
      result: topLocations.map((l) => l._id),
    });

    res.json({
      message: "추천 완료",
      totalCandidates: candidates.length,
      recommendations: topLocations.map((loc) => ({
        id: loc._id,
        title: loc.title,
        city: loc.cityKey,
        convenienceScore: loc.convenienceScore || null,
      })),
      savedId: saved._id,
    });
  } catch (err) {
    console.error("❌ multiStepFilter 에러:", err);
    res.status(500).json({ error: err.message });
  }
};
