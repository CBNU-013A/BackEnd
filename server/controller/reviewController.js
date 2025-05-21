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
