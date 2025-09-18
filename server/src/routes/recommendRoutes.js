// routes/recommendRoutes.js
const express = require("express");
const router = express.Router();
const auth = require("../../middlewares/authMiddleware");
const recCtrl = require("../controller/recommendController");

// POST /api/recommend  (body: { userId, cities?: string[], limit?: number })
router.post("/", recCtrl.recommendByRegion);

// GET/POST /api/recommend/user/:userId
//   예) GET  /api/recommend/user/6543...?cities=청주,제천&limit=10
//       POST /api/recommend/user/6543... { "cities": ["청주","제천"], "limit": 10 }
router
  .route("/user/:userId")
  .get(recCtrl.recommendByUser)
  .post(recCtrl.recommendByUser);

// POST api/recommend/filter카테 고리 추천 api
router.post("/filter", recCtrl.multiStepFilter);

// GET api/recommend/history/:userId 카테고리 추천 기록 조회
router.get("/history/:userId", recCtrl.getRecommendHistory);

module.exports = router;
