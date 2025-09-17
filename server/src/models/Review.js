const mongoose = require("mongoose");
const { Schema } = mongoose;

const ReviewSchema = new Schema({
  content: { type: String, required: true }, // 텍스트 리뷰
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
  location: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Location",
    required: true,
  },
  sentimentAspects: [
    {
      type: Schema.Types.ObjectId,
      ref: "SentimentAspect",
      sentiment: {
        pos: { type: Number, default: 0 },
        neg: { type: Number, default: 0 },
        none: { type: Number, default: 0 },
      }
    }
  ],
  categories: [{
    type: Schema.Types.ObjectId,
    ref: "Category",
    value: {
      type: Schema.Types.ObjectId,
      ref: "PreferenceTag",
    },
  }],
  createdAt: { type: Date, default: Date.now },
  isReported: { type: Boolean, default: false },
});

module.exports = mongoose.models.Review || mongoose.model("Review", ReviewSchema);
