const Review = require("../models/Review");
const Location = require("../models/Location");

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

exports.getReviewsByLocation = async (req, res) => {
  try {
    const locationId = req.params.locationId;

    const reviews = await Review.find({ location: locationId }).select(
      "author content"
    );

    res.status(200).json({
      message: "리뷰 목록 조회 성공",
      reviews,
    });
  } catch (err) {
    console.error("❌ 리뷰 조회 실패:", err);
    res.status(500).json({ error: "리뷰 조회 실패", detail: err.message });
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

exports.createReviewAndLinkToLocation = async (req, res) => {
  try {
    const content = req.body.content;
    const userId = req.user._id;
    const locationId = req.params.locationId;

    // ✅ 리뷰 저장
    const newReview = new Review({
      content,
      author: userId,
      location: locationId,
    });

    const savedReview = await newReview.save();

    // Location 문서에 content 자체를 push
    const updatedLocation = await Location.findByIdAndUpdate(
      locationId,
      { $push: { review: content } }, // 🔥 내용 자체 저장
      { new: true }
    );

    if (!updatedLocation) {
      return res.status(404).json({ message: "해당 장소를 찾을 수 없습니다." });
    }

    res.status(201).json({
      message: "리뷰 등록 및 장소에 연결 완료",
      review: savedReview,
    });
  } catch (err) {
    console.error("❌ 리뷰 저장 실패:", err);
    res.status(500).json({ error: "리뷰 저장 실패", detail: err.message });
  }
};
