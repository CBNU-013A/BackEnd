// models/SubKeyword.js
const mongoose = require("mongoose");

const sentimentSchema = new mongoose.Schema(
  {
    pos: { type: Number, default: 0 },
    neg: { type: Number, default: 0 },
  },
  { _id: false }
);

const subKeywordSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sentiment: sentimentSchema,
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category", // 🔗 Category 모델을 참조
    required: true,
  },
});

module.exports =
  mongoose.models.SubKeyword || mongoose.model("SubKeyword", subKeywordSchema);
