// keywordRoutes.js
const express = require("express");
const router = express.Router();
const keywordsController = require("../controller/keywordsController"); // 🔥 컨트롤러 import

// 🔹 모든 키워드 조회
router.get("/all", keywordsController.getAllKeywords);
router.get("/category", keywordsController.getCategory);

// 🔹 키워드 추가
router.post("/", keywordsController.createKeyword);

// 🔹 키워드 수정
router.put("/:keywordId", keywordsController.updateKeyword);

// 🔹 키워드 삭제
router.delete("/:keywordId", keywordsController.deleteKeyword);

module.exports = router;
