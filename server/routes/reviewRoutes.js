const express = require("express");
const router = express.Router();
const reviewController = require("../controller/reviewController");

router.post("/review", reviewController.createReview); // POST 요청으로 리뷰 저장

module.exports = router;
