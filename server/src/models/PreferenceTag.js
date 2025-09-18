// models/PreferenceTag.js
const mongoose = require("mongoose");

const sentimentSchema = new mongoose.Schema(
  {
    pos: { type: Number, default: 0 },
    neg: { type: Number, default: 0 },
  },
  { _id: false }
);

const preferenceTagSchema = new mongoose.Schema({
  name: { type: String, required: true },
  sentiment: sentimentSchema,
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category", // 🔗 Category 모델을 참조
    required: true,
  },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

module.exports =
  mongoose.models.PreferenceTag || mongoose.model("PreferenceTag", preferenceTagSchema);
