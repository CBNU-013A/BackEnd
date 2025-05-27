const mongoose = require("mongoose");

const ReviewSchema = new mongoose.Schema({
  content: { type: String, required: true }, // 텍스트 리뷰
  author: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  keywords: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Keyword",
    required: true,
  },
  //이건 프론트에서 location ID받아야함
  location: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Location",
    required: true,
  },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Review", ReviewSchema);
