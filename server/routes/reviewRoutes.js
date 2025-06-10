const express = require("express");
const router = express.Router();
const auth = require("../middlewares/authMiddleware");
const reviewController = require("../controller/reviewController");

// POST /review/analyze
router.post(
  "/model/analyze",
  auth, // 인증 필요 없으면 빼도 OK
  reviewController.analyzeReview
);

router.post("/:locationId", auth, reviewController.createReview); // POST 요청으로 리뷰 저장
router.delete("/:reviewId", auth, reviewController.deleteReview); // DELETE 요청으로 리뷰 삭제
router.patch("/:reviewId", auth, reviewController.updateReview); // 리뷰 수정
router.get("/:locationId", auth, reviewController.getReviewsByLocation); // 리뷰 조회

router.get("/user/:userId", auth, reviewController.getReviewsByUser); // 사용자별 리뷰 조회

module.exports = router;
