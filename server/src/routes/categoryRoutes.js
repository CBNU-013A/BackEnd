// routes/categoryRoutes.js
const express = require("express");
const router = express.Router();
const ctrl = require("../controller/categoryController");

// 1) 대분류 전체 조회
//    GET /api/categories
router.get("/", ctrl.listCategories);

// 2) 대분류 ID로 소분류 조회
//    GET /api/categories/:categoryId/subkeywords
router.get("/:categoryId/subkeywords", ctrl.listSubcategories);

// 3) 사용자 선택한 소분류 4개 한 번에 POST
//    POST /api/categories/selections
router.post("/selections", ctrl.submitSelections);

module.exports = router;
