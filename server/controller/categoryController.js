// controller/categoryController.js
const Category = require("../models/Category");
const Subcategory = require("../models/SubKeyword");

/**
 * 1) 모든 대분류 조회
 * GET /api/categories
 */
exports.listCategories = async (req, res) => {
  try {
    const categories = await Category.find().lean();
    res.status(200).json({ categories });
  } catch (err) {
    console.error("대분류 조회 실패:", err);
    res.status(500).json({ message: "대분류 조회 실패" });
  }
};

/**
 * 2) 특정 대분류의 소분류 조회
 * GET /api/categories/:categoryId/subcategories
 */
exports.listSubcategories = async (req, res) => {
  try {
    const { categoryId } = req.params;
    const subcategories = await Subcategory.find({
      category: categoryId,
    }).lean();
    res.status(200).json({ subcategories });
  } catch (err) {
    console.error("소분류 조회 실패:", err);
    res.status(500).json({ message: "소분류 조회 실패" });
  }
};

/**
 * 3) 프론트에서 받은 소분류 ID 배열 처리
 * POST /api/categories/selections
 * body: { selections: [ subId1, subId2, ... ] }
 */
exports.submitSelections = async (req, res) => {
  try {
    const { selections } = req.body;
    if (!Array.isArray(selections) || selections.length !== 4) {
      return res.status(400).json({ message: "소분류를 4개 선택해주세요." });
    }

    // subcategories + category 정보 함께 조회
    const subs = await Subcategory.find({ _id: { $in: selections } })
      .populate("category", "name")
      .lean();

    // 만약 중간에 누락된 ID가 있으면 404
    if (subs.length !== selections.length) {
      return res
        .status(404)
        .json({ message: "존재하지 않는 소분류 ID가 있습니다." });
    }

    // 프론트에 보낼 형태로 가공
    const result = subs.map((s) => ({
      categoryId: s.category._id,
      categoryName: s.category.name,
      subcategoryId: s._id,
      subcategoryName: s.name,
    }));

    res.status(200).json({
      message: "선택된 소분류 처리 완료",
      selections: result,
    });
  } catch (err) {
    console.error("선택 처리 실패:", err);
    res.status(500).json({ message: "선택 처리 실패" });
  }
};
