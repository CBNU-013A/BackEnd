// routes/featureRoutes.js
const express = require("express");
const router = express.Router();
const auth = require("../../middlewares/authMiddleware"); // 필요 시 적용
const featureCtrl = require("../controller/featureController");

// 1) 8개 기능성 카테고리 조회
//    GET  /api/features
router.get("/", auth, featureCtrl.listFeatures);

// 2) 사용자가 고른 기능성 카테고리 최대 3개 POST
//    POST /api/features/selections
router.post("/selections", auth, featureCtrl.submitFeatures);

module.exports = router;
