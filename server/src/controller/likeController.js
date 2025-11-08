// server/src/controller/likeController.js

const User = require("../models/User");
const Location = require("../models/Location");

// 간단한 코사인 유사도 계산 함수 (태그 -> 가중치 형태의 벡터를 object로 표현)
function cosineSimilarity(vecA, vecB) {
  const keys = new Set([...Object.keys(vecA), ...Object.keys(vecB)]);
  let dot = 0;
  let normA = 0;
  let normB = 0;

  keys.forEach((key) => {
    const a = vecA[key] || 0;
    const b = vecB[key] || 0;
    dot += a * b;
    normA += a * a;
    normB += b * b;
  });

  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

//사용자 좋아요 추가
exports.addUserLike = async (req, res) => {
  const { userId } = req.params;
  const { locationId } = req.body;

  // 1) 사용자 문서에 좋아요 추가
  await User.findByIdAndUpdate(
    userId,
    { $addToSet: { likes: locationId } },
    { new: true }
  );

  // 2) 장소 문서 likes 카운터 +1
  const location = await Location.findByIdAndUpdate(
    locationId,
    { $inc: { likes: 1 } },
    { new: true }
  );

  if (!location) {
    return res.status(404).json({ message: "장소 없음" });
  }

  res.status(200).json({
    message: "사용자 좋아요 추가됨",
    userLikes: undefined, // 필요 시 User.findById(userId).likes 로 채워서 반환
    locationLikes: location.likes,
  });
};

//사용자 좋아요 조회
exports.getUserLikes = async (req, res) => {
  const { userId } = req.params;

  const user = await User.findById(userId).populate("likes", "name address");

  res.status(200).json({ likes: user.likes });
};

//사용자 좋아요 삭제
exports.removeUserLike = async (req, res) => {
  const { userId } = req.params;
  const { locationId } = req.body;

  // 1) 사용자 문서에서 좋아요 제거
  await User.findByIdAndUpdate(
    userId,
    { $pull: { likes: locationId } },
    { new: true }
  );

  // 2) 장소 문서 likes 카운터 –1
  const location = await Location.findByIdAndUpdate(
    locationId,
    { $inc: { likes: -1 } },
    { new: true }
  );
  if (!location) {
    return res.status(404).json({ message: "장소 없음" });
  }

  res.status(200).json({
    message: "사용자 좋아요 삭제됨",
    locationLikes: location.likes,
  });
};

//장소 좋아요 수 조회
exports.getLocationLikes = async (req, res) => {
  const { locationId } = req.params;

  const location = await Location.findById(locationId);

  if (!location) return res.status(404).json({ message: "장소 없음" });

  res.status(200).json({ likes: location.likes });
};

// ✅ 사용자 좋아요 기반 장소 추천
// GET /api/users/:userId/likes/recommendations
// (필요하다면 query/body로 limit, city 필터 등을 확장 가능)
exports.recommendByLikes = async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = Number(req.query.limit) || 20; // ?limit=10 형식으로 조절 가능

    // 1) 유저 + 좋아요 목록 조회
    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).json({ message: "사용자 없음" });
    }

    const likedIds = user.likes || [];
    if (!likedIds.length) {
      return res.status(200).json({
        message: "좋아요한 장소가 없어 추천할 수 없습니다.",
        recommendations: [],
      });
    }

    // 2) 좋아요한 장소들 조회 (감성/카테고리 정보 포함)
    const likedLocations = await Location.find({ _id: { $in: likedIds } })
      .select("_id title addr1 cityKey aggregatedAnalysis")
      .lean();

    if (!likedLocations.length) {
      return res.status(200).json({
        message: "좋아요한 장소 정보가 없어 추천할 수 없습니다.",
        recommendations: [],
      });
    }

    // 3) 좋아요한 장소들의 태그 벡터 만들기 (aggregatedAnalysis.categories 기반)
    const userVector = {};
    likedLocations.forEach((loc) => {
      const cats = loc?.aggregatedAnalysis?.categories || {};
      Object.values(cats).forEach((cat) => {
        const tagId = String(cat?.value?.tag || "");
        if (!tagId) return;
        const count = cat.count || 1;
        userVector[tagId] = (userVector[tagId] || 0) + count;
      });
    });

    // 4) 후보: 아직 좋아요하지 않은 나머지 장소들
    const candidates = await Location.find({
      _id: { $nin: likedIds },
    })
      .select("_id title addr1 cityKey aggregatedAnalysis likes firstimage")
      .lean();

    if (!candidates.length) {
      return res.status(200).json({
        message: "추천 가능한 다른 장소가 없습니다.",
        recommendations: [],
      });
    }

    // 5) 각 후보에 대해 유사도(코사인) 계산
    const scored = candidates.map((loc) => {
      const cats = loc?.aggregatedAnalysis?.categories || {};
      const locVector = {};
      Object.values(cats).forEach((cat) => {
        const tagId = String(cat?.value?.tag || "");
        if (!tagId) return;
        const count = cat.count || 1;
        locVector[tagId] = (locVector[tagId] || 0) + count;
      });

      const score = cosineSimilarity(userVector, locVector);
      return { loc, score };
    });

    // 6) 점수 기준으로 정렬 (동점이면 likes 수로 한 번 더 정렬)
    scored.sort((a, b) => {
      if (b.score === a.score) {
        return (b.loc.likes || 0) - (a.loc.likes || 0);
      }
      return b.score - a.score;
    });

    const topN = scored.slice(0, Math.max(1, Math.min(100, limit)));

    // 7) 프론트에서 쓰기 좋은 형태로 반환
    res.status(200).json({
      message: "좋아요 기반 추천 성공",
      totalCandidates: scored.length,
      recommendations: topN.map(({ loc, score }) => ({
        id: loc._id,
        title: loc.title,
        firstimage: loc.firstimage || "",
        address: loc.addr1,
        city: loc.cityKey,
        likes: loc.likes || 0,
        similarity: Number(score.toFixed(3)),
      })),
    });
  } catch (err) {
    console.error("❌ 좋아요 기반 추천 에러:", err);
    res.status(500).json({ message: "추천 조회 실패" });
  }
};
