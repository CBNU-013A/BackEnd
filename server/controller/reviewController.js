const Review = require("../models/Review");

exports.createReview = async (req, res) => {
  try {
    const content = req.body.content;
    const userId = req.user._id; // ✅ JWT에서 해석된 사용자 ID
    const locationId = req.params.locationId; // ✅ URL 경로에서 가져옴;

    const review = new Review({
      content,
      author: userId,
      location: locationId,
    });

    await review.save();

    res.status(201).json({ message: "리뷰 등록 성공", review });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "리뷰 저장 실패" });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const reviewId = req.params.reviewId;
    const userId = req.user._id;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: "리뷰가 존재하지 않습니다." });
    }

    if (review.author.toString() !== userId.toString()) {
      return res.status(403).json({ message: "리뷰 삭제 권한이 없습니다." });
    }

    await Review.findByIdAndDelete(reviewId);

    res.status(200).json({ message: "리뷰 삭제 성공" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "리뷰 삭제 실패" });
  }
};

exports.updateReview = async (req, res) => {
  try {
    const reviewId = req.params.reviewId;
    const userId = req.user._id;
    const { content, keywords } = req.body;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ message: "리뷰를 찾을 수 없습니다." });
    }

    if (review.author.toString() !== userId.toString()) {
      return res.status(403).json({ message: "수정 권한이 없습니다." });
    }

    // 수정할 필드만 변경
    if (content !== undefined) review.content = content;
    if (keywords !== undefined) review.keywords = keywords;

    await review.save();

    res.status(200).json({ message: "리뷰 수정 완료", review });
  } catch (err) {
    console.error("❌ 리뷰 수정 실패:", err);
    res.status(500).json({ error: "리뷰 수정 실패", detail: err.message });
  }
};
