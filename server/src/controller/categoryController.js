// controller/categoryController.js
const Category = require("../models/Category");
const PreferenceTag = require("../models/PreferenceTag");

// 1) 모든 카테고리 조회 GET /api/categories
exports.listCategories = async (req, res) => {
  try {
    const categories = await Category.find().lean();
    res.status(200).json({ categories });
  } catch (err) {
    console.error("❌ 카테고리 조회 실패:", err);
    res.status(500).json({ message: "❌ 카테고리 조회 실패" });
  }
};

// 2) 특정 카테고리 태그(PreferenceTag) 조회 GET /api/categories/:categoryId/preferenceTags
exports.listPreferenceTags = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const preferenceTags = await PreferenceTag.find({
      category: categoryId,
    }).lean();
    res.status(200).json({ preferenceTags });
  } catch (err) {
    console.error("❌ PreferenceTag 조회 실패:", err);
    res.status(500).json({ message: "❌ PreferenceTag 조회 실패" });
  }
};

// 3) 프론트에서 받은 PreferenceTag ID 배열 처리 POST /api/categories/selections
// body: { selections: [ preferenceTagId1, preferenceTagId2, ... ] }
exports.submitSelections = async (req, res) => {
  try {
    const { selections } = req.body;
    if (!Array.isArray(selections) || selections.length !== 4) {
      return res.status(400).json({ message: "PreferenceTag를 4개 선택해주세요." });
    }

    // PreferenceTag + category 정보 함께 조회
    const subs = await PreferenceTag.find({ _id: { $in: selections } })
      .populate("category", "name")
      .lean();

    // 만약 중간에 누락된 ID가 있으면 404
    if (subs.length !== selections.length) {
      return res
        .status(404)
        .json({ message: "존재하지 않는 PreferenceTag ID가 있습니다." });
    }

    // 프론트에 보낼 형태로 가공
    const result = subs.map((s) => ({
      categoryId: s.category._id,
      categoryName: s.category.name,
      preferenceTagId: s._id,
      preferenceTagName: s.name,
    }));

    res.status(200).json({
      message: "선택된 PreferenceTag 처리 완료",
      selections: result,
    });
  } catch (err) {
    console.error("PreferenceTag 선택 처리 실패:", err);
    res.status(500).json({ message: "PreferenceTag 선택 처리 실패" });
  }
};
