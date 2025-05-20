const Review = require("../models/Review");

exports.createReview = async (req, res) => {
  try {
    const { content, author, locationId } = req.body;

    const review = new Review({
      content,
      author,
      location: locationId,
    });

    await review.save();

    res.status(201).json({ message: "리뷰 등록 성공", review });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "리뷰 저장 실패" });
  }
};
