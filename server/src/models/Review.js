const mongoose = require("mongoose");
const { Schema } = mongoose;

const ReviewSchema = new mongoose.Schema({
  content: { type: String, required: true }, // 텍스트 리뷰
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
  keywords: [
    {
      keyword: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Keyword",
      },
      sentiment: {
        pos: { type: Number, default: 0 },
        neg: { type: Number, default: 0 },
      },
    },
  ],
  //이건 프론트에서 location ID받아야함
  location: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Location",
    required: true,
  },
  categories: [{ type: Schema.Types.ObjectId, ref: "SubKeyword" }],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Review", ReviewSchema);
