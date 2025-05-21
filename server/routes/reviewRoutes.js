const express = require("express");
const router = express.Router();
const auth = require("../middlewares/authMiddleware");
const reviewController = require("../controller/reviewController");

router.post("/review/:locationId", auth, reviewController.createReview); // POST 요청으로 리뷰 저장

module.exports = router;
