const express = require("express");
const router = express.Router();
const auth = require("../middlewares/authMiddleware");
const reviewController = require("../controller/reviewController");

router.post("/:locationId", auth, reviewController.createReview); // POST 요청으로 리뷰 저장
router.delete("/:reviewId", auth, reviewController.deleteReview); // DELETE 요청으로 리뷰 삭제
router.patch("/:reviewId", auth, reviewController.updateReview); // 리뷰 수정

//리뷰 작성시 location review에 저장
router.post(
  "/:locationId/addLocation",
  auth,
  reviewController.createReviewAndLinkToLocation
);
module.exports = router;
