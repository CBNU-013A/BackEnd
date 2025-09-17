// routes/recommendRoutes.js
const express = require("express");
const router = express.Router();
const auth = require("../middlewares/authMiddleware");
const recCtrl = require("../controller/recommendController");

// 사용자 ID 기준 추천
// POST /api/recommend/:userId
router.post("/:userId", auth, recCtrl.recommendByUser);

// 추천 (도시 비어있으면 11개 전체로 간주)
router.post("/", recCtrl.recommendByRegion);

module.exports = router;
