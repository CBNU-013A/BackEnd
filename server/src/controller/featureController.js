// controller/featureController.js
const Keyword = require("../models/SentimentAspect");

// 8개 기능성 키워드 명칭
const FEATURE_NAMES = [
  "시설관리",
  "화장실",
  "활동",
  "주차차",
  "혼잡도",
  "접근성",
  "편의시설",
  "가성비",
  "아이 동반",
  "노약자 동반",
  "장소",
];

/**
 * GET /api/features
 * — Keyword 콜렉션에서 8개 기능성 키워드만 조회
 */
exports.listFeatures = async (req, res) => {
  try {
    const features = await Keyword.find({
      name: { $in: FEATURE_NAMES },
    }).lean();

    res.status(200).json({ features });
  } catch (err) {
    console.error("기능성 키워드 조회 실패:", err);
    res.status(500).json({ message: "기능성 키워드 조회 실패" });
  }
};

/**
 * POST /api/features/selections
 * body: { features: [ featureId1, featureId2, … ] }
 * — 최대 3개 선택, Keyword 콜렉션에서 유효성 검사 후 리턴
 */
exports.submitFeatures = async (req, res) => {
  try {
    const { features } = req.body;

    if (!Array.isArray(features)) {
      return res.status(400).json({ message: "features는 배열이어야 합니다." });
    }
    if (features.length < 1 || features.length > 3) {
      return res
        .status(400)
        .json({ message: "최소 1개, 최대 3개까지 선택 가능합니다." });
    }

    // 선택된 ID들이 실제 8개 기능성 키워드 안에 있는지 검증
    const docs = await Keyword.find({
      _id: { $in: features },
      name: { $in: FEATURE_NAMES },
    }).lean();

    if (docs.length !== features.length) {
      return res
        .status(400)
        .json({ message: "잘못된 기능성 키워드 ID가 포함되어 있습니다." });
    }

    // 응답에 보낼 {_id, name} 형태로 가공
    const result = docs.map((d) => ({ _id: d._id, name: d.name }));

    res.status(200).json({
      message: "기능성 키워드 선택 완료",
      selections: result,
    });
  } catch (err) {
    console.error("기능성 키워드 선택 실패:", err);
    res.status(500).json({ message: "기능성 키워드 선택 실패" });
  }
};
