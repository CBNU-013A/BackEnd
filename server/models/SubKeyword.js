// models/SubKeyword.js
const mongoose = require("mongoose");

const subKeywordSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category", // 🔗 Category 모델을 참조
    required: true,
  },
});

module.exports =
  mongoose.models.SubKeyword || mongoose.model("SubKeyword", subKeywordSchema);
